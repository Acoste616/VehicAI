import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/config.js';

const brands = [
  { name: 'Toyota', models: ['Corolla', 'Camry', 'RAV4', 'Yaris', 'Avensis', 'C-HR', 'Land Cruiser'] },
  { name: 'BMW', models: ['Seria 3', 'Seria 5', 'X3', 'X5', 'X1', 'Seria 1', 'Seria 7'] },
  { name: 'Audi', models: ['A4', 'A6', 'Q5', 'A3', 'Q3', 'A5', 'Q7'] },
  { name: 'Mercedes', models: ['Klasa C', 'Klasa E', 'GLC', 'Klasa A', 'GLA', 'CLA', 'Klasa S'] },
  { name: 'Volkswagen', models: ['Golf', 'Passat', 'Tiguan', 'Polo', 'Arteon', 'T-Roc', 'Touareg'] },
  { name: 'Skoda', models: ['Octavia', 'Superb', 'Karoq', 'Fabia', 'Kodiaq', 'Scala', 'Kamiq'] },
  { name: 'Ford', models: ['Focus', 'Mondeo', 'Kuga', 'Fiesta', 'Puma', 'Mustang', 'Explorer'] },
  { name: 'Opel', models: ['Astra', 'Insignia', 'Corsa', 'Mokka', 'Grandland X', 'Crossland X', 'Zafira'] },
  { name: 'Renault', models: ['Clio', 'Megane', 'Kadjar', 'Captur', 'Talisman', 'Scenic', 'Arkana'] },
  { name: 'Hyundai', models: ['i30', 'Tucson', 'i20', 'Kona', 'Santa Fe', 'i10', 'Ioniq'] }
];

const colors = ['czarny', 'biały', 'szary', 'czerwony', 'niebieski', 'srebrny', 'zielony', 'brązowy'];
const fuelTypes = ['Benzyna', 'Diesel', 'Elektryczny', 'LPG', 'Hybryda'];
const transmissions = ['Manualna', 'Automatyczna'];
const bodyTypes = ['Hatchback', 'Sedan', 'Kombi', 'SUV', 'Coupe', 'Kabriolet', 'Crossover'];

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

async function seedFirestore() {
  console.log('Starting to seed Firestore with car data...');
  
  // Create a set to track used brand/model combinations
  const usedCombinations = new Set();
  
  const carsToAdd = [];
  
  while (carsToAdd.length < 50) {
    const brandObj = getRandomElement(brands);
    const brand = brandObj.name;
    const model = getRandomElement(brandObj.models);
    
    // Create a unique key for this combination
    const combinationKey = `${brand}-${model}`;
    
    // Skip if we've already used this combination
    if (usedCombinations.has(combinationKey)) {
      continue;
    }
    
    // Add to our used set
    usedCombinations.add(combinationKey);
    
    const year = getRandomInt(2008, 2023);
    const price = getRandomInt(20000, 150000);
    const mileage = getRandomInt(30000, 250000);
    const fuelType = getRandomElement(fuelTypes);
    const transmission = getRandomElement(transmissions);
    const bodyType = getRandomElement(bodyTypes);
    const color = getRandomElement(colors);
    const visualCondition = getRandomInt(1, 5);
    const warranty = Math.random() > 0.6;
    const inspectionValidUntil = getRandomDate('2023-05-01', '2025-12-31');
    
    const car = {
      brand,
      model,
      year,
      price,
      mileage,
      fuelType,
      transmission,
      bodyType,
      color,
      mainImageUrl: `https://via.placeholder.com/300x200?text=${brand}+${model}`,
      visualCondition,
      warranty,
      inspectionValidUntil,
      createdAt: serverTimestamp()
    };
    
    carsToAdd.push(car);
  }
  
  // Add all cars to Firestore
  let addedCount = 0;
  for (const car of carsToAdd) {
    try {
      await addDoc(collection(db, 'cars'), car);
      addedCount++;
      console.log(`Added ${addedCount} of 50: ${car.brand} ${car.model} (${car.year})`);
    } catch (error) {
      console.error('Error adding car:', error);
    }
  }
  
  console.log(`Successfully added ${addedCount} cars to Firestore collection 'cars'`);
}

// Execute the seeding
seedFirestore()
  .then(() => {
    console.log('Seeding completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during seeding:', error);
    process.exit(1);
  });

