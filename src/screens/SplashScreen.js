import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions, Text, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { openDatabase } from 'expo-sqlite';

const db = openDatabase('quiago_v2.db');
const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const [isFirstTime, setIsFirstTime] = useState(true);

  useEffect(() => {
    // Verificar si es la primera vez que se ejecuta la app
    checkFirstTimeUser();
    // Solicitar permisos de ubicación
    requestLocationPermission();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      // Redirigir a registro si es primera vez, sino al Main
      navigation.replace(isFirstTime ? 'Register' : 'Main');
    }, 3000);
  }, []);

  const checkFirstTimeUser = () => {
    db.transaction(tx => {
      // Actualizar la creación de la tabla para incluir todos los campos necesarios
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        [],
        () => {
          console.log('Tabla users creada correctamente');
        },
        (_, error) => {
          console.error('Error creando tabla users:', error);
        }
      );
      
      // Verificar si hay usuarios registrados
      tx.executeSql(
        'SELECT * FROM users LIMIT 1',
        [],
        (_, { rows: { length } }) => {
          setIsFirstTime(length === 0);
        },
        (_, error) => {
          console.error('Error verificando usuarios:', error);
        }
      );
    });
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        // Guardar la ubicación en el estado global o contexto
      }
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.curvedBackground}>
        <View style={styles.curve} />
      </View>

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoWrapper}>
          <Image
            source={require('../assets/quiago-icon.jpg')}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.title}>QUIAGO</Text>
        <Text style={styles.subtitle}>Tu guía turística en Bolivia</Text>
      </Animated.View>

      <View style={styles.featureIconsContainer}>
        {[
          { name: 'map-marker', color: '#E53935', label: 'Ubicaciones' },
          { name: 'camera', color: '#FDD835', label: 'Fotos' },
          { name: 'wallet', color: '#43A047', label: 'Billetera' },
          { name: 'map', color: '#1E88E5', label: 'Mapas' },
        ].map((item, index) => (
          <Animated.View
            key={item.name}
            style={[
              styles.featureIcon,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={item.name}
              size={32}
              color={item.color}
            />
            <Text style={styles.iconLabel}>{item.label}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons
          name="loading"
          size={24}
          color="#666"
          style={styles.loadingIcon}
        />
        <Text style={styles.loadingText}>Iniciando...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  curvedBackground: {
    position: 'absolute',
    width: width,
    height: width,
    top: -width * 0.5,
    backgroundColor: 'transparent',
  },
  curve: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: width * 0.5,
    transform: [{ scaleX: 2 }],
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  logoWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    backgroundColor: 'white',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
  },
  featureIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 50,
  },
  featureIcon: {
    alignItems: 'center',
    padding: 10,
  },
  iconLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
  },
  loadingIcon: {
    marginRight: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
});

export default SplashScreen; 