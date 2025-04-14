import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyEmailPage = () => {
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser, verifyEmail, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract actionCode from URL if present
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const actionCode = queryParams.get('oobCode');
    
    const verifyUserEmail = async () => {
      if (!actionCode) {
        setError('Brak kodu weryfikacyjnego. Sprawdź swój link weryfikacyjny.');
        setLoading(false);
        return;
      }

      try {
        await verifyEmail(actionCode);
        setVerified(true);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Wystąpił błąd podczas weryfikacji adresu email.');
        setLoading(false);
      }
    };

    verifyUserEmail();
  }, [location.search, verifyEmail]);

  const handleRedirectToLogin = () => {
    navigate('/login');
  };

  const handleRedirectToHome = () => {
    navigate('/');
  };

  const handleResendVerificationEmail = async () => {
    try {
      if (currentUser) {
        await currentUser.sendEmailVerification();
        setError('');
        alert('Email weryfikacyjny został wysłany ponownie. Sprawdź swoją skrzynkę.');
      } else {
        throw new Error('Nie jesteś zalogowany.');
      }
    } catch (err) {
      setError(err.message || 'Nie można wysłać emaila weryfikacyjnego.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Wystąpił błąd podczas wylogowywania.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-solid rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        {verified ? (
          <>
            <div className="text-center">
              <svg 
                className="mx-auto h-16 w-16 text-green-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Email zweryfikowany!
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Twój adres email został pomyślnie zweryfikowany. Możesz teraz korzystać z pełnej funkcjonalności aplikacji.
              </p>
            </div>
            <div className="flex flex-col space-y-4">
              <button
                onClick={handleRedirectToHome}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Przejdź do strony głównej
              </button>
              <button
                onClick={handleRedirectToLogin}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Przejdź do logowania
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <svg 
                className="mx-auto h-16 w-16 text-red-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Weryfikacja nie powiodła się
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {error || 'Link weryfikacyjny jest nieprawidłowy lub wygasł.'}
              </p>
            </div>
            <div className="flex flex-col space-y-4">
              {currentUser && (
                <button
                  onClick={handleResendVerificationEmail}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Wyślij ponownie email weryfikacyjny
                </button>
              )}
              <button
                onClick={handleRedirectToLogin}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Przejdź do logowania
              </button>
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Wyloguj się
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage; 