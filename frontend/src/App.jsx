// Plik: src/App.jsx
// Główny komponent aplikacji z routingiem


import { Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AddCarForm from './components/AddCarForm'
import SearchResults from './pages/SearchResults';
import ListingDetails from './pages/ListingDetails';
import AdvisorPage from './pages/AdvisorPage';
import AdvisorPro from './pages/AdvisorPro';

// Import komponentów stron (można dodać więcej w miarę rozwoju projektu)
import HomePage from './pages/HomePage'

// Komponent nawigacji głównej
const Navbar = () => {
  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary-600">
          VehicAI
        </Link>
        <div className="flex space-x-4">
          <Link to="/" className="text-gray-600 hover:text-primary-600">
            Strona główna
          </Link>
          <Link to="/add" className="text-gray-600 hover:text-primary-600">
            Dodaj ogłoszenie
          </Link>
          {/* Tutaj można dodać więcej linków do menu */}
        </div>
      </div>
    </nav>
  )
}

// Komponent stopki
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">VehicAI</h3>
            <p className="text-gray-300">
              Nowoczesna platforma ogłoszeń samochodowych wspierana przez sztuczną inteligencję.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Kontakt</h3>
            <p className="text-gray-300">
              Email: kontakt@vehicai.pl<br />
              Telefon: +48 123 456 789
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Przydatne linki</h3>
            <ul className="text-gray-300">
              <li><Link to="/" className="hover:text-primary-300">Strona główna</Link></li>
              <li><Link to="/add" className="hover:text-primary-300">Dodaj ogłoszenie</Link></li>
              <li><Link to="/about" className="hover:text-primary-300">O nas</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>© {new Date().getFullYear()} VehicAI. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  )
}

// Główny komponent aplikacji
function App() {
  // Tutaj możesz dodać globalny stan, np. dane użytkownika
  const [currentUser, setCurrentUser] = useState(null)
  
  // Efekt do sprawdzania stanu autoryzacji (zostanie zaimplementowany później)
  useEffect(() => {
    // Kod sprawdzający autoryzację
    // Na razie zostawiamy puste dla uproszczenia
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          {/* Strona główna */}
          <Route path="/" element={<HomePage />} />
          
          {/* Formularz dodawania ogłoszenia */}
          <Route path="/add" element={<AddCarForm />} />
          
          {/* Nowa trasa dla wyników wyszukiwania */}
          <Route path="/search" element={<SearchResults />} />

          {/* Nowa trasa do szczegółów ogłoszenia */}
          <Route path="/listing/:id" element={<ListingDetails />} />

          {/* Nowa trasa do doradcy AI */}
          <Route path="/advisor" element={<AdvisorPage />} />


          {/* Nowa trasa do doradcy AI */}
          <Route path="/advisor-pro" element={<AdvisorPro />} />
          
          {/* Trasa 404 - gdy nie znaleziono strony */}
          <Route path="*" element={
            <div className="text-center py-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-8">Strona nie została znaleziona.</p>
              <Link to="/" className="btn btn-primary">
                Wróć na stronę główną
              </Link>
            </div>
          } />
        </Routes>
      </main>
      
      <Footer />
    </div>
  )
}

export default App