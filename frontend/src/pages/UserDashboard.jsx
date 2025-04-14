import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const UserDashboard = () => {
  const { user } = useAuth();
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        if (!user) {
          setError('Musisz być zalogowany, aby zobaczyć swoje ogłoszenia');
          setLoading(false);
          return;
        }

        const response = await api.get(`/cars/user/${user.uid}`);
        setUserListings(response.data.data || []);
        setError(null);
      } catch (err) {
        console.error('Błąd podczas pobierania ogłoszeń:', err);
        setError(err.response?.data?.error || 'Nie udało się pobrać Twoich ogłoszeń');
      } finally {
        setLoading(false);
      }
    };

    fetchUserListings();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Panel użytkownika</h1>
      
      {/* Informacje o użytkowniku */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Twój profil</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Email:</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-gray-600">Status weryfikacji:</p>
            <p className={`font-medium ${user.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
              {user.emailVerified ? 'Zweryfikowany' : 'Niezweryfikowany'}
            </p>
          </div>
        </div>
      </div>

      {/* Lista ogłoszeń użytkownika */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Twoje ogłoszenia</h2>
        {userListings.length === 0 ? (
          <p className="text-gray-500">Nie masz jeszcze żadnych ogłoszeń</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userListings.map((listing) => (
              <div key={listing.id} className="border rounded-lg p-4">
                <img
                  src={listing.images?.[0] || '/placeholder-car.jpg'}
                  alt={`${listing.brand} ${listing.model}`}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold text-lg mb-2">
                  {listing.brand} {listing.model}
                </h3>
                <p className="text-gray-600 mb-2">{listing.year}</p>
                <p className="font-bold text-lg">{listing.price} PLN</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard; 