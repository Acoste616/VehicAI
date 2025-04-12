// Plik: src/pages/HomePage.jsx
// Strona główna aplikacji VehicAI

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../utils/firebase/config'

// Komponent pojedynczego ogłoszenia (miniatura)
const CarListingItem = ({ listing }) => {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="relative h-48 mb-4 bg-gray-200 rounded-md overflow-hidden">
        {listing.mainImageUrl ? (
          <img 
            src={listing.mainImageUrl} 
            alt={`${listing.brand} ${listing.model}`} 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Brak zdjęcia
          </div>
        )}
      </div>
      <h3 className="font-bold text-lg mb-1">{listing.brand} {listing.model}</h3>
      <p className="text-gray-600 mb-2">{listing.year} • {listing.mileage} km</p>
      <div className="flex justify-between items-center">
        <span className="font-bold text-xl">{new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(listing.price)}</span>
        <Link to={`/listing/${listing.id}`} className="btn btn-primary">
          Zobacz
        </Link>
      </div>
    </div>
  )
}

// Komponent strony głównej
const HomePage = () => {
  const [featuredListings, setFeaturedListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pobieranie przykładowych ogłoszeń przy ładowaniu strony
  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        setLoading(true)
        // Zapytanie do Firestore o najnowsze ogłoszenia (max 6)
        const q = query(
          collection(db, 'listings'),
          orderBy('createdAt', 'desc'),
          limit(6)
        )
        
        const querySnapshot = await getDocs(q)
        const listings = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setFeaturedListings(listings)
        setLoading(false)
      } catch (err) {
        console.error('Błąd podczas pobierania ogłoszeń:', err)
        setError('Nie udało się pobrać ogłoszeń. Spróbuj ponownie później.')
        setLoading(false)
      }
    }

    fetchFeaturedListings()
  }, [])

  return (
    <div>
      {/* Hero section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-16 px-4 rounded-lg mb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Znajdź swój wymarzony samochód z pomocą AI
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            VehicAI to inteligentna platforma ogłoszeń motoryzacyjnych, która pomoże Ci znaleźć idealny pojazd lub sprzedać obecny.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/search" className="btn bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 text-lg font-bold rounded-md">
              Szukaj samochodów
            </Link>
            <Link to="/add" className="btn bg-primary-600 text-white hover:bg-primary-500 px-8 py-3 text-lg font-bold rounded-md">
              Dodaj ogłoszenie
            </Link>
            <Link to="/advisor" className="btn bg-green-600 text-white hover:bg-green-500 px-8 py-3 text-lg font-bold rounded-md flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              Porozmawiaj z doradcą AI
            </Link>
          </div>
        </div>
      </section>

      {/* Najnowsze ogłoszenia */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Najnowsze ogłoszenia</h2>
          <Link to="/search" className="text-primary-600 hover:text-primary-800 font-medium">
            Zobacz wszystkie
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Błąd! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : featuredListings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-medium text-gray-600 mb-4">Brak ogłoszeń</h3>
            <p className="text-gray-500 mb-6">Bądź pierwszy i dodaj swoje ogłoszenie już teraz!</p>
            <Link to="/add" className="btn btn-primary">
              Dodaj ogłoszenie
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <CarListingItem key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Dlaczego warto korzystać z VehicAI */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-8 text-center">Dlaczego warto korzystać z VehicAI?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Bezpieczeństwo</h3>
            <p className="text-gray-600">
              Weryfikujemy wszystkie ogłoszenia i sprzedających, aby zapewnić najwyższy poziom bezpieczeństwa.
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Szybkość</h3>
            <p className="text-gray-600">
              Sztuczna inteligencja pomaga błyskawicznie znaleźć idealny samochód dopasowany do Twoich potrzeb.
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Oszczędność</h3>
            <p className="text-gray-600">
              Dzięki zaawansowanej analizie cenowej masz pewność, że kupujesz w najlepszej cenie na rynku.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-primary-50 border border-primary-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-primary-800 mb-4">
          Gotowy sprzedać swój samochód?
        </h2>
        <p className="text-lg text-primary-700 mb-6 max-w-2xl mx-auto">
          Dodaj ogłoszenie już teraz i skorzystaj z pomocy naszej sztucznej inteligencji, która pomoże Ci optymalnie wycenić pojazd i przyciągnąć potencjalnych kupujących.
        </p>
        <Link to="/add" className="btn btn-primary text-lg px-8 py-3">
          Dodaj ogłoszenie za darmo
        </Link>
      </section>
    </div>
  )
}

export default HomePage