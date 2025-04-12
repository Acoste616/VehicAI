/**
 * Sekwencja kroków rozmowy w doradcy VehicAI
 * Każdy krok definiuje jedno pytanie zadawane użytkownikowi
 */

export const chatSteps = [
    {
      id: 'purpose',
      label: 'W jakim celu kupujesz samochód?',
      inputType: 'select',
      required: true,
      options: [
        { value: 'family', label: 'Dla rodziny' },
        { value: 'daily', label: 'Do codziennej jazdy' },
        { value: 'business', label: 'Do firmy/w celach służbowych' },
        { value: 'sport', label: 'Dla przyjemności/sportowej jazdy' },
        { value: 'offroad', label: 'Do jazdy w terenie' },
        { value: 'other', label: 'Inny cel' }
      ]
    },
    {
      id: 'budget',
      label: 'Jaki masz budżet na samochód?',
      inputType: 'price',
      required: true,
      hint: 'Podaj maksymalną kwotę w złotówkach'
    },
    {
      id: 'brand',
      label: 'Czy masz preferowaną markę samochodu?',
      inputType: 'select',
      required: false,
      options: [
        { value: 'any', label: 'Nie mam preferencji' },
        { value: 'Audi', label: 'Audi' },
        { value: 'BMW', label: 'BMW' },
        { value: 'Ford', label: 'Ford' },
        { value: 'Mercedes-Benz', label: 'Mercedes' },
        { value: 'Opel', label: 'Opel' },
        { value: 'Toyota', label: 'Toyota' },
        { value: 'Volkswagen', label: 'Volkswagen' },
        { value: 'Skoda', label: 'Skoda' },
        { value: 'Renault', label: 'Renault' },
        { value: 'other', label: 'Inna marka (wpisz w komentarzu)' }
      ]
    },
    {
      id: 'bodyType',
      label: 'Jaki typ nadwozia Cię interesuje?',
      inputType: 'select',
      required: true,
      options: [
        { value: 'any', label: 'Dowolny' },
        { value: 'sedan', label: 'Sedan' },
        { value: 'hatchback', label: 'Hatchback' },
        { value: 'kombi', label: 'Kombi' },
        { value: 'suv', label: 'SUV/Crossover' },
        { value: 'van', label: 'Van/Minivan' },
        { value: 'coupe', label: 'Coupe' },
        { value: 'kabriolet', label: 'Kabriolet' },
        { value: 'pickup', label: 'Pickup' }
      ]
    },
    {
      id: 'minYear',
      label: 'Jaki minimalny rok produkcji Cię interesuje?',
      inputType: 'year',
      required: true,
      hint: 'Np. 2015'
    },
    {
      id: 'maxMileage',
      label: 'Jaki maksymalny przebieg akceptujesz?',
      inputType: 'mileage',
      required: false,
      hint: 'Podaj maksymalny przebieg w kilometrach'
    },
    {
      id: 'fuelType',
      label: 'Jaki rodzaj paliwa preferujesz?',
      inputType: 'select',
      required: false,
      options: [
        { value: 'any', label: 'Bez znaczenia' },
        { value: 'petrol', label: 'Benzyna' },
        { value: 'diesel', label: 'Diesel' },
        { value: 'hybrid', label: 'Hybryda' },
        { value: 'electric', label: 'Elektryczny' },
        { value: 'lpg', label: 'LPG/Gaz' }
      ]
    },
    {
      id: 'transmission',
      label: 'Jaką skrzynię biegów preferujesz?',
      inputType: 'select',
      required: false,
      options: [
        { value: 'any', label: 'Bez znaczenia' },
        { value: 'manual', label: 'Manualna' },
        { value: 'automatic', label: 'Automatyczna' }
      ]
    },
    {
      id: 'priority',
      label: 'Co jest dla Ciebie najważniejsze w samochodzie?',
      inputType: 'select',
      required: true,
      options: [
        { value: 'price', label: 'Niska cena' },
        { value: 'mileage', label: 'Niski przebieg' },
        { value: 'year', label: 'Nowszy rocznik' },
        { value: 'brand', label: 'Konkretna marka' },
        { value: 'fuelEconomy', label: 'Ekonomiczne spalanie' },
        { value: 'performance', label: 'Osiągi i dynamika' },
        { value: 'safety', label: 'Bezpieczeństwo' },
        { value: 'comfort', label: 'Komfort i wyposażenie' },
        { value: 'reliability', label: 'Niezawodność' }
      ]
    },
    {
      id: 'additionalInfo',
      label: 'Czy masz dodatkowe preferencje lub wymagania?',
      inputType: 'text',
      required: false,
      hint: 'Np. konkretne wyposażenie, pojemność silnika, moc, liczba miejsc, itp.'
    }
  ];
  
  // Funkcja pomocnicza do pobrania kroku po ID
  export const getStepById = (stepId) => {
    return chatSteps.find(step => step.id === stepId);
  };
  
  // Funkcja pomocnicza do znalezienia indeksu kroku po ID
  export const getStepIndexById = (stepId) => {
    return chatSteps.findIndex(step => step.id === stepId);
  };
  
  // Funkcja zwracająca pierwszy krok
  export const getFirstStep = () => {
    return chatSteps[0];
  };
  
  // Funkcja zwracająca następny krok
  export const getNextStep = (currentStepId) => {
    const currentIndex = getStepIndexById(currentStepId);
    if (currentIndex === -1 || currentIndex >= chatSteps.length - 1) {
      return null; // Brak następnego kroku
    }
    return chatSteps[currentIndex + 1];
  };
  
  export default chatSteps;