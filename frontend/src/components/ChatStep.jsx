import React, { useState, useEffect, useRef } from 'react';

const ChatStep = ({ question, options, type = 'text', onAnswer, disabled = false, initialValue = '' }) => {
  const [answer, setAnswer] = useState(initialValue);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Fokusujemy na input przy montowaniu komponentu
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Funkcja do walidacji odpowiedzi przed wysłaniem
  const validateAnswer = () => {
    // Sprawdzamy czy pole jest puste
    if (!answer && type !== 'select') {
      setError('To pole jest wymagane');
      return false;
    }

    // Walidacja dla typu number
    if (type === 'number' && isNaN(Number(answer))) {
      setError('Proszę podać prawidłową liczbę');
      return false;
    }

    // Walidacja dla typu year
    if (type === 'year') {
      const year = Number(answer);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
        setError('Proszę podać prawidłowy rok');
        return false;
      }
    }

    // Walidacja dla typu price
    if (type === 'price') {
      const price = Number(answer);
      if (isNaN(price) || price <= 0) {
        setError('Proszę podać prawidłową cenę');
        return false;
      }
    }

    // Walidacja dla typu mileage
    if (type === 'mileage') {
      const mileage = Number(answer);
      if (isNaN(mileage) || mileage < 0) {
        setError('Proszę podać prawidłowy przebieg');
        return false;
      }
    }

    // Jeśli wszystko jest ok, czyścimy błąd
    setError('');
    return true;
  };

  // Obsługa wysłania formularza
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (disabled) return;
    
    if (validateAnswer()) {
      onAnswer(answer);
      // Jeśli chcemy resetować pole po wysłaniu
      // setAnswer('');
    }
  };

  // Obsługa zmiany wartości pola
  const handleChange = (e) => {
    const value = e.target.value;
    setAnswer(value);
    
    // Automatyczna walidacja podczas pisania
    if (error) {
      validateAnswer();
    }
  };

  // Obsługa wyboru opcji z listy
  const handleOptionSelect = (value) => {
    if (disabled) return;
    
    setAnswer(value);
    
    // Automatyczne wysłanie po wyborze opcji
    onAnswer(value);
  };

  // Renderowanie odpowiedniego pola formularza na podstawie typu
  const renderInputField = () => {
    switch (type) {
      case 'select':
        return (
          <div className="space-y-2 mt-3">
            {options && options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(option.value || option)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  disabled
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
                disabled={disabled}
              >
                {option.label || option}
              </button>
            ))}
          </div>
        );
        
      case 'text':
        return (
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={handleChange}
            placeholder="Wpisz odpowiedź..."
            className={`w-full px-4 py-3 rounded-lg border ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={disabled}
          />
        );
        
      case 'number':
        return (
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={handleChange}
            placeholder="Wpisz liczbę..."
            className={`w-full px-4 py-3 rounded-lg border ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={disabled}
          />
        );
        
      case 'year':
        return (
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={handleChange}
            placeholder="Np. 2018"
            min="1900"
            max={new Date().getFullYear() + 1}
            className={`w-full px-4 py-3 rounded-lg border ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={disabled}
          />
        );
        
      case 'price':
        return (
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
              zł
            </span>
            <input
              ref={inputRef}
              type="number"
              value={answer}
              onChange={handleChange}
              placeholder="Np. 50000"
              min="0"
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                error ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={disabled}
            />
          </div>
        );
        
      case 'mileage':
        return (
          <div className="relative">
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
              km
            </span>
            <input
              ref={inputRef}
              type="number"
              value={answer}
              onChange={handleChange}
              placeholder="Np. 100000"
              min="0"
              className={`w-full px-4 py-3 rounded-lg border ${
                error ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={disabled}
            />
          </div>
        );
        
      default:
        return (
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={handleChange}
            placeholder="Wpisz odpowiedź..."
            className={`w-full px-4 py-3 rounded-lg border ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className={`${disabled ? 'opacity-80' : ''}`}>
      {/* Pytanie od asystenta */}
      <div className="bg-blue-50 p-3 rounded-lg self-start inline-block max-w-[80%] mb-4">
        <p className="text-blue-800">{question}</p>
      </div>
      
      {/* Formularz odpowiedzi */}
      <form onSubmit={handleSubmit} className="mt-2">
        <div className="space-y-3">
          {/* Pole formularza */}
          {renderInputField()}
          
          {/* Komunikat o błędzie */}
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
          
          {/* Przycisk wysłania - tylko dla typów innych niż select */}
          {type !== 'select' && (
            <button
              type="submit"
              className={`px-6 py-2 rounded-lg text-white font-medium ${
                disabled
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 transition duration-300'
              }`}
              disabled={disabled}
            >
              Dalej
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatStep;