import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Text,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openDatabase } from 'expo-sqlite';

const db = openDatabase('quiago_v2.db');
const { width } = Dimensions.get('window');

const MultimediaScreen = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [showAlbumModal, setShowAlbumModal] = useState(false);

  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    initDatabase();
    loadMedia();
    loadAlbums();
  }, []);

  const initDatabase = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS albums (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        []
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS media_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uri TEXT NOT NULL,
          type TEXT NOT NULL,
          album_id INTEGER,
          description TEXT,
          location TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (album_id) REFERENCES albums (id)
        )`,
        []
      );
    });
  };

  const loadMedia = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM media_items ORDER BY created_at DESC',
        [],
        (_, { rows: { _array } }) => setMediaItems(_array)
      );
    });
  };

  const loadAlbums = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM albums',
        [],
        (_, { rows: { _array } }) => setAlbums(_array)
      );
    });
  };

  const createAlbum = (name) => {
    if (!name.trim()) return;
    
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO albums (name) VALUES (?)',
        [name],
        (_, result) => {
          loadAlbums();
          Alert.alert('Éxito', 'Álbum creado correctamente');
        }
      );
    });
  };

  const pickImage = async (useCamera = false) => {
    try {
      setLoading(true);
      let result;

      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Se necesita permiso para acceder a la cámara');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          quality: 1,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Se necesita permiso para acceder a la galería');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          quality: 1,
        });
      }

      if (!result.canceled) {
        const asset = result.assets[0];
        const fileName = `media_${Date.now()}.jpg`;
        const newPath = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.copyAsync({
          from: asset.uri,
          to: newPath
        });

        db.transaction(tx => {
          tx.executeSql(
            'INSERT INTO media_items (uri, type, album_id) VALUES (?, ?, ?)',
            [newPath, 'image', selectedAlbum?.id || null],
            (_, result) => {
              loadMedia();
              Animated.sequence([
                Animated.timing(scaleAnim, {
                  toValue: 1.2,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                })
              ]).start();
            }
          );
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este elemento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            db.transaction(tx => {
              tx.executeSql(
                'DELETE FROM media_items WHERE id = ?',
                [id],
                () => {
                  loadMedia();
                  setSelectedItem(null);
                }
              );
            });
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => setSelectedItem(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
      {item.album_id && (
        <View style={styles.albumBadge}>
          <MaterialCommunityIcons name="folder" size={12} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Galería Quiago</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.albumButton}
            onPress={() => setShowAlbumModal(true)}
          >
            <MaterialCommunityIcons name="folder-plus" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowOptions(true)}
          >
            <MaterialCommunityIcons name="camera-plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {selectedAlbum && (
        <View style={styles.albumHeader}>
          <Text style={styles.albumName}>{selectedAlbum.name}</Text>
          <TouchableOpacity
            onPress={() => setSelectedAlbum(null)}
            style={styles.closeAlbumButton}
          >
            <MaterialCommunityIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={mediaItems.filter(item => 
          !selectedAlbum || item.album_id === selectedAlbum.id
        )}
        numColumns={3}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.gridContainer}
      />

      {/* Modal de opciones de captura */}
      <Modal
        visible={showOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowOptions(false);
                pickImage(true);
              }}
            >
              <MaterialCommunityIcons name="camera" size={24} color="#1E88E5" />
              <Text style={styles.modalOptionText}>Tomar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowOptions(false);
                pickImage(false);
              }}
            >
              <MaterialCommunityIcons name="image" size={24} color="#1E88E5" />
              <Text style={styles.modalOptionText}>Elegir de la galería</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de visualización */}
      <Modal
        visible={!!selectedItem}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.viewerContainer}>
          <Image
            source={{ uri: selectedItem?.uri }}
            style={styles.fullImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedItem(null)}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteItem(selectedItem.id)}
          >
            <MaterialCommunityIcons name="trash-can" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E88E5',
    paddingTop: 50,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  albumButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 10,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gridContainer: {
    padding: 4,
  },
  imageContainer: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    backgroundColor: 'white',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  albumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  cancelOption: {
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  deleteButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(255,0,0,0.5)',
    borderRadius: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  albumName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeAlbumButton: {
    padding: 5,
  },
});

export default MultimediaScreen; 