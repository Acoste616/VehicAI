import { chatSteps } from './chatSteps';

/**
 * Zwraca następny krok rozmowy na podstawie udzielonych odpowiedzi
 * @param {Object} responses - Obiekt zawierający dotychczasowe odpowiedzi (klucz: stepId, wartość: odpowiedź)
 * @returns {Object|null} - Następny krok lub null, jeśli wszystkie pytania zostały zadane
 */
export const getNextStep = (responses) => {
  if (!responses) return chatSteps[0];
  
  // Pobierz ID wszystkich kroków, na które udzielono odpowiedzi
  const answeredStepIds = Object.keys(responses);
  
  // Znajdź pierwszy krok, na który nie udzielono jeszcze odpowiedzi
  const nextStep = chatSteps.find(step => !answeredStepIds.includes(step.id));
  
  return nextStep || null;
};

/**
 * Konwertuje odpowiedzi użytkownika na parametry zapytania do Firestore
 * @param {Object} responses - Obiekt zawierający odpowiedzi użytkownika
 * @returns {Object} - Obiekt z parametrami do zapytania Firestore
 */
export const buildSearchParams = (responses) => {
  if (!responses) return {};
  
  const searchParams = {};
  
  // Mapowanie ID kroków na nazwy parametrów w Firestore
  const paramsMapping = {
    'budget': 'maxPrice',
    'brand': 'brands',
    'bodyType': 'bodyTypes',
    'minYear': 'minYear',
    'maxMileage': 'maxMileage',
    'fuelType': 'fuelTypes',
    'transmission': 'transmission'
  };
  
  // Iteracja po wszystkich odpowiedziach
  Object.entries(responses).forEach(([stepId, value]) => {
    // Jeśli istnieje mapowanie dla tego kroku
    if (paramsMapping[stepId]) {
      const paramName = paramsMapping[stepId];
      
      // Specjalne przetwarzanie dla określonych kroków
      switch (stepId) {
        case 'budget':
          // Konwersja na liczbę i zapisanie jako maxPrice
          searchParams[paramName] = Number(value);
          break;
        
        case 'minYear':
          // Konwersja na liczbę i zapisanie jako minYear
          searchParams[paramName] = Number(value);
          break;
        
        case 'maxMileage':
          // Konwersja na liczbę i zapisanie jako maxMileage
          searchParams[paramName] = Number(value);
          break;
        
        case 'brand':
          // Jeśli wybrano konkretną markę (nie 'any' lub 'other')
          if (value !== 'any' && value !== 'other') {
            searchParams[paramName] = [value];
          }
          break;
        
        case 'bodyType':
          // Jeśli wybrano konkretny typ nadwozia (nie 'any')
          if (value !== 'any') {
            searchParams[paramName] = [value];
          }
          break;
        
        case 'fuelType':
          // Jeśli wybrano konkretny rodzaj paliwa (nie 'any')
          if (value !== 'any') {
            searchParams[paramName] = [value];
          }
          break;
        
        case 'transmission':
          // Jeśli wybrano konkretną skrzynię biegów (nie 'any')
          if (value !== 'any') {
            searchParams[paramName] = value;
          }
          break;
        
        default:
          // Dla pozostałych parametrów, przypisz wartość bez zmian
          searchParams[paramName] = value;
      }
    }
    
    // Dodatkowa logika dla priorytetu (zapisujemy na potrzeby scoringu)
    if (stepId === 'priority') {
      searchParams.priority = value;
    }
    
    // Dodatkowa logika dla celu zakupu (może wpływać na suggested bodyTypes)
    if (stepId === 'purpose') {
      searchParams.purpose = value;
      
      // Dodajemy sugerowane typy nadwozia na podstawie celu, jeśli nie została wybrana
      if (!searchParams.bodyTypes) {
        switch (value) {
          case 'family':
            searchParams.suggestedBodyTypes = ['kombi', 'van', 'suv'];
            break;
          case 'business':
            searchParams.suggestedBodyTypes = ['sedan', 'kombi'];
            break;
          case 'sport':
            searchParams.suggestedBodyTypes = ['coupe', 'kabriolet'];
            break;
          case 'offroad':
            searchParams.suggestedBodyTypes = ['suv', 'pickup'];
            break;
          case 'daily':
            searchParams.suggestedBodyTypes = ['hatchback', 'sedan', 'suv'];
            break;
          default:
            break;
        }
      }
    }
    
    // Dodatkowe informacje - zapisujemy pełny tekst
    if (stepId === 'additionalInfo' && value) {
      searchParams.additionalInfo = value;
    }
  });
  
  return searchParams;
};

/**
 * Oblicza scoring dopasowania ogłoszenia do preferencji użytkownika
 * @param {Object} listing - Obiekt ogłoszenia
 * @param {Object} responses - Obiekt zawierający odpowiedzi użytkownika
 * @returns {Object} - Obiekt zawierający wynik procentowy i listę dopasowanych pól
 */
export const scoreListing = (listing, responses) => {
  if (!listing || !responses) {
    return { score: 0, matchedFields: [] };
  }
  
  // Parametry wyszukiwania wygenerowane na podstawie odpowiedzi
  const searchParams = buildSearchParams(responses);
  
  // Wagi dla różnych kryteriów (łącznie 100%)
  const weights = {
    brand: 15,         // Marka
    bodyType: 15,       // Typ nadwozia
    price: 20,         // Cena
    year: 15,          // Rok produkcji
    mileage: 15,       // Przebieg
    fuelType: 10,      // Rodzaj paliwa
    transmission: 10   // Skrzynia biegów
  };
  
  // Priorytet użytkownika - zwiększamy wagę wybranego kryterium
  if (searchParams.priority) {
    const priorityMapping = {
      'price': 'price',
      'mileage': 'mileage',
      'year': 'year',
      'brand': 'brand',
      'fuelEconomy': 'fuelType', // Przybliżenie - ekonomia paliwa związana z typem paliwa
      'performance': 'brand',    // Przybliżenie - osiągi często związane z marką
      'comfort': 'bodyType',     // Przybliżenie - komfort często związany z typem nadwozia
      'reliability': 'brand',    // Przybliżenie - niezawodność często związana z marką
      'safety': 'year'           // Przybliżenie - nowsze auta zazwyczaj bezpieczniejsze
    };
    
    const priorityField = priorityMapping[searchParams.priority];
    
    if (priorityField && weights[priorityField]) {
      // Zwiększ wagę priorytetu o 15%, zmniejszając proporcjonalnie inne
      const extraWeight = 15;
      const originalWeight = weights[priorityField];
      const scaleFactor = (100 - originalWeight - extraWeight) / (100 - originalWeight);
      
      // Aktualizuj wszystkie wagi
      Object.keys(weights).forEach(key => {
        if (key === priorityField) {
          weights[key] += extraWeight;
        } else {
          weights[key] *= scaleFactor;
        }
      });
    }
  }
  
  let totalScore = 0;
  const matchedFields = [];
  
  // 1. Ocena dopasowania marki
  if (searchParams.brands && searchParams.brands.length > 0) {
    const brandMatch = searchParams.brands.some(brand => 
      listing.brand && listing.brand.toLowerCase() === brand.toLowerCase()
    );
    
    if (brandMatch) {
      totalScore += weights.brand;
      matchedFields.push('brand');
    }
  } else {
    // Jeśli użytkownik nie sprecyzował marki, dajemy pełne punkty
    totalScore += weights.brand;
  }
  
  // 2. Ocena dopasowania typu nadwozia
  if (searchParams.bodyTypes && searchParams.bodyTypes.length > 0) {
    const bodyTypeMatch = searchParams.bodyTypes.some(bodyType => 
      listing.bodyType && listing.bodyType.toLowerCase() === bodyType.toLowerCase()
    );
    
    if (bodyTypeMatch) {
      totalScore += weights.bodyType;
      matchedFields.push('bodyType');
    }
  } else if (searchParams.suggestedBodyTypes && searchParams.suggestedBodyTypes.length > 0) {
    // Jeśli użytkownik nie wybrał typu nadwozia, sprawdzamy sugestie na podstawie celu
    const suggestedBodyTypeMatch = searchParams.suggestedBodyTypes.some(bodyType => 
      listing.bodyType && listing.bodyType.toLowerCase() === bodyType.toLowerCase()
    );
    
    if (suggestedBodyTypeMatch) {
      totalScore += weights.bodyType * 0.8; // Dajemy mniej punktów za sugestie
      matchedFields.push('suggestedBodyType');
    }
  } else {
    // Jeśli użytkownik nie sprecyzował typu nadwozia, dajemy pełne punkty
    totalScore += weights.bodyType;
  }
  
  // 3. Ocena dopasowania ceny
  if (searchParams.maxPrice && listing.price) {
    if (listing.price <= searchParams.maxPrice) {
      // Dodatkowe punkty za cenę znacznie niższą od maksymalnej
      const priceRatio = listing.price / searchParams.maxPrice;
      let priceScore = weights.price;
      
      if (priceRatio < 0.8) {
        // Bonus za cenę niższą o więcej niż 20% od maksymalnej
        priceScore += (1 - priceRatio) * 10; // Max 10% dodatkowych punktów
      }
      
      totalScore += priceScore;
      matchedFields.push('price');
    }
  } else {
    // Jeśli użytkownik nie sprecyzował budżetu, dajemy pełne punkty
    totalScore += weights.price;
  }
  
  // 4. Ocena dopasowania roku produkcji
  if (searchParams.minYear && listing.year) {
    if (listing.year >= searchParams.minYear) {
      // Dodatkowe punkty za nowszy rocznik
      const yearDiff = listing.year - searchParams.minYear;
      let yearScore = weights.year;
      
      if (yearDiff > 0) {
        // Bonus za nowszy rocznik (max 5% dodatkowych punktów)
        yearScore += Math.min(yearDiff * 1, 5);
      }
      
      totalScore += yearScore;
      matchedFields.push('year');
    }
  } else {
    // Jeśli użytkownik nie sprecyzował roku, dajemy pełne punkty
    totalScore += weights.year;
  }
  
  // 5. Ocena dopasowania przebiegu
  if (searchParams.maxMileage && listing.mileage) {
    if (listing.mileage <= searchParams.maxMileage) {
      // Dodatkowe punkty za przebieg znacznie niższy od maksymalnego
      const mileageRatio = listing.mileage / searchParams.maxMileage;
      let mileageScore = weights.mileage;
      
      if (mileageRatio < 0.7) {
        // Bonus za przebieg niższy o więcej niż 30% od maksymalnego
        mileageScore += (1 - mileageRatio) * 10; // Max 10% dodatkowych punktów
      }
      
      totalScore += mileageScore;
      matchedFields.push('mileage');
    }
  } else {
    // Jeśli użytkownik nie sprecyzował przebiegu, dajemy pełne punkty
    totalScore += weights.mileage;
  }
  
  // 6. Ocena dopasowania rodzaju paliwa
  if (searchParams.fuelTypes && searchParams.fuelTypes.length > 0) {
    const fuelTypeMatch = searchParams.fuelTypes.some(fuelType => 
      listing.fuelType && listing.fuelType.toLowerCase() === fuelType.toLowerCase()
    );
    
    if (fuelTypeMatch) {
      totalScore += weights.fuelType;
      matchedFields.push('fuelType');
    }
  } else {
    // Jeśli użytkownik nie sprecyzował rodzaju paliwa, dajemy pełne punkty
    totalScore += weights.fuelType;
  }
  
  // 7. Ocena dopasowania skrzyni biegów
  if (searchParams.transmission) {
    const transmissionMatch = listing.transmission && 
      listing.transmission.toLowerCase() === searchParams.transmission.toLowerCase();
    
    if (transmissionMatch) {
      totalScore += weights.transmission;
      matchedFields.push('transmission');
    }
  } else {
    // Jeśli użytkownik nie sprecyzował skrzyni biegów, dajemy pełne punkty
    totalScore += weights.transmission;
  }
  
  // Zaokrąglamy wynik do liczby całkowitej
  const score = Math.round(totalScore);
  
  return {
    score,
    matchedFields
  };
};

/**
 * Konwertuje odpowiedzi z doradcy na tekst zapytania naturalnego
 * @param {Object} responses - Obiekt zawierający odpowiedzi użytkownika
 * @returns {String} - Zapytanie w języku naturalnym
 */
export const buildNaturalLanguageQuery = (responses) => {
  if (!responses) return '';
  
  const queryParts = [];
  
  // Przetwarzanie odpowiedzi na tekst zapytania
  if (responses.brand && responses.brand !== 'any' && responses.brand !== 'other') {
    queryParts.push(`marka: ${responses.brand}`);
  }
  
  if (responses.bodyType && responses.bodyType !== 'any') {
    queryParts.push(`nadwozie: ${responses.bodyType}`);
  }
  
  if (responses.budget) {
    queryParts.push(`do ${responses.budget} zł`);
  }
  
  if (responses.minYear) {
    queryParts.push(`od ${responses.minYear} roku`);
  }
  
  if (responses.maxMileage) {
    queryParts.push(`przebieg do ${responses.maxMileage} km`);
  }
  
  if (responses.fuelType && responses.fuelType !== 'any') {
    const fuelNames = {
      'petrol': 'benzyna',
      'diesel': 'diesel',
      'hybrid': 'hybryda',
      'electric': 'elektryczny',
      'lpg': 'LPG'
    };
    
    queryParts.push(`paliwo: ${fuelNames[responses.fuelType] || responses.fuelType}`);
  }
  
  if (responses.transmission && responses.transmission !== 'any') {
    const transmissionNames = {
      'manual': 'manualna',
      'automatic': 'automatyczna'
    };
    
    queryParts.push(`skrzynia: ${transmissionNames[responses.transmission] || responses.transmission}`);
  }
  
  // Dodaj priorytet jako element zapytania
  if (responses.priority) {
    const priorityTexts = {
      'price': 'najważniejsza niska cena',
      'mileage': 'najważniejszy niski przebieg',
      'year': 'najważniejszy nowszy rocznik',
      'brand': 'najważniejsza konkretna marka',
      'fuelEconomy': 'najważniejsze ekonomiczne spalanie',
      'performance': 'najważniejsze dobre osiągi',
      'comfort': 'najważniejszy komfort',
      'reliability': 'najważniejsza niezawodność',
      'safety': 'najważniejsze bezpieczeństwo'
    };
    
    if (priorityTexts[responses.priority]) {
      queryParts.push(priorityTexts[responses.priority]);
    }
  }
  
  // Dodaj informacje o celu, jeśli są dostępne
  if (responses.purpose) {
    const purposeTexts = {
      'family': 'dla rodziny',
      'daily': 'do codziennej jazdy',
      'business': 'do celów służbowych',
      'sport': 'sportowy',
      'offroad': 'terenowy'
    };
    
    if (purposeTexts[responses.purpose]) {
      queryParts.push(purposeTexts[responses.purpose]);
    }
  }
  
  // Dodaj ewentualne dodatkowe informacje
  if (responses.additionalInfo) {
    queryParts.push(responses.additionalInfo);
  }
  
  // Połącz wszystkie części zapytania
  return queryParts.join(', ');
};

export default {
  getNextStep,
  buildSearchParams,
  scoreListing,
  buildNaturalLanguageQuery
};