const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin using environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    try {
      const existingUser = await auth.getUserByEmail('admin@vehicai.com');
      console.log('Admin user already exists:', existingUser.uid);
      return;
    } catch (error) {
      // User doesn't exist, continue with creation
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: 'admin@vehicai.com',
      password: 'admin123',
      displayName: 'Admin'
    });

    // Set custom claims to make user an admin
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: 'admin@vehicai.com',
      displayName: 'Admin',
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Admin user created successfully:', userRecord.uid);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit();
  }
}

createAdminUser(); 