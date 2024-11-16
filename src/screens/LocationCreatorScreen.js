import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { openDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

const db = openDatabase('quiago_v2.db');
const { width } = Dimensions.get('window');

const BOLIVIA_LANDMARKS = {
  categories: [
    {
      id: 'popular',
      title: 'Más Populares',
      places: [
        { id: 1, name: 'Salar de Uyuni', icon: '🌵', lat: -20.6868, lng: -66.8926, description: 'El salar más grande del mundo' },
        { id: 2, name: 'Lago Titicaca', icon: '🏞️', lat: -15.9950, lng: -69.5528, description: 'El lago navegable más alto del mundo' },
      ]
    },
    {
      id: 'historical',
      title: 'Sitios Históricos',
      places: [
        { id: 3, name: 'Tiwanaku', icon: '🏛️', lat: -16.5542, lng: -68.6738, description: 'Antigua ciudad precolombina' },
        { id: 4, name: 'Casa de la Libertad', icon: '🏛️', lat: -19.0368, lng: -65.2627, description: 'Lugar de nacimiento de Bolivia' },
      ]
    },
    {
      id: 'nature',
      title: 'Naturaleza',
      places: [
        { id: 5, name: 'Parque Nacional Madidi', icon: '🌳', lat: -13.1275, lng: -68.7969, description: 'Uno de los parques más biodiversos del mundo' },
        { id: 6, name: 'Valle de la Luna', icon: '🌙', lat: -16.5670, lng: -68.0974, description: 'Formaciones rocosas únicas' },
      ]
    },
    {
      id: 'urban',
      title: 'Atracciones Urbanas',
      places: [
        { id: 7, name: 'Teleférico La Paz', icon: '🚡', lat: -16.4955, lng: -68.1336, description: 'Sistema de transporte por cable más alto del mundo' },
        { id: 8, name: 'Mercado de las Brujas', icon: '🏺', lat: -16.4955, lng: -68.1467, description: 'Mercado tradicional andino' },
      ]
    }
  ]
};

const LocationCreatorScreen = ({ navigation }) => {
  const [location, setLocation] = useState({
    name: '',
    description: '',
    category: '',
    images: [],
    latitude: null,
    longitude: null,
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    initDatabase();
    getCurrentLocation();
  }, []);

  const initDatabase = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          latitude REAL,
          longitude REAL,
          address TEXT,
          images TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        [],
        () => console.log('Tabla locations creada correctamente'),
        (_, error) => console.error('Error creando tabla locations:', error)
      );
    });
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesita permiso para acceder a la ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      // Obtener dirección
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const fullAddress = `${address[0].street || ''}, ${address[0].city}, ${address[0].region}`;
        setLocation(prev => ({
          ...prev,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: fullAddress,
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    } finally {
      setLoading(false);
    }
  };

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

    if (!location.latitude || !location.longitude) {
      Alert.alert('Error', 'Por favor seleccione una ubicación en el mapa');
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
            [{ text: 'OK', onPress: () => resetForm() }]
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

  const resetForm = () => {
    setLocation({
      name: '',
      description: '',
      category: '',
      images: [],
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
      address: '',
    });
  };

  const categories = [
    { id: 'restaurant', icon: 'silverware-fork-knife', label: 'Restaurante' },
    { id: 'hotel', icon: 'bed', label: 'Hotel' },
    { id: 'museum', icon: 'bank', label: 'Museo' },
    { id: 'park', icon: 'tree', label: 'Parque' },
    { id: 'shopping', icon: 'shopping', label: 'Comercio' },
    { id: 'tourist', icon: 'camera', label: 'Turístico' },
    { id: 'transport', icon: 'bus', label: 'Transporte' },
    { id: 'other', icon: 'map-marker-plus', label: 'Otro' },
  ];

  const mapStyle = [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#f5f5f5" }]
    },
    {
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#616161" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#f5f5f5" }]
    },
    {
      "featureType": "administrative.land_parcel",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "administrative.land_parcel",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#bdbdbd" }]
    },
    {
      "featureType": "administrative.neighborhood",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [{ "color": "#eeeeee" }]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{ "color": "#e5e5e5" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#9e9e9e" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#ffffff" }]
    }
  ];

  const handleMapClick = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (address[0]) {
        setLocation(prev => ({
          ...prev,
          latitude,
          longitude,
          address: `${address[0].street || ''}, ${address[0].city}, ${address[0].region}`
        }));
      }
    } catch (error) {
      console.error('Error obteniendo dirección:', error);
      Alert.alert('Error', 'No se pudo obtener la dirección');
    }
  };

  const handleLandmarkSelect = (landmark) => {
    navigation.navigate('Mapa', {
      landmark,
      mode: 'navigation'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Descubre Bolivia</Text>
      </View>

      <ScrollView style={styles.content}>
        {BOLIVIA_LANDMARKS.categories.map(category => (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.placesScroll}
            >
              {category.places.map(place => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.placeCard}
                  onPress={() => handleLandmarkSelect(place)}
                >
                  <View style={styles.placeIconContainer}>
                    <Text style={styles.placeIcon}>{place.icon}</Text>
                  </View>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeDescription} numberOfLines={2}>
                    {place.description}
                  </Text>
                  <View style={styles.placeAction}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#1E88E5" />
                    <Text style={styles.placeActionText}>Ver en mapa</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}

        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('LocationCreator')}
        >
          <MaterialCommunityIcons name="plus-circle" size={24} color="#FFF" />
          <Text style={styles.createButtonText}>Crear Nueva Ubicación</Text>
        </TouchableOpacity>
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
    backgroundColor: '#1E88E5',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  categoriesContainer: {
    backgroundColor: '#FFF',
    padding: 15,
    marginBottom: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 15,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    minWidth: 80,
    elevation: 2,
  },
  categorySelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1E88E5',
    borderWidth: 1,
  },
  categoryLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    margin: 15,
    padding: 15,
    elevation: 2,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 1,
  },
  locationText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  imagesContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imageWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
  },
  addImageButton: {
    width: 120,
    height: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#1E88E5',
    elevation: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  closeMapButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  placesScroll: {
    paddingHorizontal: 15,
  },
  placeCard: {
    width: 200,
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  placeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  placeIcon: {
    fontSize: 24,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  placeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  placeAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeActionText: {
    marginLeft: 5,
    color: '#1E88E5',
    fontSize: 14,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    margin: 15,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default LocationCreatorScreen;
