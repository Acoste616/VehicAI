// Plik: src/pages/AdvisorPage.jsx
// Strona doradcy AI dla aplikacji VehicAI

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase/config';
import CarCard from '../components/CarCard';

const AdvisorPage = () => {
  const [userQuery, setUserQuery] = useState('');
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  // Funkcja analizująca zapytanie użytkownika
  const analyzeQuery = async (queryText) => {
    setLoading(true);
    setSearched(true);
    setError(null);

    try {
      // Analizujemy zapytanie użytkownika (proste parsowanie tekstu)
      const keywords = extractKeywords(queryText);
      console.log('Wykryte słowa kluczowe:', keywords);

      // Budowanie zapytania do Firestore
      let carsQuery = collection(db, 'listings');
      
      // Przekształć zapytanie w tablicę warunków filtrowania
      const filters = buildFilters(keywords);
      
      // Utwórz zapytanie z wszystkimi filtrami
      if (filters.length > 0) {
        carsQuery = query(
          carsQuery,
          ...filters,
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      } else {
        carsQuery = query(
          carsQuery,
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      }

      // Wykonaj zapytanie
      const querySnapshot = await getDocs(carsQuery);
      
      // Przetwarzanie wyników
      const cars = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFilteredCars(cars);
      setLoading(false);
    } catch (err) {
      console.error('Błąd podczas wyszukiwania aut:', err);
      setError('Wystąpił problem podczas wyszukiwania. Spróbuj ponownie.');
      setLoading(false);
    }
  };

  // Funkcja do ekstrakcji słów kluczowych z zapytania
  const extractKeywords = (text) => {
    const keywords = {
      brand: null,
      bodyType: null,
      maxPrice: null, 
      minPrice: null,
      transmission: null,
      fuel: null,
      maxMileage: null,
      minYear: null
    };
    
    // Przetwarzanie tekstu na małe litery
    const lowerText = text.toLowerCase();
    
    // Wykrywanie marki
    const brands = ['audi', 'bmw', 'ford', 'honda', 'hyundai', 'kia', 'mazda', 'mercedes', 'opel', 'peugeot', 'renault', 'skoda', 'toyota', 'volkswagen', 'volvo'];
    for (const brand of brands) {
      if (lowerText.includes(brand)) {
        keywords.brand = brand.charAt(0).toUpperCase() + brand.slice(1); // Pierwsza litera wielka
        break;
      }
    }

    // Wykrywanie typu nadwozia
    const bodyTypes = {
      'suv': 'SUV',
      'sedan': 'Sedan',
      'kombi': 'Kombi',
      'hatchback': 'Hatchback',
      'kabriolet': 'Kabriolet',
      'coupe': 'Coupe'
    };
    
    for (const [key, value] of Object.entries(bodyTypes)) {
      if (lowerText.includes(key)) {
        keywords.bodyType = value;
        break;
      }
    }

    // Wykrywanie maksymalnej ceny
    const priceRegex = /do (\d+)( *)(tys|tyś|tysięcy|k|000)/i;
    const priceMatch = lowerText.match(priceRegex);
    if (priceMatch) {
      keywords.maxPrice = parseInt(priceMatch[1]) * 1000;
    }

    // Wykrywanie minimalnej ceny
    const minPriceRegex = /od (\d+)( *)(tys|tyś|tysięcy|k|000)/i;
    const minPriceMatch = lowerText.match(minPriceRegex);
    if (minPriceMatch) {
      keywords.minPrice = parseInt(minPriceMatch[1]) * 1000;
    }

    // Wykrywanie typu skrzyni biegów
    if (lowerText.includes('automat') || lowerText.includes('automatyczna')) {
      keywords.transmission = 'Automatyczna';
    } else if (lowerText.includes('manual') || lowerText.includes('manualna')) {
      keywords.transmission = 'Manualna';
    }

    // Wykrywanie rodzaju paliwa
    if (lowerText.includes('benzyn')) {
      keywords.fuel = 'Benzyna';
    } else if (lowerText.includes('diesel') || lowerText.includes('olej napędowy')) {
      keywords.fuel = 'Diesel';
    } else if (lowerText.includes('elektryk') || lowerText.includes('elektryczn')) {
      keywords.fuel = 'Elektryczny';
    } else if (lowerText.includes('hybrid')) {
      keywords.fuel = 'Hybryda';
    } else if (lowerText.includes('lpg') || lowerText.includes('gaz')) {
      keywords.fuel = 'LPG';
    }

    // Wykrywanie maksymalnego przebiegu
    const mileageRegex = /do (\d+)( *)(tys|tyś|tysięcy|k|000)( *)km/i;
    const mileageMatch = lowerText.match(mileageRegex);
    if (mileageMatch) {
      keywords.maxMileage = parseInt(mileageMatch[1]) * 1000;
    }

    // Wykrywanie minimalnego roku produkcji
    const yearRegex = /od (\d{4})|(\d{4}) roku/i;
    const yearMatch = lowerText.match(yearRegex);
    if (yearMatch) {
      keywords.minYear = parseInt(yearMatch[1] || yearMatch[2]);
    }

    return keywords;
  };

  // Funkcja budująca filtry dla Firestore na podstawie słów kluczowych
  const buildFilters = (keywords) => {
    const filters = [];

    if (keywords.brand) {
      filters.push(where('brand', '==', keywords.brand));
    }

    if (keywords.bodyType) {
      filters.push(where('bodyType', '==', keywords.bodyType));
    }

    if (keywords.maxPrice) {
      filters.push(where('price', '<=', keywords.maxPrice));
    }

    if (keywords.minPrice) {
      filters.push(where('price', '>=', keywords.minPrice));
    }

    if (keywords.transmission) {
      filters.push(where('transmission', '==', keywords.transmission));
    }

    if (keywords.fuel) {
      filters.push(where('fuelType', '==', keywords.fuel));
    }

    if (keywords.maxMileage) {
      filters.push(where('mileage', '<=', keywords.maxMileage));
    }

    if (keywords.minYear) {
      filters.push(where('year', '>=', keywords.minYear));
    }

    return filters;
  };

  // Obsługa formularza
  const handleSubmit = (e) => {
    e.preventDefault();
    if (userQuery.trim() !== '') {
      analyzeQuery(userQuery);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto py-12">
        {/* Nagłówek */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Doradca AI
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Zadawaj pytania i znajdź idealne auto z pomocą sztucznej inteligencji.
          </p>
        </div>

        {/* Chat input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="userQuery" className="block text-sm font-medium text-gray-700 mb-2">
                Opisz, jakiego auta szukasz:
              </label>
              <textarea
                id="userQuery"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Np. Szukam SUV-a do 70 tys. z automatem i silnikiem benzynowym..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Szukam...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Znajdź auta
                </>
              )}
            </button>
          </form>
        </div>

        {/* Przykładowe zapytania */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">Przykładowe zapytania:</p>
          <div className="flex flex-wrap gap-2">
            <button 
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded-full"
              onClick={() => setUserQuery("Szukam SUV-a do 70 tys. z automatem")}
            >
              SUV do 70 tys. z automatem
            </button>
            <button 
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded-full"
              onClick={() => setUserQuery("Toyota z małym przebiegiem od 2018 roku")}
            >
              Toyota od 2018 roku
            </button>
            <button 
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded-full"
              onClick={() => setUserQuery("Kombi z dieslem do 100 tys. zł")}
            >
              Kombi z dieslem do 100 tys.
            </button>
          </div>
        </div>

        {/* Wyniki wyszukiwania */}
        {searched && (
          <div className="mt-8">
            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p>{error}</p>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
                <p className="font-medium">Brak pasujących aut. Zmień zapytanie.</p>
                <p className="text-sm mt-1">Spróbuj bardziej ogólne zapytanie lub zmień kryteria wyszukiwania.</p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-4">Znalezione pojazdy ({filteredCars.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredCars.map(car => (
                    <CarCard key={car.id} listing={car} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dodatkowa informacja */}
        {!searched && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Jak korzystać z doradcy VehicAI?</h2>
            <ul className="space-y-3 text-blue-700">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Opisz samochód, jakiego szukasz naturalnym językiem</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Możesz podać cechy jak: marka, cena, rodzaj nadwozia, skrzynia biegów, rodzaj paliwa</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>System automatycznie przeanalizuje Twoje zapytanie i znajdzie pasujące oferty</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvisorPage;