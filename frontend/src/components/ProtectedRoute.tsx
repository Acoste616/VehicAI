import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

/**
 * Protected Route Component
 * Redirects to login page if user is not authenticated
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {boolean} props.requireVerification - Whether to also require email verification
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireVerification = false 
}) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Additional check for email verification if required
  if (requireVerification && !currentUser.emailVerified) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-yellow-800 mb-3">Email Verification Required</h2>
        <p className="text-yellow-700 mb-4">
          You need to verify your email address before accessing this page.
          Please check your inbox for the verification email.
        </p>
        <button 
          onClick={() => {
            // This would trigger sending a verification email
            alert('Verification email sent. Please check your inbox.');
          }}
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
        >
          Resend Verification Email
        </button>
      </div>
    );
  }

  // User is authenticated (and verified if required), render children
  return <>{children}</>;
};

export default ProtectedRoute;