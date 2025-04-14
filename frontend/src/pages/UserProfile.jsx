// frontend/src/pages/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const UserProfile = () => {
  const { currentUser, getToken, isEmailVerified } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userListings, setUserListings] = useState([]);

  // Fetch user profile and listings
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get authentication token
        const token = await getToken();
        
        // Create authenticated axios instance
        const authAxios = axios.create({
          baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Get user profile from backend
        const profileResponse = await authAxios.get('/auth/user');
        setUserProfile(profileResponse.data.user);
        
        // Get user's car listings
        const listingsResponse = await authAxios.get('/cars/user/listings');
        setUserListings(listingsResponse.data.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again later.');
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser, getToken]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* User Profile Header */}
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mr-4">
              {userProfile?.displayName?.charAt(0) || currentUser?.email?.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{userProfile?.displayName || 'User'}</h1>
              <p>{currentUser?.email}</p>
              {!isEmailVerified() && (
                <div className="mt-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded">
                  Email not verified
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* User Details */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Full Name</p>
                <p className="font-medium">{userProfile?.displayName || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-gray-600 text-sm">Email</p>
                <p className="font-medium">{currentUser?.email}</p>
              </div>
              
              <div>
                <p className="text-gray-600 text-sm">Member Since</p>
                <p className="font-medium">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-gray-600 text-sm">Last Login</p>
                <p className="font-medium">
                  {userProfile?.lastLogin ? new Date(userProfile.lastLogin.seconds * 1000).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Your Listings</h2>
            
            {userListings.length === 0 ? (
              <div className="bg-gray-100 p-4 rounded text-center">
                <p className="text-gray-600">You haven't created any listings yet.</p>
                <a href="/add" className="text-blue-500 hover:text-blue-700 font-medium mt-2 inline-block">
                  + Add a new listing
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userListings.map(listing => (
                  <div key={listing.id} className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="h-40 bg-gray-200 overflow-hidden">
                      {listing.mainImageUrl ? (
                        <img 
                          src={listing.mainImageUrl} 
                          alt={`${listing.brand} ${listing.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-lg">
                        {listing.brand} {listing.model} ({listing.year})
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {new Intl.NumberFormat('pl-PL', {
                          style: 'currency',
                          currency: 'PLN'
                        }).format(listing.price)}
                      </p>
                      
                      <div className="flex justify-between mt-4">
                        <a 
                          href={`/listing/${listing.id}`} 
                          className="text-blue-500 hover:text-blue-700"
                        >
                          View
                        </a>
                        <a 
                          href={`/edit/${listing.id}`} 
                          className="text-green-500 hover:text-green-700"
                        >
                          Edit
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;