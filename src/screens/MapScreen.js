import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { dijkstra } from '../utils/pathfinding';

const MapScreen = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const webViewRef = useRef(null);
  
  useEffect(() => {
    requestLocationPermission();
    startLocationUpdates();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startLocationUpdates = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location.coords);
      
      // Suscribirse a actualizaciones de ubicación
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setCurrentLocation(location.coords);
          if (isTracking) {
            setRoutePoints(prev => [...prev, location.coords]);
          }
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking) {
      setRoutePoints([]);
    }
  };

  const saveRoute = async () => {
    if (routePoints.length < 2) {
      Alert.alert('Error', 'No hay suficientes puntos para guardar la ruta');
      return;
    }

    try {
      const routeData = JSON.stringify(routePoints);
      const fileName = `route_${new Date().getTime()}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, routeData);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo guardar la ruta');
    }
  };

  const injectRouteToMap = () => {
    if (!webViewRef.current || routePoints.length < 2) return;

    const routeScript = `
      const routePoints = ${JSON.stringify(routePoints)};
      const routeLine = L.polyline(routePoints.map(p => [p.latitude, p.longitude]), {
        color: 'red',
        weight: 3,
        opacity: 0.7
      }).addTo(map);
      map.fitBounds(routeLine.getBounds());
    `;

    webViewRef.current.injectJavaScript(routeScript);
  };

  const mapHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
          #map { height: 100vh; width: 100vw; }
          .custom-marker { background: none; border: none; }
          .custom-marker i { font-size: 2em; color: #4CAF50; }
        </style>
      </head>
      <body style="margin: 0;">
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${currentLocation?.latitude || -16.5}, ${
    currentLocation?.longitude || -68.15
  }], 15);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Agregar controles personalizados
          L.control.scale().addTo(map);
          
          // Marcador de ubicación actual
          const currentMarker = L.marker([${currentLocation?.latitude || -16.5}, ${
    currentLocation?.longitude || -68.15
  }]).addTo(map);
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, isTracking && styles.buttonActive]}
          onPress={toggleTracking}
        >
          <MaterialCommunityIcons
            name={isTracking ? "pause" : "play"}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={saveRoute}
        >
          <MaterialCommunityIcons
            name="content-save"
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 30,
    marginVertical: 5,
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: '#f44336',
  },
});

export default MapScreen; 