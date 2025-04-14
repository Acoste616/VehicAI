// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from '../utils/api';

// Define the shape of the user object
/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} [displayName] - Optional user display name
 * @property {boolean} emailVerified - Whether the user's email is verified
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User|null} user - Current user or null if not authenticated
 * @property {boolean} loading - Whether auth state is being loaded
 * @property {string|null} error - Current error message or null
 * @property {function(string, string): Promise<User>} login - Login function
 * @property {function(Object): Promise<User>} register - Register function
 * @property {function(): void} logout - Logout function
 * @property {function(string): Promise<void>} resetPassword - Reset password function
 * @property {function(string): Promise<void>} verifyEmail - Verify email function
 * @property {User|null} currentUser - Alias for user to match Firebase naming
 */

// Create auth context
/** @type {React.Context<AuthContextType>} */
const AuthContext = createContext(null);

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear error on state changes
  const clearError = () => setError(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/auth/me');
          setUser(response.data);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    clearError();
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    clearError();
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    clearError();
    localStorage.removeItem('token');
    setUser(null);
  };

  const resetPassword = async (email) => {
    clearError();
    try {
      await api.post('/auth/reset-password', { email });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Password reset request failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const verifyEmail = async (actionCode) => {
    clearError();
    try {
      await api.post('/auth/verify-email', { actionCode });
      
      // If the user is logged in, update their email verification status
      if (user) {
        setUser({
          ...user,
          emailVerified: true
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Email verification failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    verifyEmail,
    currentUser: user // Alias for user to match Firebase naming in components
  }), [user, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;