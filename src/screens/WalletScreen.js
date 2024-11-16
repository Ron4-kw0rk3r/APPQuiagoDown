import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WalletScreen = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const addTransaction = (amount, type) => {
    const newTransaction = {
      id: Date.now(),
      amount,
      type,
      date: new Date().toLocaleDateString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setBalance(prev => type === 'income' ? prev + amount : prev - amount);
  };

  return (
    <View style={styles.container}>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Balance Total</Text>
        <Text style={styles.balanceAmount}>Bs. {balance.toFixed(2)}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.incomeButton]}
            onPress={() => addTransaction(100, 'income')}
          >
            <MaterialCommunityIcons name="cash-plus" size={24} color="white" />
            <Text style={styles.buttonText}>Ingreso</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.expenseButton]}
            onPress={() => addTransaction(50, 'expense')}
          >
            <MaterialCommunityIcons name="cash-minus" size={24} color="white" />
            <Text style={styles.buttonText}>Gasto</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.transactionsContainer}>
        <Text style={styles.transactionsTitle}>Historial</Text>
        <FlatList
          data={transactions}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <MaterialCommunityIcons 
                name={item.type === 'income' ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={24}
                color={item.type === 'income' ? '#4CAF50' : '#f44336'}
              />
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>
                  {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                </Text>
                <Text style={styles.transactionDate}>{item.date}</Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: item.type === 'income' ? '#4CAF50' : '#f44336' }
              ]}>
                Bs. {item.amount.toFixed(2)}
              </Text>
            </View>
          )}
          keyExtractor={item => item.id.toString()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  balanceContainer: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 25,
    width: '40%',
    justifyContent: 'center',
  },
  incomeButton: {
    backgroundColor: '#66BB6A',
  },
  expenseButton: {
    backgroundColor: '#EF5350',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  transactionsContainer: {
    flex: 1,
    padding: 20,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    color: '#666',
    fontSize: 14,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WalletScreen; 