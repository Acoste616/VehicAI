// backend/server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Załaduj zmienne środowiskowe
dotenv.config();

// Sprawdź czy istnieje plik klucza serwisowego
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.warn('\x1b[33m%s\x1b[0m', 'UWAGA: Plik serviceAccountKey.json nie istnieje!');
  console.warn('\x1b[33m%s\x1b[0m', 'Jeśli nie skonfigurowano zmiennych środowiskowych, Firebase nie będzie działać poprawnie.');
  console.warn('\x1b[33m%s\x1b[0m', 'Skopiuj plik vehicai-firebase-adminsdk-fbsvc-20254a2ede.json do katalogu głównego jako serviceAccountKey.json');
  
  // Opcjonalnie: Zakończ aplikację jeśli nie skonfigurowano również zmiennych środowiskowych
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    console.error('\x1b[31m%s\x1b[0m', 'BŁĄD: Brak konfiguracji Firebase! Aplikacja zostanie zakończona.');
    process.exit(1);
  }
}

// Importuj usługi Firebase
const { db, auth, admin } = require('./config/firebase');

// Importuj trasy
const carRoutes = require('./routes/carRoutes');
const authRoutes = require('./routes/authRoutes');

// Inicjalizacja aplikacji Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite default port and React default port
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev')); // Logowanie HTTP

// Udostępnij usługi Firebase globalnie dla tras
global.db = db;
global.auth = auth;
global.admin = admin;

// Trasy API
app.use('/cars', carRoutes);
app.use('/auth', authRoutes);

// Główna trasa
app.get('/', (req, res) => {
  res.json({
    message: 'VehicAI API',
    status: 'Działa poprawnie',
    version: '1.0.0'
  });
});

// Obsługa nieistniejących tras
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Nie znaleziono takiej trasy'
  });
});

// Middleware obsługi błędów
app.use((err, req, res, next) => {
  console.error('Błąd serwera:', err.stack);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Wystąpił nieoczekiwany błąd'
      : err.message
  });
});

// Uruchomienie serwera
app.listen(PORT, async () => {
  try {
    // Test połączenia z Firebase
    const testUser = await auth.getUserByEmail('test@example.com').catch(() => null);
    console.log('\x1b[32m%s\x1b[0m', 'Firebase Admin SDK zainicjalizowany poprawnie');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Błąd inicjalizacji Firebase Admin SDK:', error.message);
  }
  
  console.log(`Serwer uruchomiony na porcie ${PORT} w trybie ${process.env.NODE_ENV || 'development'}`);
  console.log(`Otwórz w przeglądarce: http://localhost:${PORT}`);
});