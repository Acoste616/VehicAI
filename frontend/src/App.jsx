// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Suspense, lazy, memo } from 'react';
import ROUTES from './utils/routes';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load page components for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const ListingDetails = lazy(() => import('./pages/ListingDetails'));
const AdvisorPage = lazy(() => import('./pages/AdvisorPage'));
const AdvisorPro = lazy(() => import('./pages/AdvisorPro'));
const AddCarForm = lazy(() => import('./components/AddCarForm'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const LoginForm = lazy(() => import('./components/auth/LoginForm'));
const RegisterForm = lazy(() => import('./components/auth/RegisterForm'));
const ForgotPasswordForm = lazy(() => import('./components/auth/ForgotPasswordForm'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Memoized layout components to prevent unnecessary re-renders
const MemoizedNavbar = memo(Navbar);
const MemoizedFooter = memo(Footer);

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <div className="flex flex-col min-h-screen">
          <MemoizedNavbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path={ROUTES.HOME} element={<HomePage />} />
                <Route path={ROUTES.SEARCH} element={<SearchResults />} />
                <Route path={ROUTES.LISTING_DETAILS} element={<ListingDetails />} />
                <Route path={ROUTES.ADVISOR} element={<AdvisorPage />} />
                
                {/* Auth Routes */}
                <Route path={ROUTES.LOGIN} element={<LoginForm />} />
                <Route path={ROUTES.REGISTER} element={<RegisterForm />} />
                <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordForm />} />
                <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
                
                {/* Protected Routes */}
                <Route 
                  path={ROUTES.ADD_CAR} 
                  element={
                    <ProtectedRoute>
                      <AddCarForm />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path={ROUTES.EDIT_CAR} 
                  element={
                    <ProtectedRoute>
                      <AddCarForm isEditing={true} />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path={ROUTES.PROFILE} 
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path={ROUTES.ADVISOR_PRO} 
                  element={
                    <ProtectedRoute>
                      <AdvisorPro />
                    </ProtectedRoute>
                  } 
                />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <MemoizedFooter />
        </div>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;