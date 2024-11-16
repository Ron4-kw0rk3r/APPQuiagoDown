import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { openDatabase } from 'expo-sqlite';
import * as Location from 'expo-location';

const db = openDatabase('quiago_v2.db');

const initDatabase = () => {
  db.transaction(tx => {
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
      () => console.log('Base de datos inicializada en RegisterScreen'),
      (_, error) => console.error('Error inicializando DB en RegisterScreen:', error)
    );
  });
};

const RegisterScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    initDatabase();
  }, []);

  const handleRegister = () => {
    if (!userData.name || !userData.email) {
      Alert.alert('Error', 'Por favor complete los campos obligatorios');
      return;
    }

    db.transaction(tx => {
      console.log('Iniciando transacción de registro...');
      tx.executeSql(
        'INSERT INTO users (name, email, phone, address) VALUES (?, ?, ?, ?)',
        [userData.name, userData.email, userData.phone || '', userData.address || ''],
        (_, result) => {
          console.log('Registro exitoso:', result);
          Alert.alert(
            'Éxito',
            'Registro completado correctamente',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('Main'),
              },
            ]
          );
        },
        (_, error) => {
          console.error('Error en el registro:', error);
          Alert.alert('Error', 'No se pudo completar el registro: ' + error.message);
        }
      );
    }, 
    error => {
      console.error('Error en la transacción:', error);
      Alert.alert('Error', 'Error en la base de datos: ' + error.message);
    },
    () => {
      console.log('Transacción completada');
    });
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (address[0]) {
        const fullAddress = `${address[0].street}, ${address[0].city}, ${address[0].region}`;
        setUserData({ ...userData, address: fullAddress });
        setCurrentLocation(location);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registro de Usuario</Text>
        <Text style={styles.subtitle}>Bienvenido a Quiago</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre completo *"
          value={userData.name}
          onChangeText={(text) => setUserData({ ...userData, name: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico *"
          value={userData.email}
          onChangeText={(text) => setUserData({ ...userData, email: text })}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          value={userData.phone}
          onChangeText={(text) => setUserData({ ...userData, phone: text })}
          keyboardType="phone-pad"
        />

        <View style={styles.locationContainer}>
          <TextInput
            style={[styles.input, styles.addressInput]}
            placeholder="Dirección"
            value={userData.address}
            onChangeText={(text) => setUserData({ ...userData, address: text })}
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
          >
            <Text style={styles.locationButtonText}>📍</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    flex: 1,
    marginRight: 10,
  },
  locationButton: {
    padding: 15,
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
  },
  locationButtonText: {
    fontSize: 20,
  },
  button: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 