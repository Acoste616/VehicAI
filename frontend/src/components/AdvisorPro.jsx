import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CarCard from '../components/CarCard';
import { formatPrice, formatMileage } from '../utils/formatters';
import { buildFirestoreQuery } from '../utils/queryBuilder';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { scoreCarListing } from '../utils/aiScoring';

// Dane do wielokrotnego wyboru
const availableBrands = [
  'Audi', 'BMW', 'Ford', 'Honda', 'Hyundai', 'Kia', 'Mazda', 
  'Mercedes', 'Nissan', 'Opel', 'Peugeot', 'Renault', 'Skoda', 
  'Toyota', 'Volkswagen', 'Volvo'
];

const availableBodyTypes = [
  'Sedan', 'Hatchback', 'Kombi', 'SUV', 'Coupe', 'Kabriolet', 'Minivan', 'Pickup'
];

const AdvisorPro = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showBodyTypeDropdown, setShowBodyTypeDropdown] = useState(false);
  const [conversation, setConversation] = useState([
    { role: 'advisor', content: 'Witaj! Jestem AdvisorPro, Twój osobisty doradca samochodowy. Pomogę Ci znaleźć idealny samochód. Zacznijmy od kilku pytań.' }
  ]);
  
  const chatEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  // Definicja kroków konwersacji
  const steps = [
    {
      question: 'Jakiego typu samochodu szukasz? (możesz wybrać kilka opcji)',
      type: 'multiselect-bodytype',
      process: (selections) => {
        return selections;
      }
    },
    {
      question: 'Jaki jest Twój maksymalny budżet? (w PLN)',
      type: 'text',
      process: (answer) => {
        const budget = parseInt(answer.replace(/[^\d]/g, ''));
        return isNaN(budget) ? 100000 : budget;
      }
    },
    {
      question: 'Preferowany rok produkcji (od - do, np. "2015-2022" lub "od 2018")',
      type: 'text',
      process: (answer) => {
        const yearPattern = /(\d{4})(?:\s*-\s*(\d{4}))?|(?:od|from)\s+(\d{4})|(?:do|to)\s+(\d{4})/i;
        const match = answer.match(yearPattern);
        
        if (match) {
          if (match[3]) { // "od 2018"
            return { from: parseInt(match[3]), to: new Date().getFullYear() };
          } else if (match[4]) { // "do 2022"
            return { from: 1990, to: parseInt(match[4]) };
          } else if (match[1] && match[2]) { // "2015-2022"
            return { from: parseInt(match[1]), to: parseInt(match[2]) };
          } else if (match[1]) { // tylko jeden rok
            return { from: parseInt(match[1]), to: parseInt(match[1]) };
          }
        }
        // Domyślne wartości
        return { from: 2010, to: new Date().getFullYear() };
      }
    },
    {
      question: 'Maksymalny przebieg? (w km)',
      type: 'text',
      process: (answer) => {
        const mileage = parseInt(answer.replace(/[^\d]/g, ''));
        return isNaN(mileage) ? 150000 : mileage;
      }
    },
    {
      question: 'Preferowana marka lub marki? (możesz wybrać kilka opcji)',
      type: 'multiselect-brand',
      process: (selections) => {
        return selections.length > 0 ? selections : [];
      },
      optional: true
    },
    {
      question: 'Jaki rodzaj paliwa preferujesz? (benzyna, diesel, hybryda, elektryczny)',
      type: 'text',
      process: (answer) => {
        const fuelType = answer.trim().toLowerCase();
        if (fuelType.includes('benz')) return 'petrol';
        if (fuelType.includes('diesel') || fuelType.includes('on')) return 'diesel';
        if (fuelType.includes('hybr')) return 'hybrid';
        if (fuelType.includes('elekt') || fuelType.includes('ev')) return 'electric';
        return null; // jeśli nie określono
      },
      optional: true
    },
    {
      question: 'Czy masz jakieś dodatkowe wymagania? (np. skrzynia automatyczna, nawigacja, skórzana tapicerka)',
      type: 'text',
      process: (answer) => {
        if (!answer || answer.trim() === '') return [];
        
        // Słowa kluczowe do wykrycia
        const keywordMap = {
          'automat': 'automatic_transmission',
          'automatic': 'automatic_transmission',
          'navi': 'navigation',
          'skóra': 'leather',
          'skórzana': 'leather',
          'klimatyzacja': 'air_conditioning',
          'klima': 'air_conditioning',
          'kamera': 'rear_camera',
          'czujniki': 'parking_sensors',
          'panorama': 'panoramic_roof',
          'dach': 'panoramic_roof',
          'podgrzewane': 'heated_seats'
        };
        
        const features = [];
        const lowerAnswer = answer.toLowerCase();
        
        Object.entries(keywordMap).forEach(([keyword, feature]) => {
          if (lowerAnswer.includes(keyword)) {
            features.push(feature);
          }
        });
        
        return features;
      },
      optional: true
    }
  ];
  
  // Obsługa kliknięcia poza dropdown do jego zamknięcia
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBrandDropdown(false);
        setShowBodyTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Przewijanie chatu do dołu po aktualizacji
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, searchComplete, currentStep]);
  
  // Obsługa wprowadzania odpowiedzi przez użytkownika
  const handleInputChange = (e) => {
    setCurrentInput(e.target.value);
  };
  
  // Obsługa wyboru marki
  const handleBrandSelection = (brand) => {
    const updatedSelection = selectedBrands.includes(brand)
      ? selectedBrands.filter(item => item !== brand)
      : [...selectedBrands, brand];
    
    setSelectedBrands(updatedSelection);
  };

  // Obsługa wyboru rodzaju nadwozia
  const handleBodyTypeSelection = (bodyType) => {
    const updatedSelection = selectedBodyTypes.includes(bodyType)
      ? selectedBodyTypes.filter(item => item !== bodyType)
      : [...selectedBodyTypes, bodyType];
    
    setSelectedBodyTypes(updatedSelection);
  };
  
  // Funkcja do przejścia do następnego kroku dla wielokrotnego wyboru
  const handleMultiSelectSubmit = () => {
    const currentStepObj = steps[currentStep];
    let selections = [];
    let displayContent = '';
    
    if (currentStepObj.type === 'multiselect-brand') {
      selections = [...selectedBrands];
      displayContent = selectedBrands.join(', ');
    } else if (currentStepObj.type === 'multiselect-bodytype') {
      selections = [...selectedBodyTypes];
      displayContent = selectedBodyTypes.join(', ');
    }
    
    // Dodaj odpowiedź użytkownika do konwersacji
    setConversation(prev => [
      ...prev, 
      { role: 'user', content: displayContent || 'Nie wybrano' }
    ]);
    
    // Zapisz odpowiedź
    const newResponses = [...responses];
    newResponses[currentStep] = currentStepObj.process(selections);
    setResponses(newResponses);
    
    // Zamknij dropdowny
    setShowBrandDropdown(false);
    setShowBodyTypeDropdown(false);
    
    // Przejdź do następnego kroku
    setTimeout(() => {
      const nextStep = currentStep + 1;
      if (nextStep < steps.length) {
        setCurrentStep(nextStep);
        setConversation(prev => [
          ...prev, 
          { role: 'advisor', content: steps[nextStep].question }
        ]);
        
        // Resetuj stany dla nowego kroku
        if (steps[nextStep].type === 'text') {
          setCurrentInput('');
        }
      } else {
        setCurrentStep(null);
        setConversation(prev => [
          ...prev, 
          { 
            role: 'advisor', 
            content: 'Dziękuję za wszystkie informacje! Teraz możesz przejrzeć swoje preferencje i rozpocząć wyszukiwanie.'
          }
        ]);
      }
    }, 500);
  };
  
  // Obsługa wysyłania odpowiedzi dla pól tekstowych
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!currentInput.trim()) return;
    
    // Dodaj odpowiedź użytkownika do konwersacji
    const newConversation = [...conversation, { role: 'user', content: currentInput }];
    setConversation(newConversation);
    
    // Przetwórz odpowiedź na bieżący krok
    const currentStepObj = steps[currentStep];
    const processedResponse = currentStepObj.process(currentInput);
    
    // Zapisz odpowiedź
    const newResponses = [...responses];
    newResponses[currentStep] = processedResponse;
    setResponses(newResponses);
    
    // Wyczyść pole wejściowe
    setCurrentInput('');
    
    // Przejdź do następnego kroku lub rozpocznij wyszukiwanie
    setTimeout(() => {
      // Dodaj odpowiedź asystenta
      let advisorResponse;
      
      if (currentStep < steps.length - 1) {
        // Przejdź do następnego kroku
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        advisorResponse = { role: 'advisor', content: steps[nextStep].question };
        
        // Przygotuj stan dla następnego kroku jeśli to multiselect
        if (steps[nextStep].type === 'multiselect-brand') {
          setSelectedBrands([]);
        } else if (steps[nextStep].type === 'multiselect-bodytype') {
          setSelectedBodyTypes([]);
        }
      } else {
        // Zakończono wszystkie kroki
        setCurrentStep(null);
        advisorResponse = { 
          role: 'advisor', 
          content: 'Dziękuję za wszystkie informacje! Teraz możesz przejrzeć swoje preferencje i rozpocząć wyszukiwanie.'
        };
      }
      
      setConversation(prev => [...prev, advisorResponse]);
    }, 500);
  };
  
  // Funkcja do rozpoczęcia wyszukiwania
  const startSearch = async (preferences) => {
    setIsSearching(true);
    
    // Dodaj informację do konwersacji
    setConversation(prev => [
      ...prev, 
      { role: 'advisor', content: 'Szukam najlepszych samochodów dla Ciebie...' }
    ]);
    
    try {
      // Buduj zapytanie do Firestore na podstawie preferencji
      const queryConstraints = buildFirestoreQuery(preferences);
      
      // Wykonaj zapytanie
      const carsRef = collection(db, 'cars');
      const querySnapshot = await getDocs(carsRef);
      
      // Przetwórz wyniki
      let results = [];
      querySnapshot.forEach((doc) => {
        const carData = doc.data();
        const carWithId = { ...carData, id: doc.id };
        
        // Oblicz wynik dopasowania
        const matchScore = scoreCarListing(carWithId, preferences);
        results.push({ ...carWithId, matchScore });
      });
      
      // Sortuj wyniki według wyniku dopasowania (od najwyższego)
      results.sort((a, b) => b.matchScore - a.matchScore);
      
      // Ogranicz wyniki do najlepszych 10
      results = results.slice(0, 10);
      
      // Zaktualizuj stan
      setSearchResults(results);
      
      // Dodaj podsumowanie do konwersacji
      setConversation(prev => [
        ...prev, 
        { role: 'advisor', content: `Znalazłem ${results.length} samochodów, które pasują do Twoich preferencji.` }
      ]);
    } catch (error) {
      console.error('Error searching for cars:', error);
      
      // Dodaj informację o błędzie
      setConversation(prev => [
        ...prev, 
        { role: 'advisor', content: 'Przepraszam, wystąpił problem podczas wyszukiwania. Spróbuj ponownie później.' }
      ]);
    }
    
    setIsSearching(false);
    setSearchComplete(true);
  };
  
  // Funkcja do przejścia do szczegółów samochodu
  const viewCarDetails = (carId) => {
    navigate(`/cars/${carId}`);
  };
  
  // Funkcja do pomijania obecnego kroku (dla opcjonalnych kroków)
  const skipCurrentStep = () => {
    if (!steps[currentStep].optional) return;
    
    // Dodaj informację o pominięciu
    setConversation(prev => [
      ...prev, 
      { role: 'user', content: 'Pomijam ten krok' }
    ]);
    
    // Ustaw pustą odpowiedź
    const newResponses = [...responses];
    
    if (steps[currentStep].type === 'multiselect-brand') {
      newResponses[currentStep] = [];
      setSelectedBrands([]);
    } else if (steps[currentStep].type === 'multiselect-bodytype') {
      newResponses[currentStep] = [];
      setSelectedBodyTypes([]);
    } else {
      newResponses[currentStep] = steps[currentStep].process('');
    }
    
    setResponses(newResponses);
    
    // Przejdź do następnego kroku
    setTimeout(() => {
      const nextStep = currentStep + 1;
      
      if (nextStep < steps.length) {
        setCurrentStep(nextStep);
        setConversation(prev => [
          ...prev, 
          { role: 'advisor', content: steps[nextStep].question }
        ]);
      } else {
        setCurrentStep(null);
        setConversation(prev => [
          ...prev, 
          { 
            role: 'advisor', 
            content: 'Dziękuję za wszystkie informacje! Teraz możesz przejrzeć swoje preferencje i rozpocząć wyszukiwanie.'
          }
        ]);
      }
    }, 500);
  };
  
  // Funkcja renderująca podsumowanie preferencji
  const renderPreferencesSummary = () => {
    // Pokaż podsumowanie tylko gdy użytkownik odpowiedział na wszystkie pytania,
    // nie jest obecnie w trakcie wyszukiwania i nie znajduje się na żadnym kroku
    if (!searchComplete && !isSearching && !currentStep) {
      return (
        <div 
          className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto my-4"
          ref={chatEndRef}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Czy to się zgadza?</h2>
          
          <div className="space-y-4 mb-6">
            {steps.map((step, index) => {
              // Sprawdź czy mamy odpowiedź dla tego kroku
              if (responses[index] !== undefined) {
                let displayValue = '';
                
                if (step.type === 'multiselect-brand' || step.type === 'multiselect-bodytype') {
                  // Dla multiselect pokazujemy listę wartości
                  displayValue = Array.isArray(responses[index]) 
                    ? responses[index].join(', ') 
                    : 'Nie wybrano';
                } else {
                  // Dla innych typów wartości
                  displayValue = typeof responses[index] === 'object' 
                    ? JSON.stringify(responses[index]) 
                    : responses[index];
                }
                
                return (
                  <div key={index} className="flex items-start justify-between border-b pb-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">{step.question}</p>
                      <p className="text-md font-medium text-gray-800">
                        {displayValue}
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentStep(index)}
                      className="ml-3 px-3 py-1 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      Edytuj
                    </button>
                  </div>
                );
              }
              return null;
            })}
          </div>
          
          <button
            onClick={() => startSearch(responses)}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            Szukaj teraz
          </button>
        </div>
      );
    }
    return null;
  };
  
  // Renderowanie multi-select dla marek
  const renderBrandSelector = () => {
    return (
      <div className="mt-2 mb-4 relative" ref={dropdownRef}>
        <div 
          className="flex flex-wrap gap-2 mb-2 min-h-10 p-2 border border-gray-300 rounded-lg cursor-pointer"
          onClick={() => setShowBrandDropdown(!showBrandDropdown)}
        >
          {selectedBrands.length > 0 ? (
            selectedBrands.map(brand => (
              <div key={brand} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center">
                {brand}
                <button 
                  className="ml-1 text-blue-500 hover:text-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBrandSelection(brand);
                  }}
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <span className="text-gray-500">Kliknij, aby wybrać marki</span>
          )}
        </div>
        
        {showBrandDropdown && (
          <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg">
            {availableBrands.map(brand => (
              <div 
                key={brand}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                  selectedBrands.includes(brand) ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleBrandSelection(brand)}
              >
                <input 
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => {}}
                  className="mr-2"
                />
                {brand}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between mt-2">
          <button
            type="button"
            onClick={handleMultiSelectSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dalej
          </button>
          
          {steps[currentStep]?.optional && (
            <button
              type="button"
              onClick={skipCurrentStep}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Pomiń
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // Renderowanie multi-select dla rodzajów nadwozia
  const renderBodyTypeSelector = () => {
    return (
      <div className="mt-2 mb-4 relative" ref={dropdownRef}>
        <div 
          className="flex flex-wrap gap-2 mb-2 min-h-10 p-2 border border-gray-300 rounded-lg cursor-pointer"
          onClick={() => setShowBodyTypeDropdown(!showBodyTypeDropdown)}
        >
          {selectedBodyTypes.length > 0 ? (
            selectedBodyTypes.map(bodyType => (
              <div key={bodyType} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center">
                {bodyType}
                <button 
                  className="ml-1 text-blue-500 hover:text-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBodyTypeSelection(bodyType);
                  }}
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <span className="text-gray-500">Kliknij, aby wybrać rodzaje nadwozia</span>
          )}
        </div>
        
        {showBodyTypeDropdown && (
          <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg">
            {availableBodyTypes.map(bodyType => (
              <div 
                key={bodyType}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                  selectedBodyTypes.includes(bodyType) ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleBodyTypeSelection(bodyType)}
              >
                <input 
                  type="checkbox"
                  checked={selectedBodyTypes.includes(bodyType)}
                  onChange={() => {}}
                  className="mr-2"
                />
                {bodyType}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between mt-2">
          <button
            type="button"
            onClick={handleMultiSelectSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dalej
          </button>
          
          {steps[currentStep]?.optional && (
            <button
              type="button"
              onClick={skipCurrentStep}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Pomiń
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // Renderowanie odpowiedniego formularza w zależności od typu kroku
  const renderInputForm = () => {
    if (currentStep === null) return null;
    
    const currentStepObj = steps[currentStep];
    
    if (currentStepObj.type === 'multiselect-brand') {
      return renderBrandSelector();
    } else if (currentStepObj.type === 'multiselect-bodytype') {
      return renderBodyTypeSelector();
    } else {
      // Tekstowe pole wejściowe
      return (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={currentInput}
              onChange={handleInputChange}
              placeholder="Wpisz swoją odpowiedź..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Wyślij
          </button>
          
          {currentStepObj.optional && (
            <button
              type="button"
              onClick={skipCurrentStep}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Pomiń
            </button>
          )}
        </form>
      );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-6 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          VehicAI AdvisorPro
        </h1>
        
        {/* Obszar konwersacji */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="space-y-4 mb-4">
            {conversation.map((message, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg max-w-[85%] ${
                  message.role === 'advisor' 
                    ? 'bg-blue-50 text-blue-900 mr-auto' 
                    : 'bg-gray-100 text-gray-800 ml-auto'
                }`}
              >
                {message.content}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          {/* Formularz wprowadzania odpowiedzi */}
          {currentStep !== null && renderInputForm()}
        </div>
        
        {/* Podsumowanie preferencji */}
        {!searchComplete && !isSearching && !currentStep && renderPreferencesSummary()}
        
        {/* Wskaźnik ładowania podczas wyszukiwania */}
        {isSearching && (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Wyniki wyszukiwania */}
        {searchComplete && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Najlepiej dopasowane samochody dla Ciebie
            </h2>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map(car => (
                  <CarCard
                    key={car.id}
                    car={car}
                    formatPrice={formatPrice}
                    formatMileage={formatMileage}
                    matchScore={car.matchScore}
                    onClick={() => viewCarDetails(car.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-600">
                Nie znaleziono samochodów pasujących do podanych kryteriów.
              </p>
            )}
            
            <button
              onClick={() => {
                setCurrentStep(0);
                setResponses([]);
                setSelectedBrands([]);
                setSelectedBodyTypes([]);
                setSearchComplete(false);
                setSearchResults([]);
                setConversation([
                  { role: 'advisor', content: 'Witaj ponownie! Spróbujmy znaleźć inny samochód. Zacznijmy od początku.' }
                ]);
              }}
              className="mt-8 mx-auto block px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Rozpocznij nowe wyszukiwanie
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvisorPro;