import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Text,
  Dimensions,
  PanResponder,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const MINIMIZED_HEIGHT = 60;
const MAXIMIZED_HEIGHT = height * 0.4;

const CurvedPanel = ({ children, title }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const panY = useRef(new Animated.Value(0)).current;
  const lastGestureDy = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastGestureDy.current = panY._value;
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = lastGestureDy.current + gestureState.dy;
        if (newValue >= 0 && newValue <= MAXIMIZED_HEIGHT - MINIMIZED_HEIGHT) {
          panY.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.vy) > 0.5) {
          // Velocidad suficiente para determinar la intención del usuario
          const shouldExpand = gestureState.vy < 0;
          togglePanel(shouldExpand);
        } else {
          // Basado en la posición
          const shouldExpand = panY._value < (MAXIMIZED_HEIGHT - MINIMIZED_HEIGHT) / 2;
          togglePanel(shouldExpand);
        }
      },
    })
  ).current;

  const togglePanel = (expand) => {
    setIsExpanded(expand);
    Animated.spring(panY, {
      toValue: expand ? 0 : MAXIMIZED_HEIGHT - MINIMIZED_HEIGHT,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
  };

  const animatedHeight = panY.interpolate({
    inputRange: [0, MAXIMIZED_HEIGHT - MINIMIZED_HEIGHT],
    outputRange: [MAXIMIZED_HEIGHT, MINIMIZED_HEIGHT],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: animatedHeight,
        },
      ]}
    >
      <View {...panResponder.panHandlers} style={styles.dragHandle}>
        <View style={styles.handleBar} />
        <Text style={styles.title}>{title}</Text>
        <MaterialCommunityIcons 
          name={isExpanded ? "chevron-down" : "chevron-up"} 
          size={24} 
          color="#666"
        />
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dragHandle: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
});

export default CurvedPanel; 