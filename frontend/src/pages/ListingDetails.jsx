// Plik: src/pages/ListingDetails.jsx
// Strona szczegółów ogłoszenia samochodowego dla aplikacji VehicAI

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../utils/firebase/config';
import AITips from '../components/AITips';

const ListingDetails = () => {
  // Pobierz ID ogłoszenia z parametru URL
  const { id } = useParams();
  
  // Stany komponentu
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [contactExpanded, setContactExpanded] = useState(false);

  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        setLoading(true);
        
        // Pobierz dokument ogłoszenia z Firestore
        const listingRef = doc(db, 'listings', id);
        const listingDoc = await getDoc(listingRef);
        
        // Sprawdź czy ogłoszenie istnieje
        if (!listingDoc.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        
        // Pobierz dane ogłoszenia
        const listingData = { id: listingDoc.id, ...listingDoc.data() };
        setListing(listingData);
        
        // Zwiększ licznik wyświetleń
        await updateDoc(listingRef, {
          views: increment(1)
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Błąd podczas pobierania szczegółów ogłoszenia:', err);
        setError('Nie udało się pobrać szczegółów ogłoszenia. Spróbuj ponownie później.');
        setLoading(false);
      }
    };

    fetchListingDetails();
  }, [id]);

  // Funkcja do obsługi przycisku kontaktu
  const handleContactClick = () => {
    setContactExpanded(!contactExpanded);
  };

  // Renderowanie stanu ładowania
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Renderowanie stanu błędu
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Wystąpił błąd</h2>
          <p>{error}</p>
          <Link to="/search" className="inline-block mt-4 text-red-700 font-medium hover:underline">
            Wróć do wyszukiwania
          </Link>
        </div>
      </div>
    );
  }

  // Renderowanie gdy nie znaleziono ogłoszenia
  if (notFound) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Ogłoszenie nie znalezione</h2>
          <p>Niestety, nie znaleźliśmy ogłoszenia o podanym identyfikatorze.</p>
          <Link to="/search" className="inline-block mt-4 text-yellow-700 font-medium hover:underline">
            Przejdź do wyszukiwania
          </Link>
        </div>
      </div>
    );
  }

  // Formatowanie ceny
  const formattedPrice = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(listing.price);

  // Formatowanie daty dodania ogłoszenia
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Nie podano';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Domyślny obrazek, gdy brak zdjęcia głównego
  const defaultImage = 'https://via.placeholder.com/800x500?text=Brak+zdjęcia';

  // Ocena wizualna jako tekst
  const getVisualConditionText = (condition) => {
    switch (parseInt(condition)) {
      case 1: return 'Bardzo słaby';
      case 2: return 'Słaby';
      case 3: return 'Średni';
      case 4: return 'Dobry';
      case 5: return 'Bardzo dobry';
      default: return 'Brak oceny';
    }
  };

  // Sprawdzenie, czy przegląd jest aktualny
  const isInspectionValid = () => {
    if (!listing.inspectionValidUntil) return false;
    const inspectionDate = listing.inspectionValidUntil.toDate ? 
      listing.inspectionValidUntil.toDate() : new Date(listing.inspectionValidUntil);
    return inspectionDate > new Date();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Nawigacja ścieżkowa */}
      <div className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-blue-600">Strona główna</Link>
        {' > '}
        <Link to="/search" className="hover:text-blue-600">Ogłoszenia</Link>
        {' > '}
        <span className="text-gray-700">
          {listing.brand} {listing.model}
        </span>
      </div>

      {/* Nagłówek ogłoszenia */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {listing.brand} {listing.model} ({listing.year})
        </h1>
        <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
          <span>ID: {id}</span>
          <span>•</span>
          <span>Dodano: {formatDate(listing.createdAt)}</span>
          <span>•</span>
          <span>Wyświetleń: {listing.views || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolumna lewa - zdjęcie i dane pojazdu */}
        <div className="lg:col-span-2">
          {/* Główne zdjęcie */}
          <div className="bg-gray-100 rounded-lg overflow-hidden mb-6">
            <img
              src={listing.mainImageUrl || defaultImage}
              alt={`${listing.brand} ${listing.model}`}
              className="w-full h-auto object-cover"
              onError={(e) => {
                e.target.src = defaultImage;
              }}
            />
          </div>

          {/* Galeria zdjęć (miniaturki) */}
          {listing.imageUrls && listing.imageUrls.length > 1 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Galeria zdjęć</h2>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {listing.imageUrls.map((url, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg overflow-hidden h-20 cursor-pointer border-2 ${
                      url === listing.mainImageUrl ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${listing.brand} ${listing.model} - zdjęcie ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = defaultImage;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dane techniczne */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Dane pojazdu</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Marka</p>
                <p className="font-medium">{listing.brand}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-medium">{listing.model}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Rok produkcji</p>
                <p className="font-medium">{listing.year}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Przebieg</p>
                <p className="font-medium">{listing.mileage ? `${listing.mileage.toLocaleString()} km` : 'Nie podano'}</p>
              </div>
              
              {listing.fuelType && (
                <div>
                  <p className="text-sm text-gray-500">Rodzaj paliwa</p>
                  <p className="font-medium">{listing.fuelType}</p>
                </div>
              )}
              
              {listing.transmission && (
                <div>
                  <p className="text-sm text-gray-500">Skrzynia biegów</p>
                  <p className="font-medium">{listing.transmission}</p>
                </div>
              )}
              
              {listing.engineCapacity && (
                <div>
                  <p className="text-sm text-gray-500">Pojemność silnika</p>
                  <p className="font-medium">{listing.engineCapacity} cm³</p>
                </div>
              )}
              
              {listing.power && (
                <div>
                  <p className="text-sm text-gray-500">Moc</p>
                  <p className="font-medium">{listing.power} KM</p>
                </div>
              )}
              
              {listing.visualCondition && (
                <div>
                  <p className="text-sm text-gray-500">Stan wizualny</p>
                  <p className="font-medium">
                    {getVisualConditionText(listing.visualCondition)}
                    <span className="inline-block ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {listing.visualCondition}/5
                    </span>
                  </p>
                </div>
              )}
              
              {listing.inspectionValidUntil && (
                <div>
                  <p className="text-sm text-gray-500">Ważność przeglądu</p>
                  <p className={`font-medium ${isInspectionValid() ? 'text-green-600' : 'text-red-600'}`}>
                    {formatDate(listing.inspectionValidUntil)}
                    {!isInspectionValid() && ' (nieaktualny)'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Opis pojazdu */}
          {listing.description && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Opis</h2>
              <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
            </div>
          )}
          
          {/* Komponent AITips */}
          <AITips 
            year={listing.year}
            mileage={listing.mileage}
            visualCondition={listing.visualCondition}
            warranty={listing.warranty}
            inspectionValidUntil={listing.inspectionValidUntil}
          />
          
          {/* Wyposażenie */}
          {listing.features && listing.features.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Wyposażenie</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {listing.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kolumna prawa - cena, ocena AI, kontakt */}
        <div className="lg:col-span-1">
          {/* Cena i kontakt */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-4">
            <div className="mb-6">
              <p className="text-sm text-gray-500">Cena</p>
              <p className="text-3xl font-bold text-blue-600">{formattedPrice}</p>
            </div>
            
            <button 
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors mb-4"
              onClick={handleContactClick}
            >
              Kontakt ze sprzedającym
            </button>
            
            {contactExpanded && (
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <h3 className="font-semibold mb-2">Dane kontaktowe:</h3>
                <p className="mb-1">
                  <span className="font-medium">Telefon:</span> {listing.sellerPhone || '+48 XXX XXX XXX'}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {listing.sellerEmail || 'kontakt@przyklad.pl'}
                </p>
              </div>
            )}
            
            <button 
              className="w-full bg-white text-blue-600 border border-blue-600 py-3 px-4 rounded-md font-medium hover:bg-blue-50 transition-colors mb-6"
            >
              Zapisz ogłoszenie
            </button>
            
            {/* Znaczki informacyjne */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold mb-3 text-gray-700">Informacje dodatkowe:</h3>
              <div className="space-y-2">
                {listing.warranty && (
                  <div className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Gwarancja dealera do {listing.warrantyUntil ? formatDate(listing.warrantyUntil) : 'nie podano'}</span>
                  </div>
                )}
                
                {listing.extraTires && (
                  <div className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Dodatkowy komplet opon</span>
                  </div>
                )}
                
                {listing.serviceHistory && (
                  <div className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Pełna historia serwisowa</span>
                  </div>
                )}
                
                {isInspectionValid() && (
                  <div className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Aktualny przegląd techniczny</span>
                  </div>
                )}
                
                {listing.firstOwner && (
                  <div className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Pierwszy właściciel</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statystyki ogłoszenia */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-semibold mb-3 text-gray-700">Statystyki ogłoszenia</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Data dodania</span>
                <span>{formatDate(listing.createdAt)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Wyświetlenia</span>
                <span>{listing.views || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">ID ogłoszenia</span>
                <span className="text-gray-500">{id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Podobne oferty */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Podobne oferty</h2>
        <p className="text-gray-600 text-center py-8">
          Ta funkcja będzie dostępna wkrótce.
        </p>
      </div>
    </div>
  );
};

export default ListingDetails;