// src/pages/AdvisorPro.jsx (Conceptual Refactor)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase/config'; // Ensure correct path
import { chatSteps } from '../advisor/chatSteps'; // Ensure correct path
import { getNextStep, buildSearchParams, scoreListing } from '../advisor/advisorEngine'; // Ensure correct path
import CarCard from '../components/CarCard'; // Ensure correct path
import { formatPrice, formatMileage } from '../utils/formatters'; // Ensure correct path - Note: formatters.js doesn't export these, only formatPrice/formatMileage. Update exports or usage.

const AdvisorPro = () => {
    const [responses, setResponses] = useState({});
    const [currentStepId, setCurrentStepId] = useState(chatSteps[0]?.id); // Store step ID instead of the whole object
    const [currentValue, setCurrentValue] = useState('');
    const [validationError, setValidationError] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [searchComplete, setSearchComplete] = useState(false);
    const chatEndRef = useRef(null);

    // Derive currentStep object from ID for easier access and fewer state updates
    const currentStep = chatSteps.find(step => step.id === currentStepId);

    // Add Advisor's initial message
    useEffect(() => {
        if (currentStep && conversationHistory.length === 0) {
             setConversationHistory([{ type: 'advisor', text: currentStep.label }]);
        }
    }, [currentStep]); // Add dependency


    // Reset current value when step changes
    useEffect(() => {
        if (currentStep) {
            const existingResponse = responses[currentStep.id];
            setCurrentValue(existingResponse !== undefined ? String(existingResponse) : ''); // Ensure value is string for input fields
             setValidationError(''); // Clear validation error on step change
        }
    }, [currentStepId, responses]); // Depend on currentStepId

    // Scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationHistory]);

    // --- Input Rendering Logic ---
     const renderInputField = useCallback(() => {
        if (!currentStep || searchComplete || isSearching) return null;

        const commonInputClass = `w-full px-4 py-3 rounded-lg border ${
              validationError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`;

        const handleInputChange = (e) => setCurrentValue(e.target.value);

        switch (currentStep.inputType) {
            case 'select':
                return (
                    <div className="space-y-2 mt-3">
                        {/* Ensure options exist before mapping */}
                        {currentStep.options?.map((option, index) => {
                             const optionValue = option.value !== undefined ? option.value : option; // Handle options as objects or strings
                            const optionLabel = option.label !== undefined ? option.label : option;
                            return (
                                <button
                                    key={index}
                                    // Directly call handleSelectOption, pass value
                                    onClick={() => handleSelectOption(optionValue)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border ${
                                          currentValue === String(optionValue) // Compare as strings if necessary
                                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-300' // Indicate selection clearly
                                            : 'hover:bg-gray-50 border-gray-300'
                                    } transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                >
                                    {optionLabel}
                                </button>
                            );
                        })}
                    </div>
                );
             case 'price':
                 return (
                     <div className="relative">
                         <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">zł</span>
                         <input
                             type="number"
                             value={currentValue}
                             onChange={handleInputChange}
                             placeholder={currentStep.hint || "Np. 50000"}
                             min="0" // Add min attribute
                             className={`${commonInputClass} pl-8`} // Adjust padding for symbol
                         />
                     </div>
                 );
            // Add cases for 'text', 'number', 'year', 'mileage' similar to the original, using commonInputClass
             case 'text':
                return (
                    <input
                        type="text"
                        value={currentValue}
                        onChange={handleInputChange}
                        placeholder={currentStep.hint || "Wpisz odpowiedź..."}
                        className={commonInputClass}
                    />
                );
             case 'number': // Generic number
                 return (
                     <input
                         type="number"
                         value={currentValue}
                         onChange={handleInputChange}
                         placeholder={currentStep.hint || "Wpisz liczbę..."}
                         className={commonInputClass}
                     />
                 );
            case 'year':
                 return (
                     <input
                         type="number"
                         value={currentValue}
                         onChange={handleInputChange}
                         placeholder={currentStep.hint || "Np. 2018"}
                         min="1900"
                         max={new Date().getFullYear() + 1}
                         className={commonInputClass}
                     />
                 );
             case 'mileage':
                 return (
                     <div className="relative">
                         <input
                             type="number"
                             value={currentValue}
                             onChange={handleInputChange}
                             placeholder={currentStep.hint || "Np. 100000"}
                             min="0" // Add min attribute
                             className={`${commonInputClass} pr-12`} // Adjust padding for symbol
                         />
                          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">km</span>
                     </div>
                 );

            default: // Fallback to text input
                return (
                     <input
                         type="text"
                         value={currentValue}
                         onChange={handleInputChange}
                         placeholder={currentStep.hint || "Wpisz odpowiedź..."}
                         className={commonInputClass}
                     />
                 );
        }
    }, [currentStep, currentValue, validationError, searchComplete, isSearching]); // Dependencies for useCallback


    // --- Step Progression Logic ---
    const proceedToNextStep = useCallback((currentResponses) => {
         const nextStep = getNextStep(currentResponses); // Get next step based on *updated* responses

        if (nextStep) {
            setCurrentStepId(nextStep.id); // Update step ID
            // Add advisor's next question to history
            setConversationHistory(prev => [...prev, { type: 'advisor', text: nextStep.label }]);
        } else {
            // All steps done, prepare for search summary
            setCurrentStepId(null);
             setConversationHistory(prev => [...prev, { type: 'advisor', text: 'Dziękuję! Za chwilę pokażę podsumowanie. Możesz wtedy rozpocząć wyszukiwanie.' }]);
            // Don't start search automatically, let user review first
        }
    }, []); // Empty dependency array if getNextStep is pure

    // --- Form Submission and Option Selection ---
    const handleFormSubmit = useCallback((e) => {
        e.preventDefault();
        if (!currentStep || currentStep.inputType === 'select') return; // Don't submit for select type here

        // Basic Validation (Expand as needed)
        if (currentStep.required && !currentValue.trim()) {
            setValidationError('To pole jest wymagane');
            return;
        }
        // Add more specific validation based on inputType if needed
         setValidationError(''); // Clear error if validation passes


        const displayValue = getDisplayValue(currentValue, currentStep);
        // Add user response to history
        setConversationHistory(prev => [...prev, { type: 'user', text: displayValue }]);

        // Update responses state
        const updatedResponses = {
            ...responses,
            [currentStep.id]: currentValue // Store the raw value first, process later if needed
        };
        setResponses(updatedResponses);

        // Move to next step
        proceedToNextStep(updatedResponses);

    }, [currentStep, currentValue, responses, proceedToNextStep]); // Dependencies

     // Handler for select options
    const handleSelectOption = useCallback((selectedValue) => {
        setCurrentValue(String(selectedValue)); // Ensure value is stored, compare as strings if needed

        const displayValue = getDisplayValue(selectedValue, currentStep);
        // Add user response to history immediately
        setConversationHistory(prev => [...prev, { type: 'user', text: displayValue }]);

        // Update responses state
        const updatedResponses = {
            ...responses,
            [currentStep.id]: selectedValue
        };
        setResponses(updatedResponses);

         // Proceed to next step after a short delay to show selection
        // setTimeout(() => proceedToNextStep(updatedResponses), 300); // Keep delay or remove if preferred
         proceedToNextStep(updatedResponses); // Or proceed immediately

    }, [currentStep, responses, proceedToNextStep]); // Dependencies


    // --- Search Logic ---
    const startSearch = useCallback(async () => {
        setIsSearching(true);
        setSearchComplete(false);
        setSearchError(null);
        setConversationHistory(prev => [...prev, { type: 'advisor', text: 'Rozpoczynam wyszukiwanie najlepszych ofert...' }]);

        try {
            const searchParams = buildSearchParams(responses);
            console.log('Final Search Params:', searchParams);

            // Build Firestore Query (Simplified Example - Needs actual implementation)
            let carsQuery = collection(db, 'cars'); // Use 'cars' collection based on seed script
             let queryConstraints = [];

            // --- Apply Filters based on searchParams ---
             if (searchParams.brands?.length > 0) {
                queryConstraints.push(where('brand', 'in', searchParams.brands));
             }
             if (searchParams.bodyTypes?.length > 0) {
                 queryConstraints.push(where('bodyType', 'in', searchParams.bodyTypes)); // Assumes bodyType exists in 'cars' collection
             }
             if (searchParams.fuelTypes?.length > 0) {
                // Firestore 'in' queries support up to 10 elements. If more fuel types, adjust logic.
                 queryConstraints.push(where('fuelType', 'in', searchParams.fuelTypes)); // Assumes fuelType exists
             }
             if (searchParams.transmission) {
                 queryConstraints.push(where('transmission', '==', searchParams.transmission)); // Assumes transmission exists
             }
             if (searchParams.minYear) {
                 queryConstraints.push(where('year', '>=', searchParams.minYear)); // Assumes year exists
             }
             if (searchParams.maxPrice) {
                 queryConstraints.push(where('price', '<=', searchParams.maxPrice)); // Assumes price exists
             }
             if (searchParams.maxMileage) {
                 queryConstraints.push(where('mileage', '<=', searchParams.maxMileage)); // Assumes mileage exists
             }
             // Consider adding orderBy constraints if no specific filters are applied, e.g., orderBy('createdAt', 'desc')
             // Add limit constraint
             queryConstraints.push(limit(20)); // Limit results


            // Execute Query
            const finalQuery = query(carsQuery, ...queryConstraints);
            const querySnapshot = await getDocs(finalQuery);

            // Process and Score Results
            const cars = [];
            querySnapshot.forEach((doc) => {
                const carData = { id: doc.id, ...doc.data() };
                 // Pass `responses` directly to scoreListing as it expects the raw answers object
                const scoringResult = scoreListing(carData, responses);
                cars.push({ ...carData, ...scoringResult }); // Merge score and matchedFields
            });

            // Sort by score
            cars.sort((a, b) => b.score - a.score);

            setSearchResults(cars);
            setSearchComplete(true);
            setConversationHistory(prev => [...prev, { type: 'advisor', text: `Znalazłem ${cars.length} pasujących ofert.` }]);

        } catch (error) {
            console.error('Search Error:', error);
            setSearchError('Wystąpił błąd podczas wyszukiwania.');
            setConversationHistory(prev => [...prev, { type: 'advisor', text: 'Przepraszam, wystąpił błąd podczas wyszukiwania.' }]);
        } finally {
            setIsSearching(false);
        }
    }, [responses]); // Depend on responses

    // --- Helper Functions ---
    const getDisplayValue = (value, step) => {
         if (!step) return String(value); // Handle missing step case

        if (step.inputType === 'select' && step.options) {
             const selectedOption = step.options.find(opt =>
                 (opt.value !== undefined ? String(opt.value) : String(opt)) === String(value)
             );
            return selectedOption?.label || selectedOption || String(value);
        } else if (step.inputType === 'price' && value) {
            return formatPrice(Number(value)); // Use formatter
        } else if (step.inputType === 'mileage' && value) {
             return formatMileage(Number(value)); // Use formatter
        }
        return String(value); // Default to string conversion
    };

    const getMatchedFieldsDescription = (matchedFields) => {
         // Use the fieldNameMap from CarCard or define locally
         const fieldNames = {
            'brand': 'marka', 'bodyType': 'nadwozie', 'price': 'cena',
            'year': 'rocznik', 'mileage': 'przebieg', 'fuelType': 'paliwo',
            'transmission': 'skrzynia', 'suggestedBodyType': 'suger. nadwozie'
         };
         return matchedFields?.map(field => fieldNames[field] || field).join(', ') || '';
     };


    // --- Reset Logic ---
    const resetAdvisor = () => {
        setResponses({});
        setCurrentStepId(chatSteps[0]?.id);
        setCurrentValue('');
        setValidationError('');
        setConversationHistory(currentStep ? [{ type: 'advisor', text: chatSteps[0]?.label }] : []);
        setSearchResults([]);
        setIsSearching(false);
        setSearchError(null);
        setSearchComplete(false);
    };


     // --- Render Summary Logic ---
     const renderSummary = () => {
         if (currentStepId !== null || isSearching || searchComplete) return null;

         return (
             <div className="bg-gray-50 rounded-lg shadow p-6 my-6">
                 <h2 className="text-xl font-semibold mb-4">Podsumowanie preferencji:</h2>
                 <ul className="space-y-2 mb-6">
                     {Object.entries(responses).map(([stepId, value]) => {
                         const step = chatSteps.find(s => s.id === stepId);
                         if (!step) return null;
                         return (
                             <li key={stepId} className="flex justify-between items-center border-b pb-1">
                                 <span className="text-gray-600">{step.label}:</span>
                                 <span className="font-medium">{getDisplayValue(value, step)}</span>
                             </li>
                         );
                     })}
                 </ul>
                 <button
                     onClick={startSearch}
                     className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
                 >
                     Rozpocznij wyszukiwanie
                 </button>
             </div>
         );
     };


    // --- Main Render ---
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2 text-center">VehicAI Advisor Pro</h1>
            <p className="text-gray-600 mb-6 text-center">
                Odpowiedz na kilka pytań, aby znaleźć idealny samochód.
            </p>

            {/* Chat Area */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-2"> {/* Scrollable history */}
                    {conversationHistory.map((item, index) => (
                        <div key={index} className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-[85%] ${item.type === 'user' ? 'bg-gray-100' : 'bg-blue-50 text-blue-800'}`}>
                                {item.text}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} /> {/* Element to scroll to */}
                </div>

                {/* Current Step Input Area */}
                 {!isSearching && !searchComplete && currentStep && (
                     <form onSubmit={handleFormSubmit}> {/* Wrap input in form */}
                         {renderInputField()}
                         {validationError && <p className="text-red-500 text-sm mt-1">{validationError}</p>}
                         {/* Submit button only for non-select types */}
                         {currentStep.inputType !== 'select' && (
                             <button
                                 type="submit" // Use type="submit"
                                 className="mt-4 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-300"
                             >
                                 Dalej
                             </button>
                         )}
                     </form>
                 )}

                 {/* Loading Indicator */}
                 {isSearching && (
                     <div className="text-center py-8">
                         <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                         <p className="text-gray-600">Szukam najlepszych ofert...</p>
                     </div>
                 )}
             </div>


             {/* Summary Section */}
             {renderSummary()}


            {/* Search Results */}
            {searchComplete && (
                 <div>
                     <h2 className="text-2xl font-semibold mb-4">
                         {searchResults.length > 0 ? `Znalezione oferty (${searchResults.length})` : 'Nie znaleziono pasujących ofert'}
                     </h2>

                     {searchError && <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">{searchError}</div>}

                     {searchResults.length === 0 && !searchError && (
                         <div className="bg-yellow-100 text-yellow-700 p-4 rounded-md mb-4">
                             Spróbuj zmodyfikować swoje preferencje lub rozpocznij nowe wyszukiwanie.
                         </div>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                         {searchResults.map((car) => (
                            <div key={car.id} className="border rounded-lg overflow-hidden shadow-sm">
                                 <CarCard listing={car} /> {/* Pass the whole car object */}
                                 {/* Display score and matched fields inside or below CarCard */}
                                <div className="px-4 py-2 bg-blue-50 border-t">
                                    <p className="text-sm text-blue-800">
                                        <span className="font-medium">Dopasowanie: {car.score}%</span>
                                         {car.matchedFields?.length > 0 && (
                                             <span className="text-xs block text-gray-600">
                                                 (Zgodne: {getMatchedFieldsDescription(car.matchedFields)})
                                             </span>
                                         )}
                                    </p>
                                 </div>
                            </div>
                         ))}
                     </div>

                    <button
                        onClick={resetAdvisor}
                        className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition duration-300 mx-auto block"
                    >
                        Rozpocznij nowe wyszukiwanie
                    </button>
                 </div>
            )}
        </div>
    );
};

export default AdvisorPro;