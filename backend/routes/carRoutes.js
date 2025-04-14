// routes/carRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { body, param, validationResult } = require('express-validator');
const { verifyToken, verifyResourceOwner } = require('../middleware/auth');

// Reference to Firestore
const db = admin.firestore();

/**
 * @route   GET /cars
 * @desc    Get all car listings with optional filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      brand, model, minPrice, maxPrice, minYear, maxYear, 
      fuelType, bodyType, limit = 20, offset = 0 
    } = req.query;
    
    let carsQuery = db.collection('listings');
    
    // Apply filters if provided
    if (brand) {
      carsQuery = carsQuery.where('brand', '==', brand);
    }
    
    if (model) {
      carsQuery = carsQuery.where('model', '==', model);
    }

    if (fuelType) {
      carsQuery = carsQuery.where('fuelType', '==', fuelType);
    }

    if (bodyType) {
      carsQuery = carsQuery.where('bodyType', '==', bodyType);
    }
    
    if (minYear) {
      carsQuery = carsQuery.where('year', '>=', parseInt(minYear));
    }
    
    if (maxYear) {
      carsQuery = carsQuery.where('year', '<=', parseInt(maxYear));
    }
    
    // Order by creation date, newest first
    carsQuery = carsQuery.orderBy('createdAt', 'desc').limit(parseInt(limit));
    
    const snapshot = await carsQuery.get();
    
    // Convert to array of car objects
    let cars = [];
    snapshot.forEach(doc => {
      const car = { id: doc.id, ...doc.data() };
      
      // Apply price filters in memory if needed
      if ((minPrice && car.price < parseInt(minPrice)) || 
          (maxPrice && car.price > parseInt(maxPrice))) {
        return;
      }
      
      cars.push(car);
    });
    
    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars
    });
  } catch (error) {
    console.error('Error fetching car listings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error while fetching listings'
    });
  }
});

/**
 * @route   GET /cars/:id
 * @desc    Get a single car listing by ID
 * @access  Public
 */
router.get('/:id', [
  param('id').notEmpty().withMessage('Car ID is required')
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
    const carId = req.params.id;
    const carDoc = await db.collection('listings').doc(carId).get();
    
    if (!carDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Car listing not found'
      });
    }
    
    // Increment view count
    await db.collection('listings').doc(carId).update({
      views: admin.firestore.FieldValue.increment(1)
    });
    
    const carData = { id: carDoc.id, ...carDoc.data() };
    
    res.status(200).json({
      success: true,
      data: carData
    });
  } catch (error) {
    console.error('Error fetching car listing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error while fetching listing'
    });
  }
});

/**
 * @route   POST /cars
 * @desc    Create a new car listing
 * @access  Private - Requires authentication
 */
router.post('/', [
  verifyToken, // Protect this route - user must be authenticated
  // Validate required fields
  body('brand').notEmpty().withMessage('Brand is required'),
  body('model').notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Valid year is required'),
  body('price').isInt({ min: 1 }).withMessage('Valid price is required'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('Mileage must be a positive number'),
  body('fuelType').optional(),
  body('transmission').optional(),
  body('engineCapacity').optional().isInt({ min: 1 }),
  body('power').optional().isInt({ min: 1 }),
  body('visualCondition').optional().isInt({ min: 1, max: 5 }),
  body('description').optional(),
  body('imageUrls').optional().isArray(),
  body('mainImageUrl').optional().isURL()
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
    const carData = req.body;
    
    // Add metadata with user info from token
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const newCar = {
      ...carData,
      userId: req.user.uid,
      userEmail: req.user.email,
      createdAt: timestamp,
      updatedAt: timestamp,
      views: 0
    };
    
    // Add to Firestore
    const docRef = await db.collection('listings').add(newCar);
    
    // Return the new car with its ID
    res.status(201).json({ 
      success: true,
      data: { 
        id: docRef.id, 
        ...newCar 
      },
      message: 'Car listing created successfully'
    });
  } catch (error) {
    console.error('Error creating car listing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error while creating listing'
    });
  }
});

/**
 * @route   PUT /cars/:id
 * @desc    Update a car listing
 * @access  Private - Requires authentication and ownership
 */
router.put('/:id', [
  verifyToken, // Protect this route - user must be authenticated
  verifyResourceOwner('listings', 'id', 'userId'), // Verify ownership
  param('id').notEmpty().withMessage('Car ID is required'),
  // Only validate fields that are present, allow partial updates
  body('brand').optional().notEmpty().withMessage('Brand cannot be empty'),
  body('model').optional().notEmpty().withMessage('Model cannot be empty'),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Valid year is required'),
  body('price').optional().isInt({ min: 1 }).withMessage('Valid price is required'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('Mileage must be a positive number'),
  body('engineCapacity').optional().isInt({ min: 1 }),
  body('power').optional().isInt({ min: 1 }),
  body('visualCondition').optional().isInt({ min: 1, max: 5 })
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
    const carId = req.params.id;
    const updates = req.body;
    
    // Car existence and ownership is verified in verifyResourceOwner middleware
    
    // Add update timestamp
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    // Update in Firestore
    await db.collection('listings').doc(carId).update(updates);
    
    res.status(200).json({ 
      success: true,
      data: { 
        id: carId, 
        ...updates 
      },
      message: 'Car listing updated successfully'
    });
  } catch (error) {
    console.error('Error updating car listing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error while updating listing'
    });
  }
});

/**
 * @route   DELETE /cars/:id
 * @desc    Delete a car listing
 * @access  Private - Requires authentication and ownership
 */
router.delete('/:id', [
  verifyToken, // Protect this route - user must be authenticated
  verifyResourceOwner('listings', 'id', 'userId'), // Verify ownership
  param('id').notEmpty().withMessage('Car ID is required')
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
    const carId = req.params.id;
    
    // Car existence and ownership is verified in verifyResourceOwner middleware
    
    // Delete from Firestore
    await db.collection('listings').doc(carId).delete();
    
    res.status(200).json({ 
      success: true,
      message: 'Car listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting car listing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error while deleting listing'
    });
  }
});

/**
 * @route   GET /cars/user/listings
 * @desc    Get car listings created by the authenticated user
 * @access  Private - Requires authentication
 */
router.get('/user/listings', verifyToken, async (req, res) => {
  try {
    // Get the user ID from the authenticated token
    const userId = req.user.uid;
    
    // Query Firestore for listings created by this user
    const listingsSnapshot = await db.collection('listings')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    // Convert to array
    const listings = [];
    listingsSnapshot.forEach(doc => {
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
 * @route GET /cars/user/:userId
 * @desc Get all car listings for a specific user
 * @access Private - Requires authentication
 */
router.get('/user/:userId', [
  verifyToken,
  param('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify that the requesting user is the owner or an admin
    if (req.user.uid !== userId && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }
    
    const snapshot = await db.collection('listings')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const cars = [];
    snapshot.forEach(doc => {
      cars.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars
    });
  } catch (error) {
    console.error('Error fetching user car listings:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user listings'
    });
  }
});

module.exports = router;