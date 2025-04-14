import React, { useState } from 'react';
import FirebaseConfigChecker from '../components/FirebaseConfigChecker';
import DebugFetchCars from '../components/DebugFetchCars';
import DebugRegister from '../components/DebugRegister';

const DiagnosticPage = () => {
  const [activeTab, setActiveTab] = useState('config');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">🔧 Diagnostyka Systemu</h1>
      <p className="text-gray-600 text-center mb-8">Narzędzia do diagnozowania problemów z aplikacją.</p>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Konfiguracja Firebase
          </button>
          <button
            onClick={() => setActiveTab('cars')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'cars'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Debugowanie Ogłoszeń
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'register'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Debugowanie Rejestracji
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === 'config' && <FirebaseConfigChecker />}
        {activeTab === 'cars' && <DebugFetchCars />}
        {activeTab === 'register' && <DebugRegister />}
      </div>
      
      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Poradnik Rozwiązywania Problemów</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Problem z ogłoszeniami</h3>
            <ol className="list-decimal list-inside ml-4 space-y-2 text-gray-700">
              <li>Sprawdź, czy kolekcja na pewno nazywa się <code className="bg-gray-100 px-2 py-1 rounded">cars</code> lub <code className="bg-gray-100 px-2 py-1 rounded">listings</code></li>
              <li>Sprawdź reguły bezpieczeństwa Firestore - dodaj reguły z zakładki "Konfiguracja Firebase"</li>
              <li>Sprawdź, czy masz jakiekolwiek dokumenty w kolekcji</li>
              <li>Upewnij się, że pole <code className="bg-gray-100 px-2 py-1 rounded">ownerId</code> w dokumentach jest zgodne z UID z autentykacji</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-lg">Problem z rejestracją</h3>
            <ol className="list-decimal list-inside ml-4 space-y-2 text-gray-700">
              <li>Sprawdź, czy autentykacja przez email/hasło jest włączona w konsoli Firebase</li>
              <li>Sprawdź, czy hasło ma co najmniej 6 znaków</li>
              <li>Upewnij się, że adres email nie jest już używany</li>
              <li>Jeśli problem występuje tylko przy tworzeniu dokumentu użytkownika, sprawdź reguły bezpieczeństwa dla kolekcji <code className="bg-gray-100 px-2 py-1 rounded">users</code></li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-lg">Problem z Firebase</h3>
            <ol className="list-decimal list-inside ml-4 space-y-2 text-gray-700">
              <li>Upewnij się, że wszystkie zmienne środowiskowe są poprawnie ustawione w pliku <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></li>
              <li>Sprawdź, czy projekt Firebase jest prawidłowo skonfigurowany w konsoli Firebase</li>
              <li>Upewnij się, że używasz odpowiedniego identyfikatora projektu</li>
              <li>Sprawdź, czy domena aplikacji jest dodana do listy dozwolonych domen w ustawieniach autentykacji</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;