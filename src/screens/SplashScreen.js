import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import * as Battery from 'expo-battery';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    setTimeout(() => {
      navigation.replace('Main');
    }, 12000);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#2193b0', '#6dd5ed']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: spin },
            ],
          },
        ]}
      >
        <MaterialCommunityIcons
          name="map-marker-radius"
          size={100}
          color="#ffffff"
        />
        <Text style={styles.title}>QUIAGO</Text>
      </Animated.View>

      <View style={styles.iconRow}>
        {['map-marker', 'camera', 'wallet', 'image-multiple'].map((icon, index) => (
          <Animated.View
            key={icon}
            style={{
              opacity: fadeAnim,
              transform: [{
                translateY: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, index % 2 === 0 ? -20 : 20],
                }),
              }],
            }}
          >
            <MaterialCommunityIcons
              name={icon}
              size={40}
              color="#ffffff"
              style={styles.icon}
            />
          </Animated.View>
        ))}
      </View>

      <Animated.View
        style={[
          styles.loadingContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="loading"
          size={30}
          color="#ffffff"
          style={styles.loadingIcon}
        />
        <Text style={styles.loadingText}>Cargando...</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    letterSpacing: 5,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 50,
  },
  icon: {
    margin: 10,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIcon: {
    marginRight: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default SplashScreen; 