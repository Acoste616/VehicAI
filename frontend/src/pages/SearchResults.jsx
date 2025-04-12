// Plik: src/pages/SearchResults.jsx
// Strona wyników wyszukiwania ogłoszeń dla VehicAI

import React from 'react';
import CarList from '../components/CarList';

const SearchResults = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Ogłoszenia samochodowe</h1>
        <p className="text-gray-600">
          Przeglądaj dostępne oferty. W przyszłości będziesz mógł skorzystać z zaawansowanych filtrów.
        </p>
      </div>
      
      {/* Miejsce na przyszłe filtry */}
      <div className="hidden mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {/* Tutaj będą filtry wyszukiwania */}
        <p className="text-sm text-gray-500">Filtry wkrótce dostępne</p>
      </div>
      
      {/* Komponent wyświetlający listę ogłoszeń */}
      <CarList />
    </div>
  );
};

export default SearchResults;