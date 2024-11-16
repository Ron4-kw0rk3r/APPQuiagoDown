import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('quiago.db');

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Tabla de usuarios
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT,
          profile_photo TEXT
        );`
      );

      // Tabla de ubicaciones guardadas
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          latitude REAL,
          longitude REAL,
          description TEXT,
          user_id INTEGER,
          created_at TEXT,
          is_synced INTEGER DEFAULT 0
        );`
      );

      // Tabla de rutas
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS routes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          start_lat REAL,
          start_lng REAL,
          end_lat REAL,
          end_lng REAL,
          distance REAL,
          duration INTEGER,
          is_synced INTEGER DEFAULT 0
        );`
      );
    }, reject, resolve);
  });
}; 