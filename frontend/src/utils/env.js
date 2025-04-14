/**
 * Environment Variables
 * Centralizes environment variables to make them safely accessible across the app
 */

// API URL for backend communication
export const API_URL = import.meta.env.VITE_API_URL || '/api';

// App environment (development, test, production)
export const NODE_ENV = import.meta.env.MODE || 'development';

// Whether the app is running in production
export const IS_PRODUCTION = NODE_ENV === 'production';

// Whether the app is running in development
export const IS_DEVELOPMENT = NODE_ENV === 'development';

// Firebase configuration
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export default {
  API_URL,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  FIREBASE_CONFIG
}; 