import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MapTypeSelector = ({ currentType, onSelect }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.option, currentType === 'google' && styles.selected]}
        onPress={() => onSelect('google')}
      >
        <MaterialCommunityIcons name="google-maps" size={24} color={currentType === 'google' ? "#1E88E5" : "#666"} />
        <Text style={styles.text}>Google Maps</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.option, currentType === 'osm' && styles.selected]}
        onPress={() => onSelect('osm')}
      >
        <MaterialCommunityIcons name="map-outline" size={24} color={currentType === 'osm' ? "#1E88E5" : "#666"} />
        <Text style={styles.text}>OpenStreetMap</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  selected: {
    backgroundColor: '#E3F2FD',
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
});

export default MapTypeSelector; 