import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loading Spinner Component
 * Displays a spinner for loading states
 * 
 * @param {Object} props - Component props
 * @param {string} [props.size='md'] - Size of the spinner (sm, md, lg)
 * @param {string} [props.color='blue'] - Color of the spinner (blue, gray, green, red)
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {number} [props.minHeight=400] - Minimum height of the container in pixels
 * @param {boolean} [props.fullScreen=false] - Whether the spinner should take the full screen
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue',
  className = '',
  minHeight = 400,
  fullScreen = false
}) => {
  // Set spinner size
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-t-2 border-b-2',
    lg: 'h-16 w-16 border-4'
  };

  // Set spinner color
  const colorClasses = {
    blue: 'border-blue-500',
    gray: 'border-gray-500',
    green: 'border-green-500',
    red: 'border-red-500'
  };

  // Container classes
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50' 
    : `flex justify-center items-center min-h-[${minHeight}px]`;

  return (
    <div className={`${containerClasses} ${className}`}>
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
        aria-label="Loading"
        role="status"
      />
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['blue', 'gray', 'green', 'red']),
  className: PropTypes.string,
  minHeight: PropTypes.number,
  fullScreen: PropTypes.bool
};

export default LoadingSpinner; 