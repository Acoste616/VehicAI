// frontend/src/utils/firebase/auth.js
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import app from './config'; // Import Firebase app configuration as default
import axios from 'axios';

// Initialize Firebase Auth
const auth = getAuth(app);

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Register a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} displayName - User's display name
 * @returns {Promise} Promise that resolves with user data
 */
export const registerWithEmailAndPassword = async (email, password, displayName) => {
  try {
    // First register with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, { displayName });
    
    // Send email verification
    await sendEmailVerification(user);
    
    // Get ID token for backend validation
    const idToken = await user.getIdToken();
    
    // Register with our backend (optional - depends on your design)
    await axios.post(`${API_URL}/auth/register`, {
      email,
      displayName,
      idToken // Send the token for verification
    });
    
    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Sign in with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} Promise that resolves with user data
 */
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get ID token
    const idToken = await user.getIdToken();
    
    // Verify token with backend (optional)
    await axios.post(`${API_URL}/auth/token-signin`, { idToken });
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Sign in with Google
 * @returns {Promise} Promise that resolves with user data
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    // Get ID token
    const idToken = await user.getIdToken();
    
    // Verify token with backend (optional)
    await axios.post(`${API_URL}/auth/token-signin`, { idToken });
    
    return user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 * @returns {Promise} Promise that resolves when sign out is complete
 */
export const logoutUser = async () => {
  try {
    // If needed, you can perform server-side logout actions here
    // const user = auth.currentUser;
    // if (user) {
    //   const idToken = await user.getIdToken();
    //   await axios.post(`${API_URL}/auth/logout`, { uid: user.uid }, {
    //     headers: { Authorization: `Bearer ${idToken}` }
    //   });
    // }
    
    // Sign out from Firebase Auth
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise} Promise that resolves when the email is sent
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Get the current user
 * @returns {Object|null} Current user object or null if not signed in
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Get ID token for the current user
 * @param {boolean} forceRefresh - Whether to force refresh the token
 * @returns {Promise<string>} Promise that resolves with the ID token
 */
export const getIdToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken(forceRefresh);
  }
  throw new Error('No user is signed in');
};

/**
 * Create an axios instance with authentication
 * This can be used for making authenticated API requests
 * @returns {Promise<Object>} Axios instance with auth header
 */
export const getAuthenticatedAxios = async () => {
  const token = await getIdToken();
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export default {
  registerWithEmailAndPassword,
  loginWithEmailAndPassword,
  signInWithGoogle,
  logoutUser,
  resetPassword,
  getCurrentUser,
  getIdToken,
  getAuthenticatedAxios,
  onAuthStateChange
};