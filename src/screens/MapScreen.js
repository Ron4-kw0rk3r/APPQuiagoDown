import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Text,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { openDatabase } from 'expo-sqlite';
import { findShortestPath } from '../utils/pathfinding';
import MapTypeSelector from '../components/MapTypeSelector';
import CurvedPanel from '../components/CurvedPanel';

const db = openDatabase('quiago_v2.db');
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Iconos válidos para MaterialCommunityIcons
const categoryIcons = {
  restaurant: 'silverware-fork-knife',
  hotel: 'bed',
  museum: 'bank',
  park: 'nature',
  shopping: 'shopping',
  tourist: 'camera',
  transport: 'bus',
  other: 'map-marker',
};

const BOLIVIA_LANDMARKS = {
  landmarks: [
    { id: 1, name: 'Salar de Uyuni', icon: '🌵', lat: -20.6868, lng: -66.8926 },
    { id: 2, name: 'Isla de Pescadores', icon: '🐟', lat: -16.3036, lng: -66.7289 },
    { id: 3, name: 'Titicaca', icon: '🏞️', lat: -15.9950, lng: -69.5528 },
    { id: 4, name: 'Valle de la Luna', icon: '🌙', lat: -21.0393, lng: -69.7012 },
    { id: 5, name: 'Catedral de La Paz', icon: '⛪', lat: -16.4833, lng: -68.1167 },
    { id: 6, name: 'Museo Nacional de Arqueología', icon: '🏛️', lat: -16.4833, lng: -68.1167 },
    { id: 7, name: 'Museo de Arte Contemporáneo', icon: '🎨', lat: -16.4833, lng: -68.1167 },
    { id: 8, name: 'Museo Nacional de Historia', icon: '📚', lat: -16.4833, lng: -68.1167 },
    { id: 9, name: 'Teleférico La Paz', icon: '🚡', lat: -16.4955, lng: -68.1336 },
  ]
};

const MapScreen = () => {
  const [mapType, setMapType] = useState('google'); // 'google' o 'osm'
  const mapRef = useRef(null);
  const webViewRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [route, setRoute] = useState(null);
  const [routePoints, setRoutePoints] = useState({ start: null, end: null });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [isHighAccuracy, setIsHighAccuracy] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [isHighPrecision, setIsHighPrecision] = useState(false);

  useEffect(() => {
    initializeMap();
    loadSavedLocations();
  }, []);

  const initializeMap = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesita permiso para acceder a la ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const initialRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(initialRegion);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedLocations = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM locations',
        [],
        (_, { rows: { _array } }) => setMarkers(_array),
        (_, error) => console.error('Error cargando ubicaciones:', error)
      );
    });
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Primero buscar en ubicaciones guardadas
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM locations WHERE name LIKE ? OR description LIKE ?',
          [`%${query}%`, `%${query}%`],
          (_, { rows: { _array } }) => {
            if (_array.length > 0) {
              setSearchResults(_array.map(item => ({
                id: item.id,
                name: item.name,
                fullAddress: item.address,
                latitude: item.latitude,
                longitude: item.longitude,
                type: item.category,
                isLocal: true
              })));
              setShowSearchPanel(true);
            } else {
              // Si no hay resultados locales, buscar en OpenStreetMap
              searchOpenStreetMap(query);
            }
          }
        );
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo realizar la búsqueda');
      setLoading(false);
    }
  };

  const searchOpenStreetMap = async (query) => {
    try {
      // Buscar específicamente en Bolivia con viewbox y bounded=1
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&countrycodes=bo` +
        `&viewbox=-69.6390,-22.8982,-57.4539,-9.6689` +
        `&bounded=1` +
        `&format=json` +
        `&limit=10`
      );
      
      if (!response.ok) throw new Error('Error en la búsqueda');
      
      const data = await response.json();
      
      // Filtrar y formatear resultados
      const formattedResults = data.map(item => ({
        id: item.place_id,
        name: item.display_name.split(',')[0],
        fullAddress: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: item.type,
        isOpenStreetMap: true
      }));

      setSearchResults(formattedResults);
      setShowSearchPanel(true);
    } catch (error) {
      console.error('Error en búsqueda OSM:', error);
      Alert.alert('Error', 'No se encontraron resultados');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    mapRef.current?.animateToRegion({
      latitude: marker.latitude,
      longitude: marker.longitude,
      latitudeDelta: LATITUDE_DELTA / 2,
      longitudeDelta: LONGITUDE_DELTA / 2,
    });
  };

  // Función para renderizar el mapa correcto
  const renderMap = () => {
    if (mapType === 'google') {
      return (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton
          showsCompass
          toolbarEnabled
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              title={marker.name}
              description={marker.description}
              onPress={() => handleMarkerPress(marker)}
            >
              <MaterialCommunityIcons
                name={categoryIcons[marker.category] || 'map-marker'}
                size={36}
                color="#1E88E5"
              />
            </Marker>
          ))}

          {routePoints.start && routePoints.end && (
            <MapViewDirections
              origin={routePoints.start}
              destination={routePoints.end}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={3}
              strokeColor="#1E88E5"
              onStart={(params) => {
                console.log(`Started routing between "${params.origin}" and "${params.destination}"`);
              }}
              onReady={result => {
                mapRef.current.fitToCoordinates(result.coordinates, {
                  edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }
                });
              }}
              onError={(errorMessage) => {
                Alert.alert('Error', 'No se pudo calcular la ruta');
              }}
            />
          )}
        </MapView>
      );
    } else {
      return (
        <WebView
          ref={webViewRef}
          source={{ html: getLeafletMapHTML() }}
          style={styles.map}
          onMessage={handleWebViewMessage}
          injectedJavaScript={getInjectedScript()}
        />
      );
    }
  };

  // HTML para Leaflet
  const getLeafletMapHTML = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${region?.latitude || 0}, ${region?.longitude || 0}], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Agregar marcadores
          ${markers.map(marker => `
            L.marker([${marker.latitude}, ${marker.longitude}])
              .bindPopup(\`
                <div>
                  <h3>${marker.name}</h3>
                  <p>${marker.description || ''}</p>
                  <button onclick="selectRoutePoint('start', ${marker.id})">Punto de inicio</button>
                  <button onclick="selectRoutePoint('end', ${marker.id})">Punto final</button>
                </div>
              \`)
              .addTo(map);
          `).join('')}

          // Funciones para comunicación con React Native
          function selectRoutePoint(type, markerId) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'routePoint',
              pointType: type,
              markerId: markerId
            }));
          }

          map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapClick',
              lat: e.latlng.lat,
              lng: e.latlng.lng
            }));
          });
        </script>
      </body>
    </html>
  `;

  // HTML para OpenStreetMap
  const getMapHTML = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100vw; height: 100vh; }
          .custom-marker { font-size: 24px; }
          .search-container {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 60px;
            z-index: 1000;
          }
          .search-input {
            width: 100%;
            padding: 12px 40px 12px 15px;
            border: none;
            border-radius: 25px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-size: 16px;
            background: white;
          }
          .search-icon {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #666;
            cursor: pointer;
          }
          .search-clear {
            position: absolute;
            right: 40px;
            top: 50%;
            transform: translateY(-50%);
            color: #999;
            cursor: pointer;
            display: none;
          }
          .search-input:not(:placeholder-shown) + .search-clear {
            display: block;
          }
          .controls {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1000;
          }
          .control-button {
            width: 40px;
            height: 40px;
            margin: 5px 0;
            background: white;
            border: none;
            border-radius: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .landmark-button {
            background: white;
            border: none;
            border-radius: 20px;
            padding: 10px;
            margin: 5px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          }
          .landmark-icon {
            font-size: 20px;
            margin-right: 8px;
          }
          .dijkstra-panel {
            position: absolute;
            left: 10px;
            bottom: 10px;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 300px;
          }
          .route-type-selector {
            position: absolute;
            top: 70px;
            right: 10px;
            background: white;
            padding: 5px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
          }
          .custom-popup {
            font-size: 14px;
            line-height: 1.4;
          }
          .custom-popup img {
            max-width: 100%;
            border-radius: 4px;
            margin-top: 8px;
          }
          .zoom-controls {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: 100px;
            z-index: 1000;
            display: flex;
            flex-direction: row;
            background: white;
            border-radius: 25px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            padding: 5px;
          }
          
          .zoom-button {
            width: 40px;
            height: 40px;
            border: none;
            background: transparent;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1E88E5;
            margin: 0 5px;
          }

          .zoom-button:hover {
            background: #F5F5F5;
            border-radius: 20px;
          }

          .zoom-divider {
            width: 1px;
            height: 30px;
            background: #E0E0E0;
            margin: 5px 0;
          }

          .search-container {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            z-index: 1000;
          }

          .search-input {
            width: 100%;
            padding: 12px 40px 12px 15px;
            border: none;
            border-radius: 25px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-size: 16px;
            background: white;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        
        <!-- Panel de lugares turísticos -->
       

        <!-- Panel de Dijkstra -->
        <div class="dijkstra-panel" id="dijkstraPanel" style="display: none;">
          <h3 style="margin: 0 0 10px 0;">Ruta Óptima</h3>
          <div id="routeInfo"></div>
          <button onclick="clearRoute()" style="margin-top: 10px;">Limpiar Ruta</button>
        </div>

        <!-- Selector de tipo de ruta -->
        <div class="route-type-selector">
          <select id="routeType" onchange="changeRouteType()">
            <option value="normal">Ruta Normal</option>
            <option value="dijkstra">Ruta Óptima (Dijkstra)</option>
          </select>
        </div>

        <div class="search-container">
          <input 
            type="text" 
            id="searchInput" 
            class="search-input" 
            placeholder="Buscar en Bolivia..."
          />
          <span class="search-clear" onclick="clearSearch()">✕</span>
          <span class="search-icon" onclick="performSearch()">🔍</span>
        </div>

        <div class="zoom-controls">
          <button class="zoom-button" onclick="map.zoomIn()">
            <span style="font-size: 24px;">+</span>
          </button>
          <div class="zoom-divider"></div>
          <button class="zoom-button" onclick="map.zoomOut()">
            <span style="font-size: 24px;">−</span>
          </button>
          <div class="zoom-divider"></div>
          <button class="zoom-button" onclick="getCurrentLocation()">
            <span style="font-size: 24px;">📍</span>
          </button>
        </div>

        <script>
          const map = L.map('map').setView([${region?.latitude || -16.5}, ${region?.longitude || -68.15}], 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          let routingControl = null;
          let isRoutingMode = false;
          let startMarker = null;
          let endMarker = null;

          // Marcadores existentes
          ${markers.map(marker => `
            L.marker([${marker.latitude}, ${marker.longitude}], {
              icon: L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: #1E88E5; width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: white;">📍</div>'
              })
            })
            .bindPopup(\`
              <div style="padding: 10px;">
                <h3>${marker.name}</h3>
                <p>${marker.description || ''}</p>
                <button onclick="setRoutePoint('start', ${marker.latitude}, ${marker.longitude})">Inicio</button>
                <button onclick="setRoutePoint('end', ${marker.latitude}, ${marker.longitude})">Destino</button>
              </div>
            \`)
            .addTo(map);
          `).join('')}

          // Búsqueda
          document.getElementById('searchInput').addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
              const query = e.target.value;
              try {
                const response = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(query)}\`);
                const data = await response.json();
                if (data.length > 0) {
                  map.setView([data[0].lat, data[0].lon], 16);
                }
              } catch (error) {
                console.error('Error en búsqueda:', error);
              }
            }
          });

          // Funciones de control
          function getCurrentLocation() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'getCurrentLocation'
            }));
          }

          function toggleRouting() {
            isRoutingMode = !isRoutingMode;
            if (!isRoutingMode) {
              if (routingControl) {
                map.removeControl(routingControl);
                routingControl = null;
              }
              if (startMarker) map.removeLayer(startMarker);
              if (endMarker) map.removeLayer(endMarker);
              startMarker = null;
              endMarker = null;
            }
          }

          function setRoutePoint(type, lat, lng) {
            if (!isRoutingMode) return;

            const marker = L.marker([lat, lng], {
              draggable: true,
              icon: L.divIcon({
                className: 'custom-marker',
                html: \`<div style="background-color: \${type === 'start' ? '#4CAF50' : '#FF5252'}; width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: white;">\${type === 'start' ? '🏁' : '🎯'}</div>\`
              })
            });

            if (type === 'start') {
              if (startMarker) map.removeLayer(startMarker);
              startMarker = marker;
            } else {
              if (endMarker) map.removeLayer(endMarker);
              endMarker = marker;
            }

            marker.addTo(map);

            if (startMarker && endMarker) {
              calculateRoute();
            }
          }

          function calculateRoute() {
            if (routingControl) {
              map.removeControl(routingControl);
            }

            routingControl = L.Routing.control({
              waypoints: [
                L.latLng(startMarker.getLatLng()),
                L.latLng(endMarker.getLatLng())
              ],
              router: L.Routing.osrm({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
              }),
              lineOptions: {
                styles: [{ color: '#1E88E5', weight: 4 }]
              },
              createMarker: function() { return null; }
            }).addTo(map);
          }

          // Funciones para lugares turísticos
          function flyToLocation(lat, lng) {
            map.flyTo([lat, lng], 15, {
              duration: 2
            });
          }

          // Implementación de Dijkstra en el mapa
          let isDijkstraMode = false;
          let dijkstraPoints = [];
          let currentPath = null;

          function toggleDijkstra() {
            isDijkstraMode = document.getElementById('routeType').value === 'dijkstra';
            document.getElementById('dijkstraPanel').style.display = isDijkstraMode ? 'block' : 'none';
            if (!isDijkstraMode) clearRoute();
          }

          function addDijkstraPoint(latlng) {
            if (!isDijkstraMode) return;
            
            dijkstraPoints.push(latlng);
            L.marker(latlng).addTo(map);

            if (dijkstraPoints.length >= 2) {
              calculateDijkstraRoute();
            }
          }

          function calculateDijkstraRoute() {
            // Enviar puntos a React Native para cálculo
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'calculateDijkstra',
              points: dijkstraPoints
            }));
          }

          function drawDijkstraPath(path) {
            if (currentPath) map.removeLayer(currentPath);
            
            currentPath = L.polyline(path, {
              color: '#1E88E5',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10',
              animate: true
            }).addTo(map);

            // Ajustar vista
            map.fitBounds(currentPath.getBounds(), {
              padding: [50, 50]
            });

            // Mostrar información
            const distance = calculateTotalDistance(path);
            document.getElementById('routeInfo').innerHTML = \`
              <p>Distancia total: \${distance.toFixed(2)} km</p>
              <p>Puntos intermedios: \${path.length - 2}</p>
            \`;
          }

          function calculateTotalDistance(path) {
            let total = 0;
            for (let i = 0; i < path.length - 1; i++) {
              total += path[i].distanceTo(path[i + 1]) / 1000; // convertir a km
            }
            return total;
          }

          function clearRoute() {
            if (currentPath) map.removeLayer(currentPath);
            dijkstraPoints.forEach(point => {
              map.eachLayer(layer => {
                if (layer instanceof L.Marker && layer.getLatLng().equals(point)) {
                  map.removeLayer(layer);
                }
              });
            });
            dijkstraPoints = [];
            document.getElementById('routeInfo').innerHTML = '';
          }

          // Eventos táctiles mejorados
          let touchStartTime;
          let touchStartPos;
          
          map.on('touchstart', function(e) {
            touchStartTime = new Date().getTime();
            touchStartPos = e.touches[0];
          });

          map.on('touchend', function(e) {
            const touchEndTime = new Date().getTime();
            const touchDuration = touchEndTime - touchStartTime;

            if (touchDuration < 500) { // tap corto
              if (isDijkstraMode) {
                addDijkstraPoint(e.latlng);
              }
            }
          });

          // Comunicación con React Native
          window.addEventListener('message', function(e) {
            const data = JSON.parse(e.data);
            if (data.type === 'setLocation') {
              map.setView([data.latitude, data.longitude], 16);
            }
            if (data.type === 'dijkstraResult') {
              drawDijkstraPath(data.path);
            }
          });

          // Agregar controles de GPS
          const gpsControl = L.Control.extend({
            onAdd: function(map) {
              const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              container.innerHTML = \`
                <button onclick="toggleGPS()" style="width: 40px; height: 40px; background: white; border: none; border-radius: 4px; margin-bottom: 5px;">
                  <span style="font-size: 20px;">📍</span>
                </button>
                <button onclick="toggleAccuracy()" style="width: 40px; height: 40px; background: white; border: none; border-radius: 4px;">
                  <span style="font-size: 20px;">🎯</span>
                </button>
              \`;
              return container;
            }
          });

          map.addControl(new gpsControl({ position: 'bottomright' }));

          // Funciones de control GPS
          window.toggleGPS = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'toggleGPS'
            }));
          };

          window.toggleAccuracy = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'toggleAccuracy'
            }));
          };

          // Configurar zoom máximo
          map.setMaxZoom(19);
          
          // Control de precisión
          const precisionControl = L.Control.extend({
            onAdd: function(map) {
              const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              container.innerHTML = \`
                <button id="precisionBtn" style="width: 40px; height: 40px; background: white; border: none;">
                  <span style="font-size: 20px;">🎯</span>
                </button>
              \`;
              
              container.querySelector('#precisionBtn').onclick = function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'togglePrecision'
                }));
              };
              
              return container;
            }
          });
          map.addControl(new precisionControl({ position: 'topright' }));

          // Mejorar la funcionalidad de búsqueda
          const searchInput = document.getElementById('searchInput');
          let searchTimeout;

          searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length >= 3) {
              searchTimeout = setTimeout(() => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'search',
                  query: query
                }));
              }, 500);
            }
          });

          searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
              performSearch();
            }
          });

          window.performSearch = function() {
            const query = searchInput.value.trim();
            if (query) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'search',
                query: query
              }));
            }
          };

          window.clearSearch = function() {
            searchInput.value = '';
            if (window.tempMarker) {
              map.removeLayer(window.tempMarker);
            }
          };

          // Función para obtener ubicación actual
          function getCurrentLocation() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'getCurrentLocation'
            }));
          }

          // Agregar animación suave al zoom
          map.on('zoomstart', function() {
            document.querySelector('.zoom-controls').style.transform = 'translateX(-50%) scale(0.95)';
          });
          
          map.on('zoomend', function() {
            document.querySelector('.zoom-controls').style.transform = 'translateX(-50%) scale(1)';
          });

          // Mejorar la animación de vuelo
          map.on('flystart', function() {
            if (window.tempMarker) {
              window.tempMarker.setOpacity(0);
            }
          });

          map.on('flyend', function() {
            if (window.tempMarker) {
              window.tempMarker.setOpacity(1);
            }
          });
        </script>

        <style>
          .search-control {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            z-index: 1000;
          }
          
          #searchInput {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 25px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-size: 16px;
          }
          
          #searchResults {
            margin-top: 5px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            max-height: 200px;
            overflow-y: auto;
          }
          
          .search-result {
            padding: 10px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
          }
          
          .search-result:hover {
            background: #f5f5f5;
          }
        </style>
      </body>
    </html>
  `;

  const handleWebViewMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    switch (data.type) {
      case 'routePoint':
        handleRoutePoint(data);
        break;
      case 'getCurrentLocation':
        getCurrentLocation();
        break;
      case 'calculateDijkstra':
        const { points } = data;
        const result = findShortestPath(points);
        
        webViewRef.current?.injectJavaScript(`
          drawDijkstraPath(${JSON.stringify(result.path)});
        `);
        break;
      case 'toggleGPS':
        startLocationTracking();
        break;
      case 'toggleAccuracy':
        setIsHighAccuracy(!isHighAccuracy);
        getHighAccuracyLocation();
        break;
    }
  };

  // Función para obtener ubicación con alta precisión
  const getHighAccuracyLocation = async () => {
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 10000,
      });
      setUserLocation(location);
      webViewRef.current?.injectJavaScript(`
        map.setView([${location.coords.latitude}, ${location.coords.longitude}], 18);
      `);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación de alta precisión');
    } finally {
      setLoading(false);
    }
  };

  // Función para seguimiento en tiempo real
  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Se necesitan permisos de ubicación');
      return;
    }

    Location.watchPositionAsync(
      {
        accuracy: isHighAccuracy ? Location.Accuracy.BestForNavigation : Location.Accuracy.Balanced,
        timeInterval: 1000,
        distanceInterval: 10,
      },
      (location) => {
        setUserLocation(location);
        webViewRef.current?.injectJavaScript(`
          if (typeof userMarker === 'undefined') {
            userMarker = L.marker([${location.coords.latitude}, ${location.coords.longitude}], {
              icon: L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: #1E88E5; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>'
              })
            }).addTo(map);
          } else {
            userMarker.setLatLng([${location.coords.latitude}, ${location.coords.longitude}]);
          }
        `);
      }
    );
  };

  // Función para ir a la ubicación seleccionada
  const goToLocation = (location) => {
    webViewRef.current?.injectJavaScript(`
      map.setView([${location.latitude}, ${location.longitude}], 16);
      
      // Agregar marcador temporal
      if (window.tempMarker) {
        map.removeLayer(window.tempMarker);
      }
      window.tempMarker = L.marker([${location.latitude}, ${location.longitude}], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #1E88E5; width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">📍</div>'
        })
      })
      .bindPopup(\`
        <div style="padding: 10px;">
          <h3>${location.name}</h3>
          <p>${location.fullAddress}</p>
          <button onclick="setRoutePoint('start', ${location.latitude}, ${location.longitude})">Punto de inicio</button>
          <button onclick="setRoutePoint('end', ${location.latitude}, ${location.longitude})">Punto final</button>
        </div>
      \`)
      .addTo(map)
      .openPopup();
    `);
    setShowSearchPanel(false);
  };

  // Componente para mostrar resultados de búsqueda
  const SearchResults = () => (
    <Animated.View style={[styles.searchResultsContainer]}>
      <ScrollView style={styles.searchResultsList}>
        {searchResults.map((result) => (
          <TouchableOpacity
            key={result.id}
            style={styles.searchResultItem}
            onPress={() => goToLocation(result)}
          >
            <MaterialCommunityIcons
              name={result.isLocal ? 'star' : 'map-marker'}
              size={24}
              color={result.isLocal ? '#FFC107' : '#1E88E5'}
            />
            <View style={styles.searchResultText}>
              <Text style={styles.searchResultTitle}>{result.name}</Text>
              <Text style={styles.searchResultAddress} numberOfLines={2}>
                {result.fullAddress}
              </Text>
              <Text style={styles.searchResultSource}>
                {result.isLocal ? 'Ubicación guardada' : 'OpenStreetMap'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  // Agregar la función flyToLocation
  const flyToLocation = (lat, lng) => {
    webViewRef.current?.injectJavaScript(`
      map.flyTo([${lat}, ${lng}], 16, {
        duration: 2,
        easeLinearity: 0.25
      });

      // Agregar marcador temporal
      if (window.tempMarker) {
        map.removeLayer(window.tempMarker);
      }
      window.tempMarker = L.marker([${lat}, ${lng}], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #1E88E5; width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">📍</div>'
        })
      }).addTo(map);
    `);
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: getMapHTML() }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      {showSearchPanel && searchResults.length > 0 && <SearchResults />}
      
      <CurvedPanel title="Lugares Turísticos">
        {BOLIVIA_LANDMARKS.landmarks.map((landmark) => (
          <TouchableOpacity
            key={landmark.id}
            style={styles.landmarkItem}
            onPress={() => flyToLocation(landmark.lat, landmark.lng)}
          >
            <Text style={styles.landmarkIcon}>{landmark.icon}</Text>
            <Text style={styles.landmarkName}>{landmark.name}</Text>
          </TouchableOpacity>
        ))}
      </CurvedPanel>

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
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchButton: {
    backgroundColor: '#1E88E5',
    padding: 12,
    borderRadius: 25,
    elevation: 3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  landmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  landmarkIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  landmarkName: {
    fontSize: 16,
    color: '#333',
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    maxHeight: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchResultsList: {
    padding: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultText: {
    marginLeft: 10,
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  searchResultAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  searchResultSource: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default MapScreen; 