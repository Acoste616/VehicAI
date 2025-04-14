import React, { useState, useEffect } from 'react';
import { SearchParams } from '../hooks/useCars';

interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
  initialParams?: SearchParams;
}

// Common car brands for dropdown
const CAR_BRANDS = [
  'Audi', 'BMW', 'Citroen', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai', 
  'Kia', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Renault', 
  'Seat', 'Skoda', 'Toyota', 'Volkswagen', 'Volvo'
];

// Common fuel types
const FUEL_TYPES = [
  'Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'
];

// Common body types
const BODY_TYPES = [
  'Sedan', 'Hatchback', 'Estate', 'SUV', 'Coupe', 'Convertible', 'Van', 'Pickup'
];

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, initialParams = {} }) => {
  const [searchParams, setSearchParams] = useState<SearchParams>(initialParams);
  const [expanded, setExpanded] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    Array.isArray(initialParams.brand) ? initialParams.brand : 
    initialParams.brand ? [initialParams.brand] : []
  );
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>(
    Array.isArray(initialParams.fuelType) ? initialParams.fuelType : 
    initialParams.fuelType ? [initialParams.fuelType] : []
  );
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>(
    Array.isArray(initialParams.bodyType) ? initialParams.bodyType : 
    initialParams.bodyType ? [initialParams.bodyType] : []
  );

  useEffect(() => {
    // Update searchParams when selections change
    setSearchParams(prev => ({
      ...prev,
      brand: selectedBrands.length > 0 ? selectedBrands : undefined,
      fuelType: selectedFuelTypes.length > 0 ? selectedFuelTypes : undefined,
      bodyType: selectedBodyTypes.length > 0 ? selectedBodyTypes : undefined
    }));
  }, [selectedBrands, selectedFuelTypes, selectedBodyTypes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric inputs
    if (['minPrice', 'maxPrice', 'minYear', 'maxYear'].includes(name)) {
      const numValue = value === '' ? undefined : Number(value);
      setSearchParams(prev => ({ ...prev, [name]: numValue }));
    } else {
      setSearchParams(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand) 
        : [...prev, brand]
    );
  };

  const handleFuelTypeToggle = (fuelType: string) => {
    setSelectedFuelTypes(prev => 
      prev.includes(fuelType) 
        ? prev.filter(ft => ft !== fuelType) 
        : [...prev, fuelType]
    );
  };

  const handleBodyTypeToggle = (bodyType: string) => {
    setSelectedBodyTypes(prev => 
      prev.includes(bodyType) 
        ? prev.filter(bt => bt !== bodyType) 
        : [...prev, bodyType]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  const handleClear = () => {
    setSearchParams({});
    setSelectedBrands([]);
    setSelectedFuelTypes([]);
    setSelectedBodyTypes([]);
    onSearch({});
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <form onSubmit={handleSearch}>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          {/* Basic search fields (always visible) */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <div className="relative">
              <input
                type="text"
                name="model"
                placeholder="e.g., Audi, BMW, Golf"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchParams.model || ''}
                onChange={handleInputChange}
              />
              {selectedBrands.length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {selectedBrands.length}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                name="minPrice"
                placeholder="Min"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchParams.minPrice || ''}
                onChange={handleInputChange}
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Max"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchParams.maxPrice || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Range</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                name="minYear"
                placeholder="From"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchParams.minYear || ''}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                name="maxYear"
                placeholder="To"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchParams.maxYear || ''}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
          </div>
        </div>
        
        {/* Advanced search fields (collapsible) */}
        {expanded && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Brand Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Car Brands</label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {CAR_BRANDS.map(brand => (
                      <div key={brand} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`brand-${brand}`}
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandToggle(brand)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`brand-${brand}`} className="ml-2 text-sm text-gray-700">
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Fuel Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                <div className="border border-gray-300 rounded-md p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {FUEL_TYPES.map(fuelType => (
                      <div key={fuelType} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`fuel-${fuelType}`}
                          checked={selectedFuelTypes.includes(fuelType)}
                          onChange={() => handleFuelTypeToggle(fuelType)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`fuel-${fuelType}`} className="ml-2 text-sm text-gray-700">
                          {fuelType}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Body Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body Type</label>
                <div className="border border-gray-300 rounded-md p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {BODY_TYPES.map(bodyType => (
                      <div key={bodyType} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`body-${bodyType}`}
                          checked={selectedBodyTypes.includes(bodyType)}
                          onChange={() => handleBodyTypeToggle(bodyType)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`body-${bodyType}`} className="ml-2 text-sm text-gray-700">
                          {bodyType}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            {expanded ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;