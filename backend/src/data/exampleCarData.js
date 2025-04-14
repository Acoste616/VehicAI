// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { body, validationResult } = require('express-validator');

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  // Validate input
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('displayName').notEmpty().withMessage('Display name is required')
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
    const { email, password, displayName } = req.body;

    // Create a new user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName
    });

    // Create a user document in Firestore
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      createdAt: timestamp,
      updatedAt: timestamp,
      isAdmin: false
    });

    // Send verification email
    // Note: This functionality requires custom email templates setup in Firebase console
    // const emailVerificationLink = await admin.auth().generateEmailVerificationLink(email);
    // Send email using your email service

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: userRecord.uid
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({
        success: false,
        error: 'The email address is already in use'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to register user. Please try again.'
    });
  }
});

/**
 * @route   POST /auth/login
 * @desc    Login user - Note: In practice, the actual login happens client-side with Firebase Auth SDK
 *          This endpoint is mainly for testing or custom token generation
 * @access  Public
 */
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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
    const { email, password } = req.body;

    // NOTE: Server cannot directly authenticate with email/password using Admin SDK
    // This is a placeholder. In a real app:
    // 1. Frontend authenticates directly with Firebase Auth SDK
    // 2. Gets the ID token and sends it to backend for verification
    // 3. Backend verifies the token and allows access
    
    // For testing purposes only - creates a custom token
    // The client would still need to exchange this for an ID token
    try {
      // Get the user by email first
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // Generate a custom token - in a real app, client uses email/password auth
      const customToken = await admin.auth().createCustomToken(userRecord.uid);
      
      res.status(200).json({
        success: true,
        message: 'Custom token generated (for testing only)',
        customToken
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed. Please try again.'
    });
  }
});

/**
 * @route   POST /auth/token-signin
 * @desc    Verify Firebase ID token sent from client
 * @access  Public
 */
router.post('/token-signin', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required'
      });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user info
    const userRecord = await admin.auth().getUser(uid);
    
    // Update last login in Firestore
    await admin.firestore().collection('users').doc(uid).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: 'Token verified successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

/**
 * @route   POST /auth/logout
 * @desc    For server-side logout actions (revoke tokens, etc.)
 * @access  Protected
 */
router.post('/logout', async (req, res) => {
  try {
    // Logout happens client-side, but server can revoke tokens if needed
    const { uid } = req.body;
    
    if (uid) {
      // Revoke all refresh tokens for a user
      await admin.auth().revokeRefreshTokens(uid);
      
      res.status(200).json({
        success: true,
        message: 'User sessions revoked successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process logout'
    });
  }
});

/**
 * @route   GET /auth/user
 * @desc    Get current user info
 * @access  Protected
 */
router.get('/user', async (req, res) => {
  try {
    // User info is added by the auth middleware
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get additional user info from Firestore
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
    
    let userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.name,
      emailVerified: user.email_verified
    };
    
    if (userDoc.exists) {
      userData = {
        ...userData,
        ...userDoc.data()
      };
    }

    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
});

module.exports = router;