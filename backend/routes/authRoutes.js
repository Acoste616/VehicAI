// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { body, validationResult } = require('express-validator');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Reference to Firestore and Auth
const db = admin.firestore();
const auth = admin.auth();

/**
 * GET /auth/me
 * Get current user profile
 * Protected route - requires valid authentication
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    // User data from the token
    const { uid, email, email_verified } = req.user;
    
    // Get additional user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    let userData = {
      uid,
      email,
      emailVerified: email_verified
    };
    
    // Merge with Firestore data if it exists
    if (userDoc.exists) {
      userData = {
        ...userData,
        ...userDoc.data()
      };
    } else {
      // Create a basic user document if it doesn't exist
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const newUserData = {
        uid,
        email,
        emailVerified: email_verified,
        displayName: req.user.name || null,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await db.collection('users').doc(uid).set(newUserData);
      userData = newUserData;
    }
    
    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user profile'
    });
  }
});

/**
 * POST /auth/update-profile
 * Update user profile
 * Protected route - requires valid authentication
 */
router.post('/update-profile', [
  verifyToken,
  body('displayName').optional().notEmpty().trim().withMessage('Display name cannot be empty'),
  body('phoneNumber').optional(),
  body('location').optional()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  try {
    const { uid } = req.user;
    const userData = req.body;
    
    // Remove sensitive fields from updates
    const allowedFields = ['displayName', 'phoneNumber', 'location', 'photoURL'];
    const updates = Object.keys(userData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = userData[key];
        return obj;
      }, {});
    
    // Always update timestamp
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    // Update in Firestore
    await db.collection('users').doc(uid).update(updates);
    
    // Update display name in Firebase Auth if provided
    if (updates.displayName) {
      await auth.updateUser(uid, { displayName: updates.displayName });
    }
    
    res.status(200).json({
      success: true,
      data: updates,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating profile'
    });
  }
});

/**
 * POST /auth/make-admin
 * Make a user an admin
 * Protected route - requires valid authentication and admin privileges
 */
router.post('/make-admin', [
  verifyToken,
  requireAdmin,
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  try {
    const { email } = req.body;
    
    // First, get the user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Set custom claims to include admin role
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    
    // Update the user document in Firestore
    await db.collection('users').doc(userRecord.uid).update({
      isAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({
      success: true,
      message: `User ${email} has been granted admin privileges`
    });
  } catch (error) {
    console.error('Error granting admin privileges:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while granting admin privileges'
    });
  }
});

/**
 * GET /auth/user-listings
 * Get listings created by current user
 * Protected route - requires valid authentication
 */
router.get('/user-listings', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Query Firestore for listings created by this user
    const snapshot = await db.collection('listings')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const listings = [];
    snapshot.forEach(doc => {
      listings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user listings'
    });
  }
});

/**
 * POST /auth/verify-email
 * Send email verification
 * Protected route - requires valid authentication
 */
router.post('/verify-email', verifyToken, async (req, res) => {
  try {
    // Currently, Firebase Admin SDK doesn't support sending verification emails directly.
    // This needs to be implemented in the client-side using Firebase Auth client SDK.
    
    res.status(400).json({
      success: false,
      error: 'Email verification should be handled on the client side with Firebase Auth.'
    });
  } catch (error) {
    console.error('Error with email verification:', error);
    res.status(500).json({
      success: false,
      error: 'Server error with email verification'
    });
  }
});

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('displayName').optional().trim(),
  body('phoneNumber').optional()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, displayName, phoneNumber } = req.body;

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      phoneNumber
    });

    // Create user document in Firestore
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const userData = {
      uid: userRecord.uid,
      email,
      displayName,
      phoneNumber,
      emailVerified: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Generate custom token for immediate login
    const token = await auth.createCustomToken(userRecord.uid);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: userData
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

/**
 * POST /auth/login
 * Login user and return JWT token
 */
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Sign in with Firebase Auth
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Get custom claims and user data
    const token = await user.getIdToken();
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    let userData = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    };
    
    if (userDoc.exists) {
      userData = {
        ...userData,
        ...userDoc.data()
      };
    }
    
    res.status(200).json({
      success: true,
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }
});

module.exports = router;