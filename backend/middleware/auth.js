// middleware/auth.js
const admin = require('firebase-admin');

/**
 * Middleware to verify Firebase authentication token
 * This middleware extracts the token from the Authorization header,
 * verifies it, and attaches the user data to the request object.
 */
const verifyToken = async (req, res, next) => {
  try {
    // Check if the Authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. No token provided or invalid format.' 
      });
    }

    // Extract the token
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. Invalid token format.' 
      });
    }

    // Verify the token with Firebase Auth
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Add user info to request object
    req.user = decodedToken;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle specific token errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. Token expired.' 
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. Token has been revoked.' 
      });
    }
    
    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. Invalid token.' 
      });
    }
    
    // Generic error response
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication failed. Server error.' 
    });
  }
};

/**
 * Middleware to verify admin role
 * This middleware checks if the authenticated user has admin claims
 * Must be used after verifyToken middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'User not authenticated.' 
    });
  }

  // Check if user has admin custom claim
  if (!req.user.admin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  
  next();
};

/**
 * Middleware to check if the user is verified
 * This middleware verifies if the user's email is verified
 * Must be used after verifyToken middleware
 */
const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'User not authenticated.' 
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Email verification required.' 
    });
  }
  
  next();
};

/**
 * Middleware to verify resource ownership
 * This factory function creates middleware that checks if the authenticated user
 * owns the resource they are trying to access
 * 
 * @param {string} collectionName - Firestore collection name
 * @param {string} paramName - Route parameter name containing the resource ID
 * @param {string} ownerField - Field name in the document that contains the owner ID
 */
const verifyResourceOwner = (collectionName, paramName = 'id', ownerField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'User not authenticated.' 
        });
      }

      const resourceId = req.params[paramName];
      if (!resourceId) {
        return res.status(400).json({ 
          success: false, 
          error: `Resource ID not provided in parameter: ${paramName}` 
        });
      }

      // Get the resource from Firestore
      const resourceDoc = await admin.firestore().collection(collectionName).doc(resourceId).get();
      
      if (!resourceDoc.exists) {
        return res.status(404).json({ 
          success: false, 
          error: 'Resource not found.' 
        });
      }
      
      const resource = resourceDoc.data();
      
      // Check if the current user is the owner of the resource
      // Also allow admin users to access any resource
      if (resource[ownerField] !== req.user.uid && !req.user.admin) {
        return res.status(403).json({ 
          success: false, 
          error: 'Access denied. You do not own this resource.' 
        });
      }
      
      // Add the resource to the request for use in route handlers
      req.resource = {
        id: resourceDoc.id,
        ...resource
      };
      
      next();
    } catch (error) {
      console.error('Resource ownership verification error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Server error while verifying resource ownership.' 
      });
    }
  };
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireVerifiedEmail,
  verifyResourceOwner
};