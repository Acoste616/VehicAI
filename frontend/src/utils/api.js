// frontend/src/utils/api.js
import { getIdToken, getCurrentUser } from './firebase/auth';
import axios from 'axios';
import { API_URL } from './env';
import ROUTES from './routes';

// Create a reusable API instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Add token to request if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      // Clear token if it's invalid
      localStorage.removeItem('token');
      
      // Redirect to login page
      if (window.location.pathname !== ROUTES.LOGIN) {
        window.location.href = ROUTES.LOGIN;
      }
    }
    
    // Handle server errors (500)
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
      // Here you could trigger a notification to the user
    }
    
    return Promise.reject(error);
  }
);

/**
 * Car listing API
 */
export const carApi = {
  // Get all car listings with optional filters
  getListings: (filters = {}) => {
    // Convert filters object to URL query string
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    return api.get(`/cars${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get a single car listing by ID
  getListing: (id) => {
    return api.get(`/cars/${id}`);
  },
  
  // Create a new car listing (requires authentication)
  createListing: (listingData) => {
    return api.post('/cars', listingData);
  },
  
  // Update a car listing (requires authentication)
  updateListing: (id, listingData) => {
    return api.put(`/cars/${id}`, listingData);
  },
  
  // Delete a car listing (requires authentication)
  deleteListing: (id) => {
    return api.delete(`/cars/${id}`);
  },
  
  // Get user's own listings (requires authentication)
  getUserListings: () => {
    return api.get('/auth/user-listings');
  }
};

/**
 * User API
 */
export const userApi = {
  // Get current user profile (requires authentication)
  getProfile: () => {
    return api.get('/auth/me');
  },
  
  // Update user profile (requires authentication)
  updateProfile: (profileData) => {
    return api.post('/auth/update-profile', profileData);
  }
};

export default api;