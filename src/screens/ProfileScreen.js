import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openDatabase } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';

const db = openDatabase('quiago_v2.db');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    loadProfileImage();
  }, []);

  const loadUserData = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM users LIMIT 1',
        [],
        (_, { rows: { _array } }) => {
          if (_array.length > 0) {
            setUserData(_array[0]);
          }
        },
        (_, error) => {
          console.error('Error cargando datos del usuario:', error);
        }
      );
    });
  };

  const loadProfileImage = async () => {
    try {
      const imagePath = `${FileSystem.documentDirectory}profile_image.jpg`;
      const imageInfo = await FileSystem.getInfoAsync(imagePath);
      if (imageInfo.exists) {
        setProfileImage(imagePath);
      }
    } catch (error) {
      console.error('Error cargando imagen de perfil:', error);
    }
  };

  const handleImagePicker = async (useCamera = false) => {
    try {
      setShowImageOptions(false);
      setLoading(true);

      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Se necesita permiso para acceder a la cámara');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Se necesita permiso para acceder a la galería');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      }

      if (!result.canceled) {
        const imagePath = `${FileSystem.documentDirectory}profile_image.jpg`;
        await FileSystem.copyAsync({
          from: result.assets[0].uri,
          to: imagePath,
        });
        setProfileImage(imagePath);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión? Esto eliminará todos tus datos.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sí, cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Eliminar la imagen de perfil
              const imagePath = `${FileSystem.documentDirectory}profile_image.jpg`;
              const imageInfo = await FileSystem.getInfoAsync(imagePath);
              if (imageInfo.exists) {
                await FileSystem.deleteAsync(imagePath);
              }

              // Eliminar todos los datos de las tablas
              db.transaction(tx => {
                // Eliminar datos de usuario
                tx.executeSql('DELETE FROM users', []);
                // Eliminar ubicaciones guardadas
                tx.executeSql('DELETE FROM locations', []);
                // Eliminar imágenes guardadas de ubicaciones
                tx.executeSql('SELECT images FROM locations', [], async (_, { rows: { _array } }) => {
                  for (const row of _array) {
                    const images = JSON.parse(row.images || '[]');
                    for (const imagePath of images) {
                      const imageInfo = await FileSystem.getInfoAsync(imagePath);
                      if (imageInfo.exists) {
                        await FileSystem.deleteAsync(imagePath);
                      }
                    }
                  }
                });
              }, error => {
                console.error('Error eliminando datos:', error);
                Alert.alert('Error', 'No se pudieron eliminar todos los datos');
              }, () => {
                setLoading(false);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Splash' }],
                });
              });
            } catch (error) {
              setLoading(false);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      
      {/* Header con efecto glassmorphism */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
          <MaterialCommunityIcons 
            name={isEditing ? "check" : "pencil"} 
            size={24} 
            color="#FFF" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Foto de perfil con animación de pulso */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity 
            style={styles.imageWrapper}
            onPress={() => setShowImageOptions(true)}
          >
            <Image
              source={profileImage ? { uri: profileImage } : require('../assets/quiago-icon.jpg')}
              style={styles.profileImage}
            />
            <View style={styles.imageOverlay}>
              <MaterialCommunityIcons name="camera" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </View>

        {/* Información del usuario con diseño mejorado */}
        <View style={styles.infoContainer}>
          <InfoItem
            icon="account"
            label="Nombre"
            value={userData.name}
            isEditing={isEditing}
          />
          <InfoItem
            icon="email"
            label="Correo"
            value={userData.email}
            isEditing={isEditing}
          />
          <InfoItem
            icon="phone"
            label="Teléfono"
            value={userData.phone || 'No especificado'}
            isEditing={isEditing}
          />
          <InfoItem
            icon="map-marker"
            label="Dirección"
            value={userData.address || 'No especificada'}
            isEditing={isEditing}
          />
        </View>

        {/* Sección de configuraciones con iconos animados */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <SettingItem
            icon="bell"
            title="Notificaciones"
            subtitle="Gestionar alertas y sonidos"
            onPress={() => {}}
          />
          <SettingItem
            icon="earth"
            title="Idioma"
            subtitle="Español"
            onPress={() => {}}
          />
          <SettingItem
            icon="shield-lock"
            title="Privacidad"
            subtitle="Configurar visibilidad"
            onPress={() => {}}
          />
          <SettingItem
            icon="help-circle"
            title="Ayuda"
            subtitle="Preguntas frecuentes"
            onPress={() => {}}
          />
          <SettingItem
            icon="logout"
            title="Cerrar Sesión"
            subtitle="Eliminar cuenta y datos"
            onPress={handleLogout}
            color="#FF5252"
          />
        </View>
      </ScrollView>

      {/* Modal para selección de imagen */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar foto de perfil</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleImagePicker(true)}
            >
              <MaterialCommunityIcons name="camera" size={24} color="#1E88E5" />
              <Text style={styles.modalOptionText}>Tomar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleImagePicker(false)}
            >
              <MaterialCommunityIcons name="image" size={24} color="#1E88E5" />
              <Text style={styles.modalOptionText}>Elegir de la galería</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={[styles.modalOptionText, { color: '#FF5252' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      )}
    </SafeAreaView>
  );
};

const InfoItem = ({ icon, label, value, isEditing }) => (
  <View style={styles.infoItem}>
    <MaterialCommunityIcons name={icon} size={24} color="#1E88E5" />
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const SettingItem = ({ icon, title, subtitle, onPress, color = "#333" }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
    <Text style={[styles.settingTitle, { color }]}>{title}</Text>
    <Text style={[styles.settingSubtitle, { color }]}>{subtitle}</Text>
    <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1E88E5',
    padding: 20,
    paddingTop: StatusBar.currentHeight + 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#1E88E5',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 20,
    elevation: 4,
  },
  infoContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    margin: 15,
    padding: 15,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  settingsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    margin: 15,
    padding: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingTitle: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  settingSubtitle: {
    fontSize: 14,
    marginLeft: 15,
    color: '#666',
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    elevation: 5,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1E88E5',
    padding: 8,
    borderRadius: 20,
    elevation: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  modalCancel: {
    marginTop: 10,
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
