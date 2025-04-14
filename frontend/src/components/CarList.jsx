// Plik: src/components/CarList.jsx
// Komponent listy ogłoszeń samochodowych dla VehicAI, pobierający dane z Firestore

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from "../utils/firebase/config";
import { useAuth } from '../context/AuthContext';
import CarCard from './CarCard';

const CarList = () => {
  const { user } = useAuth();
  // Stany komponentu
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pobieranie danych z Firestore przy montowaniu komponentu
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        
        // Tworzenie zapytania do Firestore
        // Pobiera max 12 ogłoszeń, sortuje po dacie utworzenia malejąco
        const listingsQuery = query(
          collection(db, 'listings'),
          orderBy('createdAt', 'desc'),
          limit(12)
        );
        
        // Wykonanie zapytania
        const querySnapshot = await getDocs(listingsQuery);
        
        // Przetwarzanie danych z zapytania
        const listingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setListings(listingsData);
        setLoading(false);
      } catch (err) {
        console.error('Błąd podczas pobierania ogłoszeń:', err);
        setError('Nie udało się pobrać ogłoszeń. Spróbuj odświeżyć stronę.');
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Renderowanie stanu ładowania
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Renderowanie stanu błędu
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="font-medium">Wystąpił błąd</p>
        <p>{error}</p>
      </div>
    );
  }

  // Renderowanie pustej listy
  if (listings.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Brak ogłoszeń</h3>
        <p className="text-gray-500">
          Aktualnie nie ma żadnych ogłoszeń. Bądź pierwszy i dodaj swoje auto!
        </p>
      </div>
    );
  }

  // Renderowanie listy ogłoszeń
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map(listing => (
        <CarCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
};

export default CarList;