import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// Komponent debugujący, który spróbuje pobrać dane i wyświetli informacje o błędach
const DebugFetchCars = () => {
  const [debugInfo, setDebugInfo] = useState({
    isLoading: true,
    error: null,
    cars: [],
    authState: null,
    collectionName: 'cars'
  });

  // Kolekcje do sprawdzenia
  const collectionsToCheck = ['cars', 'listings'];

  useEffect(() => {
    const checkAuth = () => {
      const user = auth.currentUser;
      setDebugInfo(prev => ({
        ...prev,
        authState: user ? {
          uid: user.uid,
          email: user.email,
          isAnonymous: user.isAnonymous,
          emailVerified: user.emailVerified
        } : 'Niezalogowany'
      }));

      return user;
    };

    const fetchCarsCollection = async (collectionName) => {
      try {
        console.log(`Próbuję pobrać dane z kolekcji ${collectionName}...`);
        
        // Sprawdź status uwierzytelnienia
        const user = checkAuth();
        if (!user) {
          console.log('Użytkownik niezalogowany, ale próbuję pobrać dane...');
        }

        // Tworzenie zapytania do Firestore
        const carsQuery = query(
          collection(db, collectionName),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        // Wykonanie zapytania
        const querySnapshot = await getDocs(carsQuery);
        
        // Przygotowanie danych
        const carsData = [];
        querySnapshot.forEach(doc => {
          carsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`Pobrano ${carsData.length} dokumentów z kolekcji ${collectionName}.`);
        
        setDebugInfo(prev => ({
          ...prev,
          isLoading: false,
          cars: carsData,
          collectionName
        }));

        return carsData;
      } catch (err) {
        console.error(`Błąd podczas pobierania z kolekcji ${collectionName}:`, err);
        
        setDebugInfo(prev => ({
          ...prev,
          isLoading: false,
          error: {
            message: err.message,
            code: err.code,
            name: err.name,
            stack: err.stack
          }
        }));

        return null;
      }
    };

    // Sprawdzamy obie możliwe nazwy kolekcji
    const checkCollections = async () => {
      for (const collectionName of collectionsToCheck) {
        const result = await fetchCarsCollection(collectionName);
        if (result && result.length > 0) {
          // Jeśli znaleźliśmy dane, nie sprawdzamy dalej
          break;
        }
      }
    };

    checkCollections();
  }, []);

  // Renderuje informacje o błędach i stanie
  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-8">
      <h2 className="text-xl font-semibold text-yellow-800 mb-3">🔍 Debug - Pobieranie Ogłoszeń</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-yellow-700">Status logowania:</h3>
          <pre className="bg-white p-2 rounded mt-1 text-sm overflow-auto">
            {JSON.stringify(debugInfo.authState, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-medium text-yellow-700">Status pobrania danych:</h3>
          <p>{debugInfo.isLoading ? 'Ładowanie...' : 'Zakończono'}</p>
        </div>
        
        {debugInfo.error && (
          <div>
            <h3 className="font-medium text-red-700">Błąd:</h3>
            <pre className="bg-white p-2 rounded mt-1 text-sm overflow-auto text-red-600">
              {JSON.stringify(debugInfo.error, null, 2)}
            </pre>
          </div>
        )}
        
        <div>
          <h3 className="font-medium text-yellow-700">Znalezione ogłoszenia ({debugInfo.cars.length}):</h3>
          {debugInfo.cars.length > 0 ? (
            <pre className="bg-white p-2 rounded mt-1 text-sm overflow-auto h-60">
              {JSON.stringify(debugInfo.cars.slice(0, 3), null, 2)}
              {debugInfo.cars.length > 3 && '...'}
            </pre>
          ) : (
            <p className="italic text-yellow-600">Brak ogłoszeń w kolekcji {debugInfo.collectionName}</p>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-yellow-200">
        <p className="text-sm text-yellow-700">
          <strong>Wskazówki:</strong>
        </p>
        <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
          <li>Sprawdź, czy jesteś zalogowany</li>
          <li>Sprawdź, czy kolekcja ma właściwą nazwę (cars lub listings)</li>
          <li>Sprawdź reguły bezpieczeństwa Firestore</li>
          <li>Sprawdź, czy istnieją dokumenty w kolekcji</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugFetchCars;