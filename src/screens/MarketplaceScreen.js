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
  ScrollView,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openDatabase } from 'expo-sqlite';
import { BlurView } from 'expo-blur';

const db = openDatabase('quiago_v2.db');
const { width } = Dimensions.get('window');

const MarketplaceScreen = () => {
  const [nfts, setNfts] = useState([]);
  const [selectedNft, setSelectedNft] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kirchoBalance, setKirchoBalance] = useState(1000); // Balance inicial de ejemplo
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintPrice, setMintPrice] = useState('');
  const [processingImage, setProcessingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [price, setPrice] = useState('');

  useEffect(() => {
    initDatabase();
    loadNFTs();
    loadKirchoBalance();
  }, []);

  const initDatabase = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS nft_market (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uri TEXT NOT NULL,
          type TEXT NOT NULL,
          price REAL NOT NULL,
          creator_id INTEGER,
          title TEXT,
          description TEXT,
          resolution TEXT,
          is_sold BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT,
          FOREIGN KEY (creator_id) REFERENCES users (id)
        )`,
        []
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS kircho_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          from_user_id INTEGER,
          to_user_id INTEGER,
          amount REAL NOT NULL,
          nft_id INTEGER,
          type TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (from_user_id) REFERENCES users (id),
          FOREIGN KEY (to_user_id) REFERENCES users (id),
          FOREIGN KEY (nft_id) REFERENCES nft_market (id)
        )`,
        []
      );
    });
  };

  const loadNFTs = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM nft_market WHERE is_sold = 0 ORDER BY created_at DESC',
        [],
        (_, { rows: { _array } }) => setNfts(_array)
      );
    });
  };

  const loadKirchoBalance = () => {
    // Aquí iría la lógica para cargar el balance real de KirchoCoin
  };

  const enhanceImage = async (uri) => {
    try {
      setProcessingImage(true);
      
      // Solo copiar la imagen sin manipulaciones
      const fileName = `nft_${Date.now()}.jpg`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: uri,
        to: newPath,
      });

      return newPath;
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      throw error;
    } finally {
      setProcessingImage(false);
    }
  };

  const mintNFT = async (imageUri, price) => {
    try {
      setLoading(true);
      
      // Mejorar la imagen
      const enhancedUri = await enhanceImage(imageUri);
      
      // Generar metadata del NFT
      const metadata = {
        name: `Quiago NFT #${Date.now()}`,
        description: "NFT creado en la plataforma Quiago",
        image: enhancedUri,
        attributes: {
          resolution: "2048x2048",
          platform: "Quiago",
          blockchain: "KirchoCoin",
        }
      };

      // Guardar en la base de datos
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO nft_market (uri, type, price, creator_id, title, description, resolution, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            enhancedUri,
            'image/jpeg',
            price,
            1, // ID del usuario actual
            metadata.name,
            metadata.description,
            metadata.attributes.resolution,
            JSON.stringify(metadata)
          ],
          (_, result) => {
            Alert.alert('Éxito', 'NFT creado y listado en el mercado');
            loadNFTs();
          }
        );
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el NFT');
    } finally {
      setLoading(false);
      setShowMintModal(false);
    }
  };

  const purchaseNFT = (nft) => {
    if (kirchoBalance < nft.price) {
      Alert.alert('Error', 'No tienes suficientes KirchoCoins (TKS)');
      return;
    }

    Alert.alert(
      'Confirmar compra',
      `¿Deseas comprar este NFT por ${nft.price} TKS?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comprar',
          onPress: () => {
            db.transaction(tx => {
              // Actualizar NFT como vendido
              tx.executeSql(
                'UPDATE nft_market SET is_sold = 1 WHERE id = ?',
                [nft.id]
              );
              
              // Registrar transacción
              tx.executeSql(
                'INSERT INTO kircho_transactions (from_user_id, to_user_id, amount, nft_id, type) VALUES (?, ?, ?, ?, ?)',
                [1, nft.creator_id, nft.price, nft.id, 'NFT_PURCHASE']
              );
            }, error => {
              console.error(error);
              Alert.alert('Error', 'No se pudo completar la compra');
            }, () => {
              setKirchoBalance(prev => prev - nft.price);
              loadNFTs();
              Alert.alert('Éxito', '��NFT comprado correctamente!');
            });
          }
        }
      ]
    );
  };

  const renderNFTItem = ({ item }) => (
    <TouchableOpacity
      style={styles.nftCard}
      onPress={() => setSelectedNft(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.nftImage} />
      <BlurView intensity={80} style={styles.nftInfo}>
        <Text style={styles.nftTitle}>{item.title}</Text>
        <Text style={styles.nftPrice}>{item.price} TKS</Text>
      </BlurView>
      <View style={styles.nftBadge}>
        <MaterialCommunityIcons name="certificate" size={16} color="#FFD700" />
        <Text style={styles.nftBadgeText}>NFT</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mercado Quiago</Text>
        <View style={styles.balanceContainer}>
          <MaterialCommunityIcons name="currency-btc" size={24} color="#FFD700" />
          <Text style={styles.balance}>{kirchoBalance} TKS</Text>
        </View>
      </View>

      <FlatList
        data={nfts}
        renderItem={renderNFTItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
      />

      <TouchableOpacity
        style={styles.mintButton}
        onPress={() => setShowMintModal(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        <Text style={styles.mintButtonText}>Crear NFT</Text>
      </TouchableOpacity>

      {/* Modal de creación de NFT mejorado */}
      <Modal
        visible={showMintModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMintModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Nuevo NFT</Text>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setShowMintModal(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.nftPreviewContainer}>
                {selectedImage ? (
                  <Image 
                    source={{ uri: selectedImage }} 
                    style={styles.nftPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.nftPlaceholder}>
                    <MaterialCommunityIcons name="image-plus" size={48} color="#1E88E5" />
                    <Text style={styles.placeholderText}>Selecciona una imagen</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 1,
                  });

                  if (!result.canceled) {
                    setSelectedImage(result.assets[0].uri);
                  }
                }}
              >
                <MaterialCommunityIcons name="camera" size={24} color="#FFF" />
                <Text style={styles.uploadButtonText}>
                  {selectedImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </Text>
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Precio en TKS</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Ej: 100"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.mintButton,
                  (!selectedImage || !price) && styles.mintButtonDisabled
                ]}
                onPress={() => {
                  if (selectedImage && price) {
                    mintNFT(selectedImage, parseFloat(price));
                  }
                }}
                disabled={!selectedImage || !price}
              >
                <MaterialCommunityIcons 
                  name="rocket-launch" 
                  size={24} 
                  color="#FFF" 
                />
                <Text style={styles.mintButtonText}>Crear NFT</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de detalle de NFT */}
      <Modal
        visible={!!selectedNft}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalContent}>
            <Image
              source={{ uri: selectedNft?.uri }}
              style={styles.detailImage}
              resizeMode="contain"
            />
            <View style={styles.detailInfo}>
              <Text style={styles.detailTitle}>{selectedNft?.title}</Text>
              <Text style={styles.detailDescription}>{selectedNft?.description}</Text>
              <Text style={styles.detailResolution}>Resolución: {selectedNft?.resolution}</Text>
              <Text style={styles.detailPrice}>{selectedNft?.price} TKS</Text>
              
              <TouchableOpacity
                style={styles.purchaseButton}
                onPress={() => {
                  setSelectedNft(null);
                  purchaseNFT(selectedNft);
                }}
              >
                <Text style={styles.purchaseButtonText}>Comprar NFT</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.closeDetailButton}
              onPress={() => setSelectedNft(null)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E88E5',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  balance: {
    color: '#FFF',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  grid: {
    padding: 8,
  },
  nftCard: {
    flex: 1,
    margin: 8,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nftImage: {
    width: '100%',
    aspectRatio: 1,
  },
  nftInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  nftTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nftPrice: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 4,
  },
  nftBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 12,
  },
  nftBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
  },
  mintButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 30,
    elevation: 5,
  },
  mintButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: 'bold',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeModalButton: {
    padding: 5,
  },
  modalScroll: {
    padding: 20,
  },
  nftPreviewContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginBottom: 20,
  },
  nftPreview: {
    width: '100%',
    height: '100%',
  },
  nftPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  priceInput: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  mintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  mintButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  mintButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default MarketplaceScreen; 