// src/pages/AdvisorPro.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase/config'; // Correct import path assumed
import { chatSteps, getStepById, getStepIndexById } from '../advisor/chatSteps'; // Helper function imports
// ### POPRAWKA IMPORTU: Importujemy 'getNextStep' zamiast 'getNextStepLogic' ###
import { getNextStep, buildSearchParams, scoreListing } from '../advisor/advisorEngine';
import CarCard from '../components/CarCard'; // Ensure correct path
import { formatPrice, formatMileage } from '../utils/formatters'; // Ensure correct path and exports

const AdvisorPro = () => {
    // --- State Variables ---
    const [responses, setResponses] = useState({});
    const [currentStepId, setCurrentStepId] = useState(chatSteps[0]?.id);
    const [currentValue, setCurrentValue] = useState(''); // For text/number inputs
    const [currentMultiSelection, setCurrentMultiSelection] = useState([]); // For multiselect inputs
    const [validationError, setValidationError] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [searchComplete, setSearchComplete] = useState(false);
    const chatEndRef = useRef(null); // Ref for scrolling chat
    const multiSelectContainerRef = useRef(null); // Ref for closing multiselect dropdown
    const [showDropdown, setShowDropdown] = useState(false); // State for multiselect dropdown visibility

    // --- Derived Values ---
    const currentStep = useMemo(() => getStepById(currentStepId), [currentStepId]);
    const currentStepIndex = useMemo(() => getStepIndexById(currentStepId), [currentStepId]);
    const totalSteps = chatSteps.length;

    // --- Effects ---

    // Initialize conversation
    useEffect(() => {
        if (currentStep && conversationHistory.length === 0) {
            setConversationHistory([{ type: 'advisor', text: currentStep.label }]);
        }
    }, [currentStep, conversationHistory.length]);

    // Reset input values when step changes
    useEffect(() => {
        if (currentStep) {
            const existingResponse = responses[currentStep.id];
            if (currentStep.inputType?.startsWith('multiselect')) {
                setCurrentMultiSelection(Array.isArray(existingResponse) ? existingResponse : []);
                setCurrentValue('');
            } else {
                setCurrentValue(existingResponse !== undefined ? String(existingResponse) : '');
                setCurrentMultiSelection([]);
            }
            setValidationError('');
            setShowDropdown(false);
        }
    }, [currentStepId, responses, currentStep]);

    // Scroll chat to bottom on update
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationHistory]);

    // Close multiselect dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (multiSelectContainerRef.current && !multiSelectContainerRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Input Rendering Logic ---
    const renderInputField = useCallback(() => {
        // ... (bez zmian w stosunku do poprzedniej wersji - renderowanie inputów jest poprawne) ...
        if (!currentStep || searchComplete || isSearching) return null;

        const commonInputClass = `w-full px-4 py-3 rounded-lg border ${
            validationError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`;

        const handleInputChange = (e) => setCurrentValue(e.target.value);
        const handleCheckboxChange = (optionValue) => {
            setCurrentMultiSelection(prev =>
                prev.includes(optionValue)
                    ? prev.filter(item => item !== optionValue)
                    : [...prev, optionValue]
            );
        };

        switch (currentStep.inputType) {
            case 'select': // Single choice select
                return (
                    <div className="space-y-2 mt-3">
                        {currentStep.options?.map((option) => {
                            const isSelected = String(currentValue) === String(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button" // Important for accessibility and preventing form submission
                                    onClick={() => handleSelectOption(option.value)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border ${
                                        isSelected
                                            ? 'bg-blue-100 border-blue-400 ring-1 ring-blue-400' // Enhanced selected style
                                            : 'hover:bg-gray-50 border-gray-300'
                                    } transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                );

            case 'multiselect-brand':
            case 'multiselect-bodytype':
                return (
                    <div className="relative mt-3" ref={multiSelectContainerRef}>
                        {/* Button to toggle dropdown */}
                        <button
                            type="button"
                            onClick={() => setShowDropdown(!showDropdown)}
                            className={`${commonInputClass} text-left flex justify-between items-center`}
                            aria-haspopup="listbox"
                            aria-expanded={showDropdown}
                        >
                            <span className="truncate pr-2 text-gray-700">
                                {currentMultiSelection.length > 0
                                    ? currentMultiSelection.map(val => currentStep.options?.find(opt => opt.value === val)?.label || val).join(', ') // Show labels
                                    : `Wybierz ${currentStep.inputType === 'multiselect-brand' ? 'marki' : 'typy nadwozia'}...`}
                            </span>
                            <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        {/* Dropdown List */}
                        {showDropdown && (
                            <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl">
                                {currentStep.options?.map((option) => (
                                    <label key={option.value} className="flex items-center px-4 py-2.5 hover:bg-gray-100 cursor-pointer text-sm text-gray-800">
                                        <input
                                            type="checkbox"
                                            value={option.value} // Assign value for potential form handling
                                            checked={currentMultiSelection.includes(option.value)}
                                            onChange={() => handleCheckboxChange(option.value)}
                                            className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-1 focus:ring-offset-0"
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'price':
                return (
                    <div className="relative mt-3">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">zł</span>
                        <input
                            type="number"
                            value={currentValue}
                            onChange={handleInputChange}
                            placeholder={currentStep.hint || "Np. 50000"}
                            min="0"
                            step="100"
                            className={`${commonInputClass} pl-8`}
                        />
                    </div>
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
                        className={`${commonInputClass} mt-3`}
                    />
                );
            case 'mileage':
                return (
                    <div className="relative mt-3">
                        <input
                            type="number"
                            value={currentValue}
                            onChange={handleInputChange}
                            placeholder={currentStep.hint || "Np. 100000"}
                            min="0"
                            step="1000"
                            className={`${commonInputClass} pr-12`}
                        />
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">km</span>
                    </div>
                );
            case 'text':
            default:
                return (
                    <input
                        type="text"
                        value={currentValue}
                        onChange={handleInputChange}
                        placeholder={currentStep.hint || "Wpisz odpowiedź..."}
                        className={`${commonInputClass} mt-3`}
                    />
                );
        }
    }, [currentStep, currentValue, currentMultiSelection, validationError, searchComplete, isSearching, showDropdown]);

    // --- Step Progression Logic ---
    const proceedToNextStep = useCallback((currentResponses) => {
        if (currentStepId === null) return;
        // ### POPRAWKA WYWOŁANIA: Używamy 'getNextStep' ###
        const nextStepResult = getNextStep(currentResponses);

        if (nextStepResult) {
            setCurrentStepId(nextStepResult.id);
            // Check if the step has a label before adding to history
            if(nextStepResult.label){
                 setConversationHistory(prev => [...prev, { type: 'advisor', text: nextStepResult.label }]);
            } else {
                 console.warn(`Step with ID ${nextStepResult.id} is missing a label.`);
            }
        } else {
            setCurrentStepId(null); // End of questions
            setConversationHistory(prev => [...prev, { type: 'advisor', text: 'Dziękuję! Zebrałem wszystkie potrzebne informacje. Poniżej znajdziesz podsumowanie. Możesz je przejrzeć i rozpocząć wyszukiwanie.' }]);
        }
    }, [currentStepId]); // Now depends only on currentStepId

    // --- Response Handling ---

    const validateInput = useCallback((value, step) => {
        // ... (bez zmian w stosunku do poprzedniej wersji - walidacja jest poprawna) ...
        if (!step) return true;

        if (step.required) {
            if (step.inputType?.startsWith('multiselect')) {
                if (!value || !Array.isArray(value) || value.length === 0) {
                    setValidationError('Proszę wybrać przynajmniej jedną opcję.');
                    return false;
                }
            } else if (value === undefined || value === null || String(value).trim() === '') {
                setValidationError('To pole jest wymagane.');
                return false;
            }
        }

        if (value !== undefined && value !== null && String(value).trim() !== '') {
            if (step.inputType === 'price') {
                const priceNum = Number(value);
                if (isNaN(priceNum) || priceNum <= 0) {
                    setValidationError('Proszę podać poprawną, dodatnią cenę.');
                    return false;
                }
            }
            if (step.inputType === 'year') {
                const yearNum = Number(value);
                const maxYear = new Date().getFullYear() + 1;
                if (isNaN(yearNum) || yearNum < 1900 || yearNum > maxYear) {
                    setValidationError(`Proszę podać poprawny rok (między 1900 a ${maxYear}).`);
                    return false;
                }
            }
            if (step.inputType === 'mileage') {
                 const mileageNum = Number(value);
                if (isNaN(mileageNum) || mileageNum < 0) {
                    setValidationError('Proszę podać poprawny, nieujemny przebieg.');
                    return false;
                }
            }
        }

        setValidationError('');
        return true;
    }, []);

    const getDisplayValue = useCallback((value, step) => {
        // ... (bez zmian w stosunku do poprzedniej wersji - formatowanie jest poprawne) ...
         if (!step) return String(value ?? '');

        if (step.inputType === 'select' && step.options) {
            const selectedOption = step.options.find(opt => String(opt.value) === String(value));
            return selectedOption?.label || String(value ?? '');
        } else if (step.inputType === 'price' && (value !== null && value !== undefined && value !== '')) {
            return !isNaN(Number(value)) ? formatPrice(Number(value)) : String(value);
        } else if (step.inputType === 'mileage' && (value !== null && value !== undefined && value !== '')) {
            return !isNaN(Number(value)) ? formatMileage(Number(value)) : String(value);
        } else if (step.inputType?.startsWith('multiselect') && Array.isArray(value)) {
             const labels = value
                .map(val => step.options?.find(opt => opt.value === val)?.label || val)
                .join(', ');
             return labels.length > 0 ? labels : 'Nie wybrano';
        }
        return String(value ?? '');
    }, []);

    const handleFormSubmit = useCallback((e) => {
        e.preventDefault();
        if (!currentStep || currentStep.inputType?.startsWith('multiselect') || currentStep.inputType === 'select') return;
        if (!validateInput(currentValue, currentStep)) return;

        const displayValue = getDisplayValue(currentValue, currentStep);
        setConversationHistory(prev => [...prev, { type: 'user', text: displayValue }]);
        const updatedResponses = { ...responses, [currentStep.id]: currentValue };
        setResponses(updatedResponses);
        proceedToNextStep(updatedResponses);
    }, [currentStep, currentValue, responses, proceedToNextStep, validateInput, getDisplayValue]);

    const handleMultiSelectSubmit = useCallback(() => {
        if (!currentStep || !currentStep.inputType?.startsWith('multiselect')) return;
        if (!validateInput(currentMultiSelection, currentStep)) return;

        const displayValue = getDisplayValue(currentMultiSelection, currentStep);
        setConversationHistory(prev => [...prev, { type: 'user', text: displayValue }]);
        const updatedResponses = { ...responses, [currentStep.id]: currentMultiSelection };
        setResponses(updatedResponses);
        setShowDropdown(false);
        proceedToNextStep(updatedResponses);
    }, [currentStep, currentMultiSelection, responses, proceedToNextStep, validateInput, getDisplayValue]);

    const handleSelectOption = useCallback((selectedValue) => {
        if (!currentStep || currentStep.inputType !== 'select') return;
        setCurrentValue(String(selectedValue));
        const displayValue = getDisplayValue(selectedValue, currentStep);
        setConversationHistory(prev => [...prev, { type: 'user', text: displayValue }]);
        const updatedResponses = { ...responses, [currentStep.id]: selectedValue };
        setResponses(updatedResponses);
        proceedToNextStep(updatedResponses);
    }, [currentStep, responses, proceedToNextStep, getDisplayValue]);

    const handleSkip = useCallback(() => {
        if (!currentStep || currentStep.required) return;
        const displayValue = '(Pominięto)';
        setConversationHistory(prev => [...prev, { type: 'user', text: displayValue }]);
        const skippedValue = currentStep.inputType?.startsWith('multiselect') ? [] : null;
        const updatedResponses = { ...responses, [currentStep.id]: skippedValue };
        setResponses(updatedResponses);
        proceedToNextStep(updatedResponses);
    }, [currentStep, responses, proceedToNextStep]);


    // --- Search Logic ---
    const startSearch = useCallback(async () => {
        // ... (bez zmian w logice wyszukiwania - jest poprawna) ...
        setIsSearching(true);
        setSearchComplete(false);
        setSearchError(null);
        setConversationHistory(prev => [...prev, { type: 'advisor', text: 'Rozpoczynam wyszukiwanie najlepszych ofert...' }]);

        try {
            const searchParams = buildSearchParams(responses);
            console.log('Starting search with params:', searchParams);

            let carsQueryRef = collection(db, 'cars');
            let queryConstraints = [];

            if (searchParams.brands?.length > 0) {
                queryConstraints.push(where('brand', 'in', searchParams.brands.slice(0, 30)));
            }
            if (searchParams.bodyTypes?.length > 0) {
                 const normalizedBodyTypes = searchParams.bodyTypes.map(bt => typeof bt === 'string' ? bt.toLowerCase().replace(/\s+/g, '-') : bt);
                const validBodyTypes = normalizedBodyTypes.filter(bt => typeof bt === 'string' && bt.length > 0);
                if (validBodyTypes.length > 0) {
                     queryConstraints.push(where('bodyType', 'in', validBodyTypes.slice(0, 30)));
                }
            }
            if (searchParams.fuelTypes?.length > 0) {
                 const validFuelTypes = searchParams.fuelTypes.filter(ft => ft !== 'any');
                 if (validFuelTypes.length > 0) {
                    queryConstraints.push(where('fuelType', 'in', validFuelTypes));
                 }
            }
            if (searchParams.transmission && searchParams.transmission !== 'any') {
                const transmissionNormalized = searchParams.transmission === 'manual' ? 'Manualna' : (searchParams.transmission === 'automatic' ? 'Automatyczna' : searchParams.transmission);
                queryConstraints.push(where('transmission', '==', transmissionNormalized));
            }
            if (searchParams.minYear) {
                queryConstraints.push(where('year', '>=', Number(searchParams.minYear)));
            }
            if (searchParams.maxPrice) {
                queryConstraints.push(where('price', '<=', Number(searchParams.maxPrice)));
            }
            if (searchParams.maxMileage) {
                queryConstraints.push(where('mileage', '<=', Number(searchParams.maxMileage)));
            }

            queryConstraints.push(limit(50));

            const finalQuery = query(carsQueryRef, ...queryConstraints);
            const querySnapshot = await getDocs(finalQuery);

            const cars = [];
            querySnapshot.forEach((doc) => {
                if (doc.exists()) {
                    const carData = { id: doc.id, ...doc.data() };
                    const { score, matchedFields } = scoreListing(carData, responses);
                    if (score > 10) {
                        cars.push({ ...carData, score, matchedFields });
                    }
                }
            });

            cars.sort((a, b) => b.score - a.score);
            const topResults = cars.slice(0, 10);

            setSearchResults(topResults);
            setSearchComplete(true);
            setConversationHistory(prev => [...prev, { type: 'advisor', text: `Znalazłem ${topResults.length} najlepiej pasujących ofert.` }]);

        } catch (error) {
            console.error('Search Error:', error);
            setSearchError(`Wystąpił błąd podczas wyszukiwania: ${error.message}`);
            setConversationHistory(prev => [...prev, { type: 'advisor', text: 'Przepraszam, wystąpił błąd podczas wyszukiwania.' }]);
        } finally {
            setIsSearching(false);
        }
    }, [responses]);

    // --- Helper Functions ---

    const getMatchedFieldsDescription = useCallback((matchedFields) => {
        // ... (bez zmian) ...
        const fieldNames = {
            'brand': 'marka', 'bodyType': 'nadwozie', 'price': 'cena',
            'year': 'rocznik', 'mileage': 'przebieg', 'fuelType': 'paliwo',
            'transmission': 'skrzynia', 'suggestedBodyType': 'suger. nadwozie'
        };
        if (!Array.isArray(matchedFields)) return 'brak';
        return matchedFields.map(field => fieldNames[field] || field).join(', ') || 'brak';
    }, []);

    // --- Reset Logic ---
    const resetAdvisor = useCallback(() => {
        // ... (bez zmian) ...
        setResponses({});
        setCurrentStepId(chatSteps[0]?.id);
        setCurrentValue('');
        setCurrentMultiSelection([]);
        setValidationError('');
        setConversationHistory(chatSteps[0] ? [{ type: 'advisor', text: chatSteps[0].label }] : []);
        setSearchResults([]);
        setIsSearching(false);
        setSearchError(null);
        setSearchComplete(false);
        setShowDropdown(false);
    }, []);

    // --- Render Summary ---
    // Używamy poprawionej wersji z poprzedniego kroku
    const renderSummary = useCallback(() => {
        // ... (bez zmian - używamy wersji z poprzedniej odpowiedzi, która jest poprawna) ...
        if (currentStepId !== null || isSearching || searchComplete) return null;

        const stepsToShow = chatSteps.filter(step => {
            const value = responses[step.id];
            return value !== undefined; // Show if any response exists (even null/[])
        });

        return (
            <div className="bg-white rounded-lg shadow-md p-6 my-6 border border-gray-200">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Twoje preferencje:</h2>
                <ul className="space-y-3 mb-6">
                    {stepsToShow.length > 0 ? (
                        stepsToShow.map((step) => {
                            const value = responses[step.id];
                            const displayValue = getDisplayValue(value, step);
                            const wasSkipped = step.required === false && (value === null || (Array.isArray(value) && value.length === 0));
                            const finalDisplay = wasSkipped
                                                    ? <span className="text-gray-500 italic">(Pominięto)</span>
                                                    : displayValue;

                            return (
                                <li key={step.id} className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-b-0">
                                    <div>
                                        <span className="text-sm text-gray-500">{step.label}</span>
                                        <p className="font-medium text-gray-700 break-words">{finalDisplay}</p>
                                    </div>
                                </li>
                            );
                        })
                    ) : (
                        <li className="text-sm text-gray-500 italic">Nie podano żadnych preferencji lub pominięto wszystkie kroki.</li>
                    )}
                </ul>
                <button
                    onClick={startSearch}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={isSearching}
                >
                    {isSearching ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Szukam...
                        </span>
                    ) : 'Rozpocznij wyszukiwanie'}
                </button>
            </div>
        );
    }, [currentStepId, isSearching, searchComplete, responses, getDisplayValue, startSearch]); // Dependencies for renderSummary


    // --- Main Render ---
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">VehicAI Advisor Pro</h1>
                <p className="text-gray-600 mb-4 text-center">
                    Odpowiedz na kilka pytań, aby znaleźć idealny samochód.
                </p>

                {/* Progress Indicator */}
                {currentStep && !searchComplete && (
                    <div className="mb-4 px-1">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Krok {currentStepIndex >= 0 ? currentStepIndex + 1 : 1} z {totalSteps}</span> {/* Handle index -1 */}
                            <span>{currentStepIndex >= 0 ? Math.round(((currentStepIndex) / totalSteps) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${currentStepIndex >= 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-6">
                    {/* Conversation History */}
                    <div className="space-y-4 mb-6 max-h-[50vh] min-h-[200px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                        {conversationHistory.map((item, index) => (
                            <div key={index} className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2 rounded-xl max-w-[85%] shadow-sm ${item.type === 'user' ? 'bg-indigo-100 text-indigo-900' : 'bg-blue-50 text-blue-900'}`}>
                                    {item.text}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area for Current Step */}
                    {!isSearching && !searchComplete && currentStep && (
                        <form onSubmit={handleFormSubmit} className="border-t border-gray-100 pt-4">
                            {renderInputField()}
                            {validationError && <p className="text-red-600 text-sm mt-2 px-1">{validationError}</p>}
                            <div className="flex flex-wrap justify-start gap-3 mt-4">
                                {/* Action Buttons */}
                                {currentStep.inputType !== 'select' && !currentStep.inputType?.startsWith('multiselect') && (
                                    <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50" disabled={isSearching}>
                                        Dalej
                                    </button>
                                )}
                                {currentStep.inputType?.startsWith('multiselect') && (
                                    <button type="button" onClick={handleMultiSelectSubmit} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50" disabled={isSearching}>
                                        Potwierdź wybór
                                    </button>
                                )}
                                {currentStep && !currentStep.required && (
                                    <button type="button" onClick={handleSkip} className="px-5 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:opacity-50" disabled={isSearching}>
                                        Pomiń
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {/* Loading indicator */}
                    {isSearching && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                            <p className="text-sm text-gray-600">Szukam najlepszych ofert...</p>
                        </div>
                    )}
                </div>

                {/* Summary Section */}
                {renderSummary()}

                {/* Search Results Section */}
                {searchComplete && (
                     <div className="mt-8">
                        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
                            {searchResults.length > 0 ? `Znalezione oferty (${searchResults.length})` : 'Nie znaleziono pasujących ofert'}
                        </h2>
                        {searchError && <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-md mb-4 text-sm">{searchError}</div>}
                        {searchResults.length === 0 && !searchError && (
                            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-3 rounded-md mb-4 text-sm text-center">
                                Spróbuj zmodyfikować swoje preferencje lub rozpocznij nowe wyszukiwanie.
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                            {searchResults.map((car) => (
                                <div key={car.id} className="border border-gray-200 bg-white rounded-lg overflow-hidden shadow-sm transition-shadow hover:shadow-md flex flex-col">
                                    <CarCard listing={car} />
                                    <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200 mt-auto">
                                        <p className="text-sm font-medium text-blue-800">
                                            Dopasowanie: {car.score}%
                                        </p>
                                        {car.matchedFields?.length > 0 && (
                                            <p className="text-xs text-indigo-700 mt-1 overflow-hidden text-ellipsis whitespace-nowrap" title={getMatchedFieldsDescription(car.matchedFields)}>
                                                Zgodne: {getMatchedFieldsDescription(car.matchedFields)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={resetAdvisor} className="px-6 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition duration-150 mx-auto block focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                            Rozpocznij nowe wyszukiwanie
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvisorPro;