// Plik: src/firebase/config.js
// Konfiguracja Firebase dla projektu VehicAI

// Import modułów Firebase SDK v9 (modułowe)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Tutaj wklej swoje dane z Firebase console
// Można je znaleźć po stworzeniu projektu w Firebase Console
// Project Settings -> General -> Your apps -> Firebase SDK snippet -> Config
const firebaseConfig = {
  apiKey: "AIzaSyAsm5NXVuX_-YIwIYW99kRzycFR31bJI-Q",
  authDomain: "vehicai.firebaseapp.com",
  projectId: "vehicai",
  storageBucket: "vehicai.firebasestorage.app",
  messagingSenderId: "467145515465",
  appId: "1:467145515465:web:6ab48826c6a547054f4818",
  measurementId: "G-68HLG510RG"
};

// Inicjalizacja aplikacji Firebase
const app = initializeApp(firebaseConfig);

// Inicjalizacja usług Firebase
const db = getFirestore(app);      // Firestore Database
const storage = getStorage(app);   // Storage (zdjęcia)
const auth = getAuth(app);         // Authentication

// Eksport zainicjalizowanych usług do użycia w całej aplikacji
export { db, storage, auth };
export default app;