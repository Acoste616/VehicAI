import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, formatMileage } from '../utils/formatters';

const CarCard = ({ listing }) => {
  if (!listing) return null;

  const {
    id,
    brand,
    model,
    year,
    price,
    mileage,
    fuelType,
    transmission,
    score,
    matchedFields = []
  } = listing;

  // Pobierz główne zdjęcie lub użyj placeholder
  const mainImageUrl = listing.mainImageUrl || listing.images?.[0] || 'https://via.placeholder.com/300x200?text=Brak+zdjęcia';

  // Formatowanie pól
  const formattedPrice = formatPrice(price);
  const formattedMileage = formatMileage(mileage);

  // Mapowanie nazw pól na przyjazne nazwy do wyświetlenia
  const fieldNameMap = {
    'brand': 'marka',
    'model': 'model',
    'bodyType': 'nadwozie',
    'year': 'rocznik',
    'price': 'cena',
    'mileage': 'przebieg',
    'fuelType': 'paliwo',
    'transmission': 'skrzynia biegów',
    'color': 'kolor'
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative pb-[56.25%]">
        <img
          src={mainImageUrl}
          alt={`${brand} ${model}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {brand} {model} <span className="text-gray-600">({year})</span>
        </h2>
        
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <span>{formattedMileage}</span>
          {fuelType && (
            <>
              <span className="mx-1">•</span>
              <span>{fuelType}</span>
            </>
          )}
          {transmission && (
            <>
              <span className="mx-1">•</span>
              <span>{transmission}</span>
            </>
          )}
        </div>
        
        {/* Sekcja dopasowania AI - widoczna tylko gdy score istnieje */}
        {score !== undefined && (
          <div className="mb-3">
            <div className="flex items-center mb-1">
              <span className="text-sm font-medium text-blue-700">Dopasowanie AI: {score}%</span>
              <div className="ml-2 flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{width: `${score}%`}}
                  role="progressbar" 
                  aria-valuenow={score} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
            
            {/* Lista dopasowanych pól */}
            {matchedFields && matchedFields.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {matchedFields.map((field, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {fieldNameMap[field] || field}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xl font-bold text-gray-900">
            {formattedPrice}
          </p>
          <Link 
            to={`/listing/${id}`} 
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label={`Zobacz szczegóły ${brand} ${model}`}
          >
            Zobacz
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarCard;