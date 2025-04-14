// backend/config/firebase.js
// Firebase Admin SDK configuration

const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// You need to download your service account key from Firebase console
// Firebase Project Settings > Service Accounts > Generate new private key
// Save the file as serviceAccountKey.json in the backend directory
// IMPORTANT: Add serviceAccountKey.json to .gitignore to keep it secure!

let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (error) {
  console.error('Service account key file not found. Using environment variables instead.');
  // Alternatively, you can use environment variables
  serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'vehicai.appspot.com'
});

// Initialize Firestore
const db = admin.firestore();
const storage = admin.storage();
const auth = admin.auth();

// Export Firebase services
module.exports = {
  admin,
  db,
  storage,
  auth
};