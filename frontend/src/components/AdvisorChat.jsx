import React, { useState, useRef, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase/config';
import CarCard from './CarCard';
import { extractKeywords } from '../utils/aiScoring';
import { scoreCarListing } from '../utils/aiMatchScoring';

const AdvisorChat = () => {
  const [userQuery, setUserQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  
  const exampleQueries = [
    'Szukam SUVa do 50 tys. zł',
    'Audi A4 kombi z automatem, do 100 tys km',
    'Rodzinne auto z małym przebiegiem',
    'Oszczędne miejskie auto dla studenta'
  ];

  // Funkcja do przeprowadzania wyszukiwania
  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!userQuery.trim()) {
      setError('Wprowadź zapytanie, aby rozpocząć wyszukiwanie');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Ekstrakcja słów kluczowych z zapytania użytkownika
      const keywords = extractKeywords(userQuery);
      console.log('Wyekstrahowane słowa kluczowe:', keywords);
      
      // Tworzenie zapytania do Firestore na podstawie słów kluczowych
      let carsQuery = collection(db, 'cars');
      let queryConstraints = [];
      
      // Dodawanie filtrów na podstawie słów kluczowych
      if (keywords.brands && keywords.brands.length > 0) {
        queryConstraints.push(where('brand', 'in', keywords.brands));
      }
      
      if (keywords.bodyTypes && keywords.bodyTypes.length > 0) {
        queryConstraints.push(where('bodyType', 'in', keywords.bodyTypes));
      }
      
      if (keywords.fuelTypes && keywords.fuelTypes.length > 0) {
        queryConstraints.push(where('fuelType', 'in', keywords.fuelTypes));
      }
      
      if (keywords.transmission) {
        queryConstraints.push(where('transmission', '==', keywords.transmission));
      }
      
      if (keywords.minYear) {
        queryConstraints.push(where('year', '>=', keywords.minYear));
      }
      
      if (keywords.maxYear) {
        queryConstraints.push(where('year', '<=', keywords.maxYear));
      }
      
      if (keywords.minPrice) {
        queryConstraints.push(where('price', '>=', keywords.minPrice));
      }
      
      if (keywords.maxPrice) {
        queryConstraints.push(where('price', '<=', keywords.maxPrice));
      }
      
      if (keywords.minMileage) {
        queryConstraints.push(where('mileage', '>=', keywords.minMileage));
      }
      
      if (keywords.maxMileage) {
        queryConstraints.push(where('mileage', '<=', keywords.maxMileage));
      }
      
      if (keywords.color) {
        queryConstraints.push(where('color', '==', keywords.color));
      }
      
      // Jeśli nie ma żadnych filtrów, pobieramy najnowsze samochody
      if (queryConstraints.length === 0) {
        queryConstraints.push(orderBy('createdAt', 'desc'));
      }
      
      // Dodajemy limit wyników
      queryConstraints.push(limit(10));
      
      // Wykonanie zapytania
      const querySnapshot = await getDocs(query(carsQuery, ...queryConstraints));
      
      // Przetwarzanie wyników
      const cars = [];
      querySnapshot.forEach((doc) => {
        const carData = { id: doc.id, ...doc.data() };
        // Obliczanie wyniku dopasowania dla każdego ogłoszenia
        carData.score = scoreCarListing(carData, keywords);
        cars.push(carData);
      });
      
      // Sortowanie wyników malejąco według wyniku dopasowania
      cars.sort((a, b) => b.score - a.score);
      
      setSearchResults(cars);
      setHasSearched(true);
    } catch (error) {
      console.error('Błąd podczas wyszukiwania:', error);
      setError('Wystąpił błąd podczas wyszukiwania. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcja do ustawiania przykładowego zapytania
  const setExampleQuery = (query) => {
    setUserQuery(query);
    // Automatyczne wyszukiwanie po kliknięciu w przykład
    setTimeout(() => {
      handleSearch({ preventDefault: () => {} });
    }, 100);
  };

  // Fokus na polu wejściowym przy załadowaniu komponentu
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Doradca VehicAI</h1>
      <p className="text-gray-600 mb-6">
        Zadaj pytanie w języku naturalnym, a AI pomoże znaleźć odpowiedni samochód.
      </p>
      
      {/* Formularz wyszukiwania */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col md:flex-row gap-2">
          <input
            ref={inputRef}
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Np. Szukam ekonomicznego SUVa do 60 tys. zł z małym przebiegiem..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`p-3 rounded-lg text-white font-medium ${
              isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } transition duration-300`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Szukam...
              </span>
            ) : (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Szukaj
              </span>
            )}
          </button>
        </div>
      </form>
      
      {/* Przykładowe zapytania */}
      {!hasSearched && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Przykładowe zapytania:</h2>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => setExampleQuery(query)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-full text-sm transition duration-300"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Sekcja pomocy */}
      {!hasSearched && (
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">Jak korzystać z doradcy AI?</h2>
          <ul className="list-disc pl-5 space-y-2 text-blue-700">
            <li>Opisz jakiego samochodu szukasz używając codziennego języka</li>
            <li>Możesz określić markę, model, typ nadwozia, rocznik, cenę, przebieg</li>
            <li>Poinformuj o swoich priorytetach (np. "najważniejszy niski przebieg")</li>
            <li>Opisz cel zakupu (np. "samochód dla rodziny", "auto dla młodego kierowcy")</li>
            <li>Im więcej szczegółów podasz, tym lepsze będą wyniki wyszukiwania</li>
          </ul>
        </div>
      )}
      
      {/* Komunikat o błędzie */}
      {error && (
        <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-6">
          {error}
        </div>
      )}
      
      {/* Wyniki wyszukiwania */}
      {hasSearched && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            {searchResults.length > 0
              ? `Znaleziono ${searchResults.length} pojazdów`
              : 'Brak wyników dla podanych kryteriów'}
          </h2>
          
          {searchResults.length === 0 && (
            <div className="bg-yellow-50 p-6 rounded-lg mb-6">
              <p className="text-yellow-700 mb-3">
                Nie znaleziono samochodów spełniających wszystkie kryteria. Spróbuj:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                <li>Użyć mniej szczegółowych kryteriów</li>
                <li>Sprawdzić pisownię marek i modeli</li>
                <li>Rozszerzyć zakres cenowy lub rocznik</li>
              </ul>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {searchResults.map((car) => (
              <CarCard key={car.id} listing={car} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorChat;