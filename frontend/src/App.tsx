import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load components for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CarDetailPage = lazy(() => import('./pages/CarDetailPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const AddCarForm = lazy(() => import('./components/AddCarForm'));
const EditCarForm = lazy(() => import('./components/EditCarForm'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow bg-gray-50">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/cars/:id" element={<CarDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/add-car" 
                  element={
                    <ProtectedRoute>
                      <AddCarForm />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/edit-car/:id" 
                  element={
                    <ProtectedRoute>
                      <EditCarForm />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Redirects */}
                <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;