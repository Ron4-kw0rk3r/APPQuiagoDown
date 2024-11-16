import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { openDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

const db = openDatabase('quiago_v2.db');

const LocationCreatorForm = ({ navigation, route }) => {
  const [location, setLocation] = useState({
    name: '',
    description: '',
    category: '',
    images: [],
    latitude: route.params?.latitude || null,
    longitude: route.params?.longitude || null,
    address: route.params?.address || '',
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'restaurant', icon: 'silverware-fork-knife', label: 'Restaurante' },
    { id: 'hotel', icon: 'bed', label: 'Hotel' },
    { id: 'museum', icon: 'bank', label: 'Museo' },
    { id: 'park', icon: 'nature', label: 'Parque' },
    { id: 'shopping', icon: 'shopping', label: 'Comercio' },
    { id: 'tourist', icon: 'camera', label: 'Turístico' },
    { id: 'transport', icon: 'bus', label: 'Transporte' },
    { id: 'other', icon: 'map-marker-plus', label: 'Otro' },
  ];

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesita permiso para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!result.canceled) {
        const newImageUri = result.assets[0].uri;
        const newImageName = `location_image_${Date.now()}.jpg`;
        const newImagePath = `${FileSystem.documentDirectory}${newImageName}`;

        await FileSystem.copyAsync({
          from: newImageUri,
          to: newImagePath,
        });

        setLocation(prev => ({
          ...prev,
          images: [...prev.images, newImagePath],
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la imagen');
    }
  };

  const saveLocation = () => {
    if (!location.name.trim()) {
      Alert.alert('Error', 'Por favor ingrese un nombre para la ubicación');
      return;
    }

    if (!location.category) {
      Alert.alert('Error', 'Por favor seleccione una categoría');
      return;
    }

    setLoading(true);
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO locations (name, description, category, latitude, longitude, address, images) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          location.name.trim(),
          location.description.trim(),
          location.category,
          location.latitude,
          location.longitude,
          location.address,
          JSON.stringify(location.images),
        ],
        (_, result) => {
          setLoading(false);
          Alert.alert(
            'Éxito',
            'Ubicación guardada correctamente',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        },
        (_, error) => {
          setLoading(false);
          console.error('Error guardando ubicación:', error);
          Alert.alert('Error', 'No se pudo guardar la ubicación');
        }
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Ubicación</Text>
        <TouchableOpacity onPress={saveLocation}>
          <MaterialCommunityIcons name="check" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Nombre de la ubicación"
          value={location.name}
          onChangeText={text => setLocation(prev => ({ ...prev, name: text }))}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descripción"
          multiline
          numberOfLines={4}
          value={location.description}
          onChangeText={text => setLocation(prev => ({ ...prev, description: text }))}
        />

        <Text style={styles.sectionTitle}>Categoría</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryItem,
                location.category === cat.id && styles.categorySelected
              ]}
              onPress={() => setLocation(prev => ({ ...prev, category: cat.id }))}
            >
              <MaterialCommunityIcons 
                name={cat.icon} 
                size={24} 
                color={location.category === cat.id ? '#1E88E5' : '#666'} 
              />
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Imágenes</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
        >
          {location.images.map((uri, index) => (
            <View key={uri} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setLocation(prev => ({
                    ...prev,
                    images: prev.images.filter((_, i) => i !== index)
                  }));
                }}
              >
                <MaterialCommunityIcons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity 
            style={styles.addImageButton}
            onPress={handleImagePicker}
          >
            <MaterialCommunityIcons name="camera-plus" size={32} color="#1E88E5" />
          </TouchableOpacity>
        </ScrollView>
      </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    padding: 16,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    width: 100,
  },
  categorySelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1E88E5',
    borderWidth: 1,
  },
  categoryLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  imagesContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  imageWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: 120,
    height: 120,
    backgroundColor: '#FFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#1E88E5',
  },
});

export default LocationCreatorForm;