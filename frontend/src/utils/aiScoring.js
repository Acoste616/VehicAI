// Funkcja extractKeywords analizuje zapytanie użytkownika i wyodrębnia słowa kluczowe oraz intencje
export const extractKeywords = (query) => {
    // Normalizacja zapytania - zamiana na małe litery, usunięcie znaków specjalnych
    const normalizedQuery = query.toLowerCase().trim();
    
    // Obiekt wynikowy zawierający wszystkie wyekstrahowane filtry
    const result = {
      brands: [],
      bodyTypes: [],
      fuelTypes: [],
      transmission: null,
      minYear: null,
      maxYear: null,
      minPrice: null,
      maxPrice: null,
      minMileage: null,
      maxMileage: null,
      color: null,
      priorities: [],
      userIntent: []
    };
  
    // Słowniki - listy marek, typów nadwozia, kolorów, rodzajów paliwa wraz z synonimami
    const brandDictionary = {
      'audi': 'Audi',
      'bmw': 'BMW',
      'mercedes': 'Mercedes-Benz',
      'mercedes benz': 'Mercedes-Benz',
      'mercedes-benz': 'Mercedes-Benz',
      'vw': 'Volkswagen',
      'volkswagen': 'Volkswagen',
      'toyota': 'Toyota',
      'honda': 'Honda',
      'mazda': 'Mazda',
      'ford': 'Ford',
      'opel': 'Opel',
      'skoda': 'Skoda',
      'peugeot': 'Peugeot',
      'renault': 'Renault',
      'citroen': 'Citroen',
      'hyundai': 'Hyundai',
      'kia': 'Kia',
      'nissan': 'Nissan',
      'fiat': 'Fiat',
      'seat': 'Seat',
      'dacia': 'Dacia',
      'volvo': 'Volvo',
      'mitsubishi': 'Mitsubishi',
      'suzuki': 'Suzuki',
      'lexus': 'Lexus',
      'jeep': 'Jeep',
      'subaru': 'Subaru',
      'porsche': 'Porsche',
      'tesla': 'Tesla',
      'alfa romeo': 'Alfa Romeo',
      'alfa': 'Alfa Romeo',
      'jaguar': 'Jaguar',
      'land rover': 'Land Rover',
      'mini': 'Mini',
      'smart': 'Smart',
      'chevrolet': 'Chevrolet',
      'infiniti': 'Infiniti',
      'dodge': 'Dodge',
      'chrysler': 'Chrysler'
    };
  
    const bodyTypeDictionary = {
      // Podstawowe typy nadwozia
      'sedan': 'sedan',
      'limuzyna': 'sedan',
      'hatchback': 'hatchback',
      'kompakt': 'hatchback',
      'mały': 'hatchback',
      'kombi': 'kombi',
      'uniwersal': 'kombi',
      'universal': 'kombi',
      'station wagon': 'kombi',
      'suv': 'suv',
      'terenowy': 'suv',
      'terenówka': 'suv',
      'krosover': 'suv',
      'crossover': 'suv',
      'coupe': 'coupe',
      'kabriolet': 'kabriolet',
      'cabrio': 'kabriolet',
      'convertible': 'kabriolet',
      'van': 'van',
      'minivan': 'van',
      'mpv': 'van',
      'pickup': 'pickup',
      'dostawczy': 'dostawczy',
      'furgon': 'dostawczy',
      'duży': 'suv' // Dodatkowy synonim - duży często oznacza SUV
    };
  
    const fuelTypeDictionary = {
      'benzyna': 'petrol',
      'pb': 'petrol',
      'pb95': 'petrol',
      'pb98': 'petrol',
      'petrol': 'petrol',
      'diesel': 'diesel',
      'on': 'diesel',
      'olej napędowy': 'diesel',
      'lpg': 'lpg',
      'gaz': 'lpg',
      'hybrydowy': 'hybrid',
      'hybryda': 'hybrid',
      'hybrid': 'hybrid',
      'elektryczny': 'electric',
      'ev': 'electric',
      'electric': 'electric',
      'wodorowy': 'hydrogen',
      'wodór': 'hydrogen',
      'hydrogen': 'hydrogen'
    };
  
    const transmissionDictionary = {
      'automat': 'automatic',
      'automatyczna': 'automatic',
      'skrzynia automatyczna': 'automatic',
      'automatic': 'automatic',
      'dsg': 'automatic',
      'dwusprzęgłowa': 'automatic',
      'tiptronic': 'automatic',
      'bezstopniowa': 'automatic',
      'cvt': 'automatic',
      'manual': 'manual',
      'manualna': 'manual',
      'ręczna': 'manual'
    };
  
    const colorDictionary = {
      'czarny': 'black',
      'czarna': 'black',
      'black': 'black',
      'biały': 'white',
      'biała': 'white',
      'white': 'white',
      'czerwony': 'red',
      'czerwona': 'red',
      'red': 'red',
      'niebieski': 'blue',
      'niebieska': 'blue',
      'blue': 'blue',
      'srebrny': 'silver',
      'srebrna': 'silver',
      'silver': 'silver',
      'szary': 'gray',
      'szara': 'gray',
      'gray': 'gray',
      'grey': 'gray',
      'zielony': 'green',
      'zielona': 'green',
      'green': 'green',
      'żółty': 'yellow',
      'żółta': 'yellow',
      'yellow': 'yellow',
      'brązowy': 'brown',
      'brązowa': 'brown',
      'brown': 'brown',
      'złoty': 'gold',
      'złota': 'gold',
      'gold': 'gold',
      'pomarańczowy': 'orange',
      'pomarańczowa': 'orange',
      'orange': 'orange'
    };
  
    // Słownik intencji użytkownika
    const intentDictionary = [
      {
        patterns: ['rodzin', 'dzieci', 'dziecko', '5 osób', 'przestronne', 'rodzinny', 'dla rodziny'],
        intent: 'rodzinny',
        filters: { bodyTypes: ['kombi', 'van', 'suv'] }
      },
      {
        patterns: ['student', 'tani', 'ekonomiczny', 'oszczędny', 'mało pali', 'niskie spalanie'],
        intent: 'ekonomiczny',
        filters: { maxPrice: 30000, bodyTypes: ['hatchback', 'sedan'] }
      },
      {
        patterns: ['sportowy', 'szybki', 'dynamiczny', 'osiągi', 'wrażenia', 'mocny', 'adrenalin'],
        intent: 'sportowy',
        filters: { bodyTypes: ['coupe', 'sedan'], minYear: 2015 }
      },
      {
        patterns: ['młody', 'początkujący', 'pierwszy', 'kierowca', 'małe auto', 'łatwy'],
        intent: 'dla początkującego',
        filters: { bodyTypes: ['hatchback'], maxPrice: 25000 }
      },
      {
        patterns: ['biznes', 'biznesowy', 'prestiż', 'prestiżowy', 'elegancki', 'luksusowy', 'premium'],
        intent: 'premium/biznesowy',
        filters: { brands: ['Audi', 'BMW', 'Mercedes-Benz', 'Volvo', 'Lexus'], bodyTypes: ['sedan', 'suv'] }
      },
      {
        patterns: ['off-road', 'offroad', 'terenowy', 'bezdroża', 'wyjazdy', 'góry', '4x4', 'awd'],
        intent: 'terenowy',
        filters: { bodyTypes: ['suv', 'pickup'] }
      },
      {
        patterns: ['miasto', 'miejski', 'miejskie', 'parkowanie', 'małe'],
        intent: 'miejski',
        filters: { bodyTypes: ['hatchback'] }
      }
    ];
  
    // Lista słów wskazujących na priorytety
    const priorityPatterns = [
      {
        keywords: ['najważniejszy', 'najważniejsza', 'najważniejsze', 'kluczowy', 'priorytet', 'zależy mi na', 'głównie', 'przede wszystkim'],
        priority: 'high'
      },
      {
        keywords: ['ważny', 'ważna', 'ważne', 'istotny', 'istotna', 'istotne'],
        priority: 'medium'
      },
      {
        keywords: ['może być', 'ewentualnie', 'opcjonalnie', 'dobrze by było'],
        priority: 'low'
      }
    ];
  
    // Szukanie marek
    Object.keys(brandDictionary).forEach(brand => {
      const pattern = new RegExp(`\\b${brand}\\b`, 'i');
      if (pattern.test(normalizedQuery)) {
        const standardizedBrand = brandDictionary[brand];
        if (!result.brands.includes(standardizedBrand)) {
          result.brands.push(standardizedBrand);
          console.log(`Wykryto: marka: ${standardizedBrand}`);
        }
      }
    });
  
    // Szukanie typów nadwozia
    Object.keys(bodyTypeDictionary).forEach(bodyType => {
      const pattern = new RegExp(`\\b${bodyType}\\b`, 'i');
      if (pattern.test(normalizedQuery)) {
        const standardizedBodyType = bodyTypeDictionary[bodyType];
        if (!result.bodyTypes.includes(standardizedBodyType)) {
          result.bodyTypes.push(standardizedBodyType);
          console.log(`Wykryto: typ nadwozia: ${standardizedBodyType}`);
        }
      }
    });
  
    // Szukanie typów paliwa
    Object.keys(fuelTypeDictionary).forEach(fuelType => {
      const pattern = new RegExp(`\\b${fuelType}\\b`, 'i');
      if (pattern.test(normalizedQuery)) {
        const standardizedFuelType = fuelTypeDictionary[fuelType];
        if (!result.fuelTypes.includes(standardizedFuelType)) {
          result.fuelTypes.push(standardizedFuelType);
          console.log(`Wykryto: rodzaj paliwa: ${standardizedFuelType}`);
        }
      }
    });
  
    // Szukanie typów skrzyni biegów
    Object.keys(transmissionDictionary).forEach(transmission => {
      const pattern = new RegExp(`\\b${transmission}\\b`, 'i');
      if (pattern.test(normalizedQuery)) {
        result.transmission = transmissionDictionary[transmission];
        console.log(`Wykryto: skrzynia biegów: ${result.transmission}`);
      }
    });
  
    // Szukanie kolorów
    Object.keys(colorDictionary).forEach(color => {
      const pattern = new RegExp(`\\b${color}\\b`, 'i');
      if (pattern.test(normalizedQuery)) {
        result.color = colorDictionary[color];
        console.log(`Wykryto: kolor: ${result.color}`);
      }
    });
  
    // Szukanie przedziałów cenowych
    const priceRanges = [
      { pattern: /do\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.|zł|zl|pln)/i, type: 'max' },
      { pattern: /poniżej\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.|zł|zl|pln)/i, type: 'max' },
      { pattern: /mniej\s+niż\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.|zł|zl|pln)/i, type: 'max' },
      { pattern: /od\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.|zł|zl|pln)/i, type: 'min' },
      { pattern: /powyżej\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.|zł|zl|pln)/i, type: 'min' },
      { pattern: /więcej\s+niż\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.|zł|zl|pln)/i, type: 'min' },
      { pattern: /między\s+(\d+)\s*a\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.|zł|zl|pln)/i, type: 'range' },
      { pattern: /(\d+)\s*-\s*(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.|zł|zl|pln)/i, type: 'range' },
      { pattern: /w\s+cenie\s+(\d+)\s*-\s*(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.|zł|zl|pln)/i, type: 'range' },
      { pattern: /cena\s+(\d+)\s*-\s*(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.|zł|zl|pln)/i, type: 'range' }
    ];
  
    for (const range of priceRanges) {
      const matches = normalizedQuery.match(range.pattern);
      if (matches) {
        if (range.type === 'max') {
          const price = parseInt(matches[1]) * 1000;
          result.maxPrice = price;
          console.log(`Wykryto: maksymalna cena: ${price}`);
        } else if (range.type === 'min') {
          const price = parseInt(matches[1]) * 1000;
          result.minPrice = price;
          console.log(`Wykryto: minimalna cena: ${price}`);
        } else if (range.type === 'range') {
          const minPrice = parseInt(matches[1]) * 1000;
          const maxPrice = parseInt(matches[2]) * 1000;
          result.minPrice = minPrice;
          result.maxPrice = maxPrice;
          console.log(`Wykryto: przedział cenowy: od ${minPrice} do ${maxPrice}`);
        }
      }
    }
  
    // Szukanie przedziałów roczników
    const yearRanges = [
      { pattern: /od\s+(\d{4})\s*roku/i, type: 'min' },
      { pattern: /od\s+roku\s+(\d{4})/i, type: 'min' },
      { pattern: /po\s+(\d{4})/i, type: 'min' },
      { pattern: /nowszy\s+niż\s+(\d{4})/i, type: 'min' },
      { pattern: /do\s+(\d{4})\s*roku/i, type: 'max' },
      { pattern: /do\s+roku\s+(\d{4})/i, type: 'max' },
      { pattern: /przed\s+(\d{4})/i, type: 'max' },
      { pattern: /starszy\s+niż\s+(\d{4})/i, type: 'max' },
      { pattern: /między\s+(\d{4})\s*a\s+(\d{4})/i, type: 'range' },
      { pattern: /z\s+(\d{4})\s*roku/i, type: 'exact' },
      { pattern: /rocznik\s+(\d{4})/i, type: 'exact' },
      { pattern: /\b(\d{4})\s*rok\b/i, type: 'exact' }
    ];
  
    for (const range of yearRanges) {
      const matches = normalizedQuery.match(range.pattern);
      if (matches) {
        if (range.type === 'min') {
          result.minYear = parseInt(matches[1]);
          console.log(`Wykryto: minimalny rok produkcji: ${result.minYear}`);
        } else if (range.type === 'max') {
          result.maxYear = parseInt(matches[1]);
          console.log(`Wykryto: maksymalny rok produkcji: ${result.maxYear}`);
        } else if (range.type === 'range') {
          result.minYear = parseInt(matches[1]);
          result.maxYear = parseInt(matches[2]);
          console.log(`Wykryto: przedział rocznika: od ${result.minYear} do ${result.maxYear}`);
        } else if (range.type === 'exact') {
          const year = parseInt(matches[1]);
          result.minYear = year;
          result.maxYear = year;
          console.log(`Wykryto: dokładny rok produkcji: ${year}`);
        }
      }
    }
  
    // Szukanie przedziałów przebiegu
    const mileageRanges = [
      { pattern: /do\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.)\s*km/i, type: 'max' },
      { pattern: /poniżej\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.)\s*km/i, type: 'max' },
      { pattern: /mniej\s+niż\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.)\s*km/i, type: 'max' },
      { pattern: /od\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.)\s*km/i, type: 'min' },
      { pattern: /powyżej\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.)\s*km/i, type: 'min' },
      { pattern: /więcej\s+niż\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.)\s*km/i, type: 'min' },
      { pattern: /między\s+(\d+)\s*a\s+(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.)\s*km/i, type: 'range' },
      { pattern: /(\d+)\s*-\s*(\d+)\s*(tys|tysięcy|k|tyś|tys\.|k\.)\s*km/i, type: 'range' },
      { pattern: /mały\s+przebieg/i, type: 'low' },
      { pattern: /niski\s+przebieg/i, type: 'low' }
    ];
  
    for (const range of mileageRanges) {
      const matches = normalizedQuery.match(range.pattern);
      if (matches) {
        if (range.type === 'max') {
          const mileage = parseInt(matches[1]) * 1000;
          result.maxMileage = mileage;
          console.log(`Wykryto: maksymalny przebieg: ${mileage}`);
        } else if (range.type === 'min') {
          const mileage = parseInt(matches[1]) * 1000;
          result.minMileage = mileage;
          console.log(`Wykryto: minimalny przebieg: ${mileage}`);
        } else if (range.type === 'range') {
          const minMileage = parseInt(matches[1]) * 1000;
          const maxMileage = parseInt(matches[2]) * 1000;
          result.minMileage = minMileage;
          result.maxMileage = maxMileage;
          console.log(`Wykryto: przedział przebiegu: od ${minMileage} do ${maxMileage}`);
        } else if (range.type === 'low') {
          result.maxMileage = 100000; // Umowny "niski przebieg" to do 100 tys. km
          console.log(`Wykryto: niski przebieg (do 100 000 km)`);
        }
      }
    }
  
    // Rozpoznawanie priorytetów
    // Analizujemy frazy typu "najważniejszy niski przebieg" lub "zależy mi na skrzyni automatycznej"
    priorityPatterns.forEach(priorityPattern => {
      priorityPattern.keywords.forEach(keyword => {
        const regex = new RegExp(`${keyword}\\s+([\\w\\s]+)`, 'i');
        const matches = normalizedQuery.match(regex);
        
        if (matches) {
          const priorityContext = matches[1].trim();
          const priority = {
            level: priorityPattern.priority,
            context: priorityContext
          };
          
          // Teraz sprawdźmy, czego dotyczy ten priorytet
          if (/przebieg/i.test(priorityContext)) {
            priority.field = 'mileage';
            console.log(`Wykryto: priorytet (${priorityPattern.priority}): przebieg`);
          } else if (/cen|tani|koszt/i.test(priorityContext)) {
            priority.field = 'price';
            console.log(`Wykryto: priorytet (${priorityPattern.priority}): cena`);
          } else if (/rok|wiek|now|star/i.test(priorityContext)) {
            priority.field = 'year';
            console.log(`Wykryto: priorytet (${priorityPattern.priority}): rok produkcji`);
          } else if (/paliw|benzyn|diesel|gaz|lpg/i.test(priorityContext)) {
            priority.field = 'fuelType';
            console.log(`Wykryto: priorytet (${priorityPattern.priority}): rodzaj paliwa`);
          } else if (/skrzyn|automat|manual/i.test(priorityContext)) {
            priority.field = 'transmission';
            console.log(`Wykryto: priorytet (${priorityPattern.priority}): skrzynia biegów`);
          } else if (/nadwoz|sedan|kombi|hatchback|suv/i.test(priorityContext)) {
            priority.field = 'bodyType';
            console.log(`Wykryto: priorytet (${priorityPattern.priority}): typ nadwozia`);
          } else if (/mark|brand/i.test(priorityContext)) {
            priority.field = 'brand';
            console.log(`Wykryto: priorytet (${priorityPattern.priority}): marka`);
          } else {
            // Jeśli nie jesteśmy pewni, czego dotyczy priorytet, dodamy kontekst
            priority.field = 'unknown';
            console.log(`Wykryto: priorytet (${priorityPattern.priority}): ${priorityContext}`);
          }
          
          result.priorities.push(priority);
        }
      });
    });
  
    // Rozpoznawanie intencji użytkownika
    intentDictionary.forEach(intentItem => {
      // Sprawdźmy, czy którykolwiek z wzorców pasuje
      const hasIntent = intentItem.patterns.some(pattern => 
        normalizedQuery.includes(pattern)
      );
      
      if (hasIntent) {
        result.userIntent.push(intentItem.intent);
        console.log(`Wykryto: intencja użytkownika: ${intentItem.intent}`);
        
        // Dodajemy odpowiednie filtry na podstawie intencji
        const intentFilters = intentItem.filters;
        
        // Dodajemy typy nadwozia jeśli intencja je sugeruje
        if (intentFilters.bodyTypes && intentFilters.bodyTypes.length > 0) {
          intentFilters.bodyTypes.forEach(bodyType => {
            if (!result.bodyTypes.includes(bodyType)) {
              result.bodyTypes.push(bodyType);
              console.log(`Dodano na podstawie intencji: typ nadwozia: ${bodyType}`);
            }
          });
        }
        
        // Dodajemy marki jeśli intencja je sugeruje
        if (intentFilters.brands && intentFilters.brands.length > 0) {
          intentFilters.brands.forEach(brand => {
            if (!result.brands.includes(brand)) {
              result.brands.push(brand);
              console.log(`Dodano na podstawie intencji: marka: ${brand}`);
            }
          });
        }
        
        // Ustawiamy maksymalną cenę jeśli intencja ją sugeruje i nie była wcześniej określona
        if (intentFilters.maxPrice && !result.maxPrice) {
          result.maxPrice = intentFilters.maxPrice;
          console.log(`Dodano na podstawie intencji: maksymalna cena: ${intentFilters.maxPrice}`);
        }
        
        // Ustawiamy minimalny rok jeśli intencja go sugeruje i nie był wcześniej określony
        if (intentFilters.minYear && !result.minYear) {
          result.minYear = intentFilters.minYear;
          console.log(`Dodano na podstawie intencji: minimalny rok produkcji: ${intentFilters.minYear}`);
        }
      }
    });
  
    return result;
  };
  
  // Przykład użycia:
  // const query = "Szukam Audi lub BMW z automatem, najważniejszy niski przebieg, do 70 tys. zł";
  // const keywords = extractKeywords(query);
  // console.log(keywords);