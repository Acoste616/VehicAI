import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useCars from '../hooks/useCars';
import CarList from '../components/CarList';
import Notification from '../components/Notification';

const UserDashboard: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { fetchUserCars, loading: carsLoading } = useCars();
  const [activeTab, setActiveTab] = useState<'listings' | 'profile'>('listings');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading && !currentUser) {
      navigate('/login', { state: { from: '/dashboard' } });
    }
  }, [authLoading, currentUser, navigate]);

  // Handle message from redirect (e.g., after adding/editing a car)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    const type = params.get('type') as 'success' | 'error' | 'info';
    
    if (message && (type === 'success' || type === 'error' || type === 'info')) {
      setNotification({ type, message });
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="mt-1 text-blue-100">
            Welcome back, {currentUser.displayName || currentUser.email}
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div className="p-4">
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('listings')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'listings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Listings
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'listings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">My Car Listings</h2>
                <Link
                  to="/add-car"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Car
                </Link>
              </div>
              
              {/* Car Listings */}
              <CarList showUserCarsOnly={true} showActions={true} />
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Information</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{currentUser.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Display Name</p>
                    <p className="font-medium">{currentUser.displayName || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Account ID</p>
                    <p className="font-mono text-sm text-gray-600">{currentUser.uid}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Email Verification</p>
                    <p className={`font-medium ${currentUser.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {currentUser.emailVerified ? 'Verified' : 'Not Verified'}
                    </p>
                  </div>
                  
                  {!currentUser.emailVerified && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          // This would trigger email verification
                          setNotification({
                            type: 'info',
                            message: 'Verification email has been sent. Please check your inbox.'
                          });
                        }}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        Send Verification Email
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Account Settings</h3>
                  
                  <div className="space-y-4">
                    <Link
                      to="/profile/edit"
                      className="inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                    >
                      Edit Profile
                    </Link>
                    
                    <button
                      onClick={() => {
                        // This would be the password reset flow
                        setNotification({
                          type: 'info',
                          message: 'Password reset email has been sent. Please check your inbox.'
                        });
                      }}
                      className="block text-blue-600 hover:text-blue-800"
                    >
                      Reset Password
                    </button>
                    
                    <button
                      onClick={() => {
                        // This would be handled by your auth service
                        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          setNotification({
                            type: 'error',
                            message: 'Account deletion is not implemented yet.'
                          });
                        }
                      }}
                      className="block text-red-600 hover:text-red-800"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;