import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WalletScreen = () => {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  const wallets = [
    { 
      id: 'metamask', 
      name: 'MetaMask', 
      icon: 'ethereum',
      color: '#F6851B',
      deepLink: 'metamask://',
      storeUrl: Platform.select({
        ios: 'https://apps.apple.com/us/app/metamask/id1438144202',
        android: 'market://details?id=io.metamask',
      })
    },
    { 
      id: 'trustwallet', 
      name: 'Trust Wallet', 
      icon: 'wallet',
      color: '#3375BB',
      deepLink: 'trust://',
      storeUrl: Platform.select({
        ios: 'https://apps.apple.com/us/app/trust-crypto-bitcoin-wallet/id1288339409',
        android: 'market://details?id=com.wallet.crypto.trustapp',
      })
    },
    { 
      id: 'phantom', 
      name: 'Phantom', 
      icon: 'ghost',
      color: '#AB9FF2',
      deepLink: 'phantom://',
      storeUrl: Platform.select({
        ios: 'https://apps.apple.com/us/app/phantom-solana-wallet/id1598432977',
        android: 'market://details?id=app.phantom',
      })
    }
  ];

  const handleConnectWallet = async (wallet) => {
    try {
      const supported = await Linking.canOpenURL(wallet.deepLink);
      if (supported) {
        await Linking.openURL(wallet.deepLink);
        setSelectedWallet(wallet);
      } else {
        Alert.alert(
          'Wallet no instalada',
          '¿Deseas instalar la wallet?',
          [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'Instalar',
              onPress: () => Linking.openURL(wallet.storeUrl)
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la wallet');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Billetera</Text>
      </View>

      {!selectedWallet ? (
        <View style={styles.connectContainer}>
          <View style={styles.illustration}>
            <MaterialCommunityIcons name="wallet-outline" size={100} color="#1E88E5" />
          </View>
          <Text style={styles.connectTitle}>Conecta tu Billetera</Text>
          <Text style={styles.connectDescription}>
            Conecta tu billetera digital para acceder a todas las funcionalidades
          </Text>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => setShowConnectModal(true)}
          >
            <Text style={styles.connectButtonText}>Conectar Billetera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.walletContent}>
          <View style={styles.walletHeader}>
            <MaterialCommunityIcons 
              name={selectedWallet.icon} 
              size={40} 
              color={selectedWallet.color} 
            />
            <Text style={styles.walletName}>{selectedWallet.name}</Text>
            <Text style={styles.walletStatus}>Conectado</Text>
          </View>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Balance Total</Text>
            <Text style={styles.balanceAmount}>0.00 ETH</Text>
            <Text style={styles.balanceUsd}>$0.00 USD</Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="send" size={24} color="#1E88E5" />
              <Text style={styles.actionText}>Enviar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="download" size={24} color="#1E88E5" />
              <Text style={styles.actionText}>Recibir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="swap-horizontal" size={24} color="#1E88E5" />
              <Text style={styles.actionText}>Swap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showConnectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConnectModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona tu Billetera</Text>
            {wallets.map(wallet => (
              <TouchableOpacity
                key={wallet.id}
                style={styles.walletOption}
                onPress={() => handleConnectWallet(wallet)}
              >
                <MaterialCommunityIcons name={wallet.icon} size={32} color={wallet.color} />
                <Text style={styles.walletOptionName}>{wallet.name}</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowConnectModal(false)}
            >
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1E88E5',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  connectContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  illustration: {
    marginBottom: 30,
  },
  connectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  connectDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  connectButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
  },
  connectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  walletOptionName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
  },
  closeButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletContent: {
    flex: 1,
  },
  walletHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  walletName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  walletStatus: {
    color: '#4CAF50',
    marginTop: 5,
  },
  balanceContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: 10,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  balanceUsd: {
    fontSize: 16,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: 10,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 5,
    color: '#1E88E5',
  },
});

export default WalletScreen; 