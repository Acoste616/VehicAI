// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ROUTES from '../utils/routes';
import LoadingSpinner from './LoadingSpinner';

/**
 * Protected Route Component
 * Protects routes that require authentication
 * Redirects to login with the current location for post-login redirect
 * 
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Save the current location for redirect after login
    return (
      <Navigate 
        to={ROUTES.LOGIN} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  return children;
};

export default ProtectedRoute;