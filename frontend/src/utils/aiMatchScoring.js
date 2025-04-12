/**
 * Ocenia dopasowanie ogłoszenia do zapytania użytkownika
 * Zwraca wynik w skali 0-100
 * 
 * @param {Object} listing - Obiekt ogłoszenia z bazy danych
 * @param {Object} extractedKeywords - Obiekt zawierający słowa kluczowe wyekstrahowane z zapytania użytkownika
 * @return {Number} - Wynik dopasowania (0-100)
 */
export const scoreCarListing = (listing, extractedKeywords) => {
    // Jeśli któryś z parametrów jest nieprawidłowy, zwracamy 0
    if (!listing || !extractedKeywords) return 0;
  
    // Inicjalizacja wyniku
    let score = 0;
    // Licznik dopasowanych pól
    let matchedFields = 0;
    // Maksymalna możliwa liczba punktów
    let maxPoints = 0;
  
    // Pobieramy priorytety jako obiekt dla szybszego dostępu
    const priorityMap = {};
    if (extractedKeywords.priorities && Array.isArray(extractedKeywords.priorities)) {
      extractedKeywords.priorities.forEach(priority => {
        if (priority.field && priority.level) {
          priorityMap[priority.field] = priority.level;
        }
      });
    }
  
    // 1. Sprawdzenie marki
    if (extractedKeywords.brands && extractedKeywords.brands.length > 0) {
      maxPoints += 15;
      const brandMatch = extractedKeywords.brands.some(brand => 
        listing.brand && listing.brand.toLowerCase() === brand.toLowerCase()
      );
      
      if (brandMatch) {
        score += 15;
        matchedFields++;
        
        // Dodatkowe punkty za priorytet
        if (priorityMap.brand === 'high') {
          score += 25;
        }
      } else if (priorityMap.brand === 'high') {
        // Kara za niespełnienie wysokiego priorytetu
        score -= 25;
      }
    }
  
    // 2. Sprawdzenie typu nadwozia
    if (extractedKeywords.bodyTypes && extractedKeywords.bodyTypes.length > 0) {
      maxPoints += 15;
      const bodyTypeMatch = extractedKeywords.bodyTypes.some(bodyType => 
        listing.bodyType && listing.bodyType.toLowerCase() === bodyType.toLowerCase()
      );
      
      if (bodyTypeMatch) {
        score += 15;
        matchedFields++;
        
        if (priorityMap.bodyType === 'high') {
          score += 25;
        }
      } else if (priorityMap.bodyType === 'high') {
        score -= 25;
      }
    }
  
    // 3. Sprawdzenie typu paliwa
    if (extractedKeywords.fuelTypes && extractedKeywords.fuelTypes.length > 0) {
      maxPoints += 15;
      const fuelTypeMatch = extractedKeywords.fuelTypes.some(fuelType => 
        listing.fuelType && listing.fuelType.toLowerCase() === fuelType.toLowerCase()
      );
      
      if (fuelTypeMatch) {
        score += 15;
        matchedFields++;
        
        if (priorityMap.fuelType === 'high') {
          score += 25;
        }
      } else if (priorityMap.fuelType === 'high') {
        score -= 25;
      }
    }
  
    // 4. Sprawdzenie skrzyni biegów
    if (extractedKeywords.transmission) {
      maxPoints += 15;
      const transmissionMatch = listing.transmission && 
        listing.transmission.toLowerCase() === extractedKeywords.transmission.toLowerCase();
      
      if (transmissionMatch) {
        score += 15;
        matchedFields++;
        
        if (priorityMap.transmission === 'high') {
          score += 25;
        }
      } else if (priorityMap.transmission === 'high') {
        score -= 25;
      }
    }
  
    // 5. Sprawdzenie rocznika
    if (extractedKeywords.minYear || extractedKeywords.maxYear) {
      maxPoints += 15;
      let yearMatch = true;
      
      if (extractedKeywords.minYear && listing.year) {
        yearMatch = yearMatch && (listing.year >= extractedKeywords.minYear);
      }
      
      if (extractedKeywords.maxYear && listing.year) {
        yearMatch = yearMatch && (listing.year <= extractedKeywords.maxYear);
      }
      
      if (yearMatch) {
        score += 15;
        matchedFields++;
        
        if (priorityMap.year === 'high') {
          score += 25;
        }
      } else if (priorityMap.year === 'high') {
        score -= 25;
      }
    }
  
    // 6. Sprawdzenie przebiegu
    if (extractedKeywords.minMileage || extractedKeywords.maxMileage) {
      maxPoints += 15;
      let mileageMatch = true;
      
      if (extractedKeywords.minMileage && listing.mileage) {
        mileageMatch = mileageMatch && (listing.mileage >= extractedKeywords.minMileage);
      }
      
      if (extractedKeywords.maxMileage && listing.mileage) {
        mileageMatch = mileageMatch && (listing.mileage <= extractedKeywords.maxMileage);
      }
      
      if (mileageMatch) {
        score += 15;
        matchedFields++;
        
        if (priorityMap.mileage === 'high') {
          score += 25;
        }
      } else if (priorityMap.mileage === 'high') {
        score -= 25;
      }
    }
  
    // 7. Sprawdzenie ceny
    if (extractedKeywords.minPrice || extractedKeywords.maxPrice) {
      maxPoints += 15;
      let priceMatch = true;
      
      if (extractedKeywords.minPrice && listing.price) {
        priceMatch = priceMatch && (listing.price >= extractedKeywords.minPrice);
      }
      
      if (extractedKeywords.maxPrice && listing.price) {
        priceMatch = priceMatch && (listing.price <= extractedKeywords.maxPrice);
      }
      
      if (priceMatch) {
        score += 15;
        matchedFields++;
        
        if (priorityMap.price === 'high') {
          score += 25;
        }
      } else if (priorityMap.price === 'high') {
        score -= 25;
      }
    }
  
    // 8. Sprawdzenie koloru
    if (extractedKeywords.color) {
      maxPoints += 15;
      const colorMatch = listing.color && 
        listing.color.toLowerCase() === extractedKeywords.color.toLowerCase();
      
      if (colorMatch) {
        score += 15;
        matchedFields++;
        
        if (priorityMap.color === 'high') {
          score += 25;
        }
      } else if (priorityMap.color === 'high') {
        score -= 25;
      }
    }
  
    // Jeśli nie dopasowano żadnego pola, zwracamy 0
    if (matchedFields === 0) return 0;
    
    // Jeśli maxPoints == 0, to nie było żadnych wymagań w zapytaniu
    if (maxPoints === 0) return 50; // Zwracamy średni wynik
    
    // Normalizujemy wynik do skali 0-100
    // Ograniczamy wynik do minimalnej wartości 0
    score = Math.max(0, score);
    
    // Jeśli wynik przekracza 100, ograniczamy go
    score = Math.min(100, score);
    
    // Zaokrąglamy wynik do liczby całkowitej
    return Math.round(score);
  };