import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as SQLite from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const db = SQLite.openDatabase('quiago.db');

const LocationCreatorScreen = () => {
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);

  useEffect(() => {
    // Create locations table if it doesn't exist
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, category TEXT, latitude REAL, longitude REAL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);'
      );
    });

    // Request location permissions and get current location
    requestLocationPermission();
    
    // Load saved locations
    loadSavedLocations();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);
      } else {
        Alert.alert('Permission denied', 'Location permission is required');
      }
    } catch (err) {
      console.error('Error getting location:', err);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const loadSavedLocations = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM locations ORDER BY created_at DESC;',
        [],
        (_, { rows: { _array } }) => setSavedLocations(_array),
        (_, error) => console.error('Error loading locations:', error)
      );
    });
  };

  const saveLocation = () => {
    if (!locationName.trim() || !description.trim() || !category.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available');
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO locations (name, description, category, latitude, longitude) VALUES (?, ?, ?, ?, ?);',
        [locationName, description, category, currentLocation.latitude, currentLocation.longitude],
        (_, result) => {
          Alert.alert('Success', 'Location saved successfully');
          setLocationName('');
          setDescription('');
          setCategory('');
          loadSavedLocations();
        },
        (_, error) => {
          console.error('Error saving location:', error);
          Alert.alert('Error', 'Failed to save location');
        }
      );
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Location Name"
            value={locationName}
            onChangeText={setLocationName}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
          <TextInput
            style={styles.input}
            placeholder="Category"
            value={category}
            onChangeText={setCategory}
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={saveLocation}>
            <MaterialCommunityIcons name="map-marker-plus" size={24} color="white" />
            <Text style={styles.saveButtonText}>Save Location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.savedLocationsContainer}>
          <Text style={styles.savedLocationsTitle}>Saved Locations</Text>
          {savedLocations.map((location, index) => (
            <View key={location.id} style={styles.locationCard}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationDescription}>{location.description}</Text>
              <Text style={styles.locationCategory}>Category: {location.category}</Text>
              <Text style={styles.locationCoords}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  savedLocationsContainer: {
    marginTop: 30,
  },
  savedLocationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  locationCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  locationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationCategory: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 5,
  },
  locationCoords: {
    fontSize: 12,
    color: '#999',
  },
});

export default LocationCreatorScreen;
