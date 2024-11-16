import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ProfileScreen from '../screens/ProfileScreen';
import LocationCreatorScreen from '../screens/LocationCreatorScreen';
import MapScreen from '../screens/MapScreen';
import MultimediaScreen from '../screens/MultimediaScreen';
import WalletScreen from '../screens/WalletScreen';

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ focused, color, size, name }) => {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 8,
    }}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
      {focused && (
        <View style={{
          position: 'absolute',
          bottom: -8,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
        }} />
      )}
    </View>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#757575',
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: -5,
        },
      }}
    >
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={24} name="account" />
          ),
        }}
      />
      <Tab.Screen
        name="Ubicaciones"
        component={LocationCreatorScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={24} name="map-marker-plus" />
          ),
        }}
      />
      <Tab.Screen
        name="Mapa"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={24} name="map" />
          ),
        }}
      />
      <Tab.Screen
        name="Multimedia"
        component={MultimediaScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={24} name="image-multiple" />
          ),
        }}
      />
      <Tab.Screen
        name="Billetera"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={24} name="wallet" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator; 