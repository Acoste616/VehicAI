// backend/routes/userRoutes.js
// Routes for user management

const express = require('express');
const router = express.Router();
const { auth, db } = require('../config/firebase');
const { checkAuth } = require('../middleware/auth');

// Get current user data
// GET /api/users/me
// Requires authentication
router.get('/me', checkAuth, async (req, res) => {
  try {
    // Fetch user profile from Firestore, create if doesn't exist
    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create basic profile if doesn't exist
      const newUser = {
        uid: req.user.uid,
        email: req.user.email,
        displayName: req.user.name || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await userRef.set(newUser);
      
      return res.json(newUser);
    }
    
    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Update user profile
// PUT /api/users/profile
// Requires authentication
router.put('/profile', checkAuth, async (req, res) => {
  try {
    const updates = req.body;
    const uid = req.user.uid;
    
    // Prevent updating sensitive fields
    delete updates.uid;
    delete updates.email;
    delete updates.createdAt;
    
    // Update timestamp
    updates.updatedAt = new Date();
    
    // Update profile in Firestore
    await db.collection('users').doc(uid).update(updates);
    
    res.json({ 
      message: 'Profile updated successfully', 
      ...updates 
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Get user's car listings
// GET /api/users/listings
// Requires authentication
router.get('/listings', checkAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    
    // Query Firestore for user's listings
    const listingsQuery = await db.collection('listings')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const listings = [];
    listingsQuery.forEach(doc => {
      listings.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(listings);
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Get user's saved/favorited listings
// GET /api/users/favorites
// Requires authentication
router.get('/favorites', checkAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    
    // Get user's favorites document
    const favoritesDoc = await db.collection('favorites').doc(uid).get();
    
    if (!favoritesDoc.exists) {
      return res.json([]);
    }
    
    const favoriteIds = favoritesDoc.data().listings || [];
    
    if (favoriteIds.length === 0) {
      return res.json([]);
    }
    
    // Get details for each favorite listing
    // Firestore doesn't support array contains in queries directly, so we need to fetch each one
    const favorites = [];
    
    // Batch get listings (limit to 10 at a time to prevent exceeding Firestore limits)
    for (let i = 0; i < favoriteIds.length; i += 10) {
      const batch = favoriteIds.slice(i, i + 10);
      const listingsSnapshot = await Promise.all(
        batch.map(id => db.collection('listings').doc(id).get())
      );
      
      listingsSnapshot.forEach(doc => {
        if (doc.exists) {
          favorites.push({ id: doc.id, ...doc.data() });
        }
      });
    }
    
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Add a listing to favorites
// POST /api/users/favorites/:listingId
// Requires authentication
router.post('/favorites/:listingId', checkAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const listingId = req.params.listingId;
    
    // Check if listing exists
    const listingDoc = await db.collection('listings').doc(listingId).get();
    
    if (!listingDoc.exists) {
      return res.status(404).json({ error: true, message: 'Listing not found' });
    }
    
    // Add to favorites using arrayUnion
    await db.collection('favorites').doc(uid).set({
      listings: admin.firestore.FieldValue.arrayUnion(listingId)
    }, { merge: true });
    
    res.json({ message: 'Listing added to favorites' });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Remove a listing from favorites
// DELETE /api/users/favorites/:listingId
// Requires authentication
router.delete('/favorites/:listingId', checkAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const listingId = req.params.listingId;
    
    // Remove from favorites using arrayRemove
    await db.collection('favorites').doc(uid).update({
      listings: admin.firestore.FieldValue.arrayRemove(listingId)
    });
    
    res.json({ message: 'Listing removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;