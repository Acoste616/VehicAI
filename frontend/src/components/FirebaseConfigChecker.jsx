import React, { useState, useEffect } from 'react';
import { getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut } from 'firebase/auth';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../config/firebase';

const FirebaseConfigChecker = () => {
  const [appStatus, setAppStatus] = useState({ status: 'checking', message: null });
  const [authStatus, setAuthStatus] = useState({ status: 'checking', message: null });
  const [firestoreStatus, setFirestoreStatus] = useState({ status: 'checking', message: null });
  const [rulesStatus, setRulesStatus] = useState({ status: 'checking', message: null });
  const [configValues, setConfigValues] = useState({});

  useEffect(() => {
    checkFirebase();
  }, []);

  const checkFirebase = async () => {
    // Check Firebase App initialization
    try {
      const app = getApp();
      setAppStatus({ 
        status: 'success', 
        message: `Firebase initialized successfully (${app.name})` 
      });
      
      // Check Firebase config values
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '❌ Missing',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '❌ Missing',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓ Set' : '❌ Missing',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✓ Set' : '❌ Missing',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✓ Set' : '❌ Missing',
        appId: import.meta.env.VITE_FIREBASE_APP_ID ? '✓ Set' : '❌ Missing'
      };
      
      setConfigValues(config);
    } catch (error) {
      setAppStatus({ 
        status: 'error', 
        message: `Failed to initialize Firebase: ${error.message}` 
      });
      return; // Stop if app initialization failed
    }

    // Check Firebase Auth
    try {
      const auth = getAuth();
      setAuthStatus({ status: 'pending', message: 'Testing anonymous auth...' });
      
      // Try anonymous auth
      await signInAnonymously(auth);
      await signOut(auth);
      
      setAuthStatus({ 
        status: 'success', 
        message: 'Firebase Auth is working correctly' 
      });
    } catch (error) {
      setAuthStatus({ 
        status: 'error', 
        message: `Firebase Auth error: ${error.message} (code: ${error.code})` 
      });
    }

    // Check Firestore
    try {
      setFirestoreStatus({ status: 'pending', message: 'Testing Firestore connection...' });
      
      // Test general Firestore connection
      const testQuery = query(collection(db, 'users'), limit(1));
      await getDocs(testQuery);
      
      setFirestoreStatus({ 
        status: 'success', 
        message: 'Firestore connection successful' 
      });
    } catch (error) {
      const errorMessage = error.message;
      if (errorMessage.includes('permission-denied') || errorMessage.includes('Missing or insufficient permissions')) {
        setFirestoreStatus({ 
          status: 'warning', 
          message: 'Firestore connection works, but permissions might be an issue. Check security rules.' 
        });
      } else if (errorMessage.includes('PERMISSION_DENIED')) {
        setFirestoreStatus({ 
          status: 'warning', 
          message: 'Firestore permission denied. This may be due to security rules, which is OK.' 
        });
      } else {
        setFirestoreStatus({ 
          status: 'error', 
          message: `Firestore error: ${error.message}` 
        });
      }
    }

    // Check Firestore Security Rules
    try {
      setRulesStatus({ status: 'pending', message: 'Testing Firestore security rules...' });
      
      // Try reading from cars collection (anonymously)
      try {
        const carsQuery = query(collection(db, 'cars'), limit(1));
        await getDocs(carsQuery);
        
        // If we get here, anonymous read is allowed
        setRulesStatus({ 
          status: 'warning', 
          message: 'Warning: cars collection might allow anonymous reads. Check your security rules.' 
        });
      } catch (carsError) {
        if (carsError.message.includes('permission-denied') || carsError.message.includes('Missing or insufficient permissions')) {
          setRulesStatus({ 
            status: 'success', 
            message: 'Security rules working correctly - anonymous users cannot read cars collection' 
          });
        } else {
          setRulesStatus({ 
            status: 'warning', 
            message: `Unknown error when checking cars collection: ${carsError.message}` 
          });
        }
      }
    } catch (error) {
      setRulesStatus({ 
        status: 'error', 
        message: `Error checking security rules: ${error.message}` 
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'pending': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'success': return 'bg-green-50';
      case 'error': return 'bg-red-50';
      case 'warning': return 'bg-yellow-50';
      case 'pending': return 'bg-blue-50';
      default: return 'bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Firebase Configuration Check</h2>
      
      <div className="space-y-4">
        {/* Firebase App */}
        <div className={`p-4 rounded-md ${getStatusBg(appStatus.status)}`}>
          <h3 className={`text-lg font-semibold ${getStatusColor(appStatus.status)} flex items-center`}>
            {getStatusIcon(appStatus.status)} Firebase App
          </h3>
          <p className="mt-1 text-gray-700">{appStatus.message}</p>
          
          {Object.keys(configValues).length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {Object.entries(configValues).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="font-medium mr-2">{key}:</span>
                  <span className={value.includes('❌') ? 'text-red-600' : 'text-green-600'}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Firebase Auth */}
        <div className={`p-4 rounded-md ${getStatusBg(authStatus.status)}`}>
          <h3 className={`text-lg font-semibold ${getStatusColor(authStatus.status)} flex items-center`}>
            {getStatusIcon(authStatus.status)} Firebase Authentication
          </h3>
          <p className="mt-1 text-gray-700">{authStatus.message}</p>
        </div>
        
        {/* Firestore */}
        <div className={`p-4 rounded-md ${getStatusBg(firestoreStatus.status)}`}>
          <h3 className={`text-lg font-semibold ${getStatusColor(firestoreStatus.status)} flex items-center`}>
            {getStatusIcon(firestoreStatus.status)} Firestore Database
          </h3>
          <p className="mt-1 text-gray-700">{firestoreStatus.message}</p>
        </div>
        
        {/* Security Rules */}
        <div className={`p-4 rounded-md ${getStatusBg(rulesStatus.status)}`}>
          <h3 className={`text-lg font-semibold ${getStatusColor(rulesStatus.status)} flex items-center`}>
            {getStatusIcon(rulesStatus.status)} Security Rules
          </h3>
          <p className="mt-1 text-gray-700">{rulesStatus.message}</p>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
        <h3 className="font-bold mb-2">Firebase Security Rules Recommendations:</h3>
        <pre className="whitespace-pre-wrap text-xs">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Cars collection
    match /cars/{carId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.ownerId);
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}`}
        </pre>
      </div>
      
      <button
        onClick={checkFirebase}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
      >
        Recheck Firebase Configuration
      </button>
    </div>
  );
};

export default FirebaseConfigChecker;