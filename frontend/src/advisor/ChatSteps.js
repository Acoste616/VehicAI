// src/advisor/chatSteps.js

/**
 * Sekwencja kroków rozmowy w doradcy VehicAI
 * Każdy krok definiuje jedno pytanie zadawane użytkownikowi
 */

// Definicje opcji dla multiselect
const availableBrands = [
  'Audi', 'BMW', 'Ford', 'Honda', 'Hyundai', 'Kia', 'Mazda',
  'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Renault', 'Skoda',
  'Toyota', 'Volkswagen', 'Volvo', 'Inna' // Dodajemy 'Inna'
];

const availableBodyTypes = [
  'Sedan', 'Hatchback', 'Kombi', 'SUV', 'Coupe', 'Kabriolet', 'Minivan', 'Pickup', 'Inny' // Dodajemy 'Inny'
];


export const chatSteps = [
    {
      id: 'purpose',
      label: 'W jakim celu kupujesz samochód?',
      inputType: 'select', // Pojedynczy wybór
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
      label: 'Jaki masz maksymalny budżet na samochód?',
      inputType: 'price',
      required: true,
      hint: 'Podaj maksymalną kwotę w złotówkach'
    },
    {
      id: 'brand',
      label: 'Czy masz preferowaną markę lub marki samochodu?',
      inputType: 'multiselect-brand', // Zmieniony typ na multiselect
      required: false,
      options: availableBrands.map(brand => ({ value: brand, label: brand })), // Mapujemy na format { value, label }
      hint: 'Możesz wybrać kilka marek'
    },
    {
      id: 'bodyType',
      label: 'Jaki typ nadwozia Cię interesuje?',
      inputType: 'multiselect-bodytype', // Zmieniony typ na multiselect
      required: true, // Zazwyczaj typ nadwozia jest kluczowy
      options: availableBodyTypes.map(type => ({ value: type.toLowerCase().replace(' ', '-'), label: type })), // Mapujemy na format { value, label }
      hint: 'Możesz wybrać kilka typów nadwozia'
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
      required: false, // Opcjonalne
      hint: 'Podaj maksymalny przebieg w kilometrach'
    },
    {
      id: 'fuelType',
      label: 'Jaki rodzaj paliwa preferujesz?',
      inputType: 'select', // Zostawiamy jako pojedynczy select, chyba że wymagany jest multi
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
      inputType: 'select', // Zostawiamy jako pojedynczy select
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
      inputType: 'select', // Pojedynczy wybór priorytetu
      required: true,
      options: [
        { value: 'price', label: 'Niska cena' },
        { value: 'mileage', label: 'Niski przebieg' },
        { value: 'year', label: 'Nowszy rocznik' },
        // { value: 'brand', label: 'Konkretna marka' }, // Usunięte, bo marka może być multi
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
      required: false, // Opcjonalne
      hint: 'Np. kolor, konkretne wyposażenie, moc, liczba miejsc, itp.'
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
export const getNextStepLogic = (currentStepId, responses) => {
    const currentIndex = getStepIndexById(currentStepId);
    if (currentIndex === -1 || currentIndex >= chatSteps.length - 1) {
      return null; // Brak następnego kroku
    }
    // Tutaj można dodać logikę warunkową, np. pomijanie kroku jeśli nie dotyczy
    // Na razie prosta logika przejścia do następnego
    return chatSteps[currentIndex + 1];
};

// Modyfikacja funkcji w advisorEngine.js, aby używała tej logiki
// W advisorEngine.js zmień wywołanie getNextStep na getNextStepLogic
// export const getNextStep = (responses) => { ... } // stara wersja
// export const getNextStep = (responses) => getNextStepLogic(Object.keys(responses).pop(), responses); // potencjalna nowa wersja w engine

export default chatSteps;