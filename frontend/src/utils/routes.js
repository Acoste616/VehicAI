/**
 * Application Routes Configuration
 * Centralizes route paths to prevent hardcoding paths throughout the application
 */

const ROUTES = {
  // Public Routes
  HOME: '/',
  SEARCH: '/search',
  LISTING_DETAILS: '/listing/:id',
  LISTING_BY_ID: (id) => `/listing/${id}`,
  ADVISOR: '/advisor',
  
  // Auth Routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_EMAIL: '/verify-email',
  
  // Protected Routes
  ADD_CAR: '/add',
  EDIT_CAR: '/edit/:id',
  EDIT_CAR_BY_ID: (id) => `/edit/${id}`,
  PROFILE: '/profile',
  ADVISOR_PRO: '/advisor-pro',
  
  // Special Routes
  NOT_FOUND: '*'
};

export default ROUTES; 