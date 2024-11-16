import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import ProfileScreen from '../screens/ProfileScreen';
import LocationCreatorScreen from '../screens/LocationCreatorScreen';
import MapScreen from '../screens/MapScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import WalletScreen from '../screens/WalletScreen';

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ focused, color, size, name }) => {
  return (
    <View style={[
      styles.iconContainer,
      focused && styles.iconContainerFocused
    ]}>
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons 
          name={name} 
          size={size} 
          color={focused ? color : '#757575'} 
        />
        {focused && (
          <View style={[styles.glowEffect, { backgroundColor: color }]} />
        )}
      </View>
      {focused && (
        <Svg
          width={50}
          height={4}
          viewBox="0 0 50 4"
          style={styles.curvedLine}
        >
          <Path
            d="M0 4C12.5 4 12.5 0 25 0S37.5 4 50 4"
            fill={color}
          />
        </Svg>
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
          position: 'relative',
        },
        tabBarActiveTintColor: '#1E88E5',
        tabBarInactiveTintColor: '#757575',
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: -5,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon 
              focused={focused} 
              color="#E91E63" 
              size={24} 
              name="account" 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Ubicaciones"
        component={LocationCreatorScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon 
              focused={focused} 
              color="#FF9800" 
              size={24} 
              name="map-marker-plus" 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Mapa"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon 
              focused={focused} 
              color="#4CAF50" 
              size={24} 
              name="map" 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Mercado"
        component={MarketplaceScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon 
              focused={focused} 
              color="#9C27B0" 
              size={24} 
              name="store" 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Billetera"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon 
              focused={focused} 
              color="#2196F3" 
              size={24} 
              name="wallet" 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 30,
  },
  iconContainerFocused: {
    transform: [{ translateY: -5 }],
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  curvedLine: {
    position: 'absolute',
    bottom: -15,
    left: 0,
  },
});

export default BottomTabNavigator; 