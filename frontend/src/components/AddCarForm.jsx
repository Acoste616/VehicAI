// Plik: src/components/AddCarForm.jsx
// Komponent formularza dodawania ogłoszenia pojazdu z uploadem zdjęć i analizą AI

import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../utils/firebase/config'; // Import z konfiguracji Firebase

const AddCarForm = () => {
  // Stan formularza
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    mileage: '',
    engineCapacity: '',
    power: '',
    fuelType: '',
    transmission: '',
    price: '',
    visualCondition: '',
    description: ''
  });

  // Obsługa zdjęć
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  
  // Stan przesyłania formularza
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Referencje
  const fileInputRef = useRef(null);

  // Opcje dla pól wyboru (selectów)
  const fuelTypes = ['Benzyna', 'Diesel', 'LPG', 'Elektryczny', 'Hybryda', 'Wodór'];
  const transmissionTypes = ['Manualna', 'Automatyczna', 'Półautomatyczna'];
  const visualConditionOptions = [
    { value: '1', label: '1 - Bardzo słaby' },
    { value: '2', label: '2 - Słaby' },
    { value: '3', label: '3 - Średni' },
    { value: '4', label: '4 - Dobry' },
    { value: '5', label: '5 - Bardzo dobry' }
  ];

  // Obsługa zmian w polach formularza
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Obsługa wyboru zdjęć
  const handleImageSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length > 0) {
      setImages(prevImages => [...prevImages, ...selectedFiles]);
      
      // Jeśli to pierwsze zdjęcie, uruchom analizę AI
      if (images.length === 0 && selectedFiles.length > 0) {
        analyzeImageWithVision(selectedFiles[0]);
      }
    }
  };

  // Usuwanie wybranego zdjęcia
  const handleRemoveImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  // Symulacja odpowiedzi Google Vision API (do celów rozwojowych)
  const mockVisionResponse = () => {
    // Symulacja opóźnienia API
    setIsAnalyzingImage(true);
    
    return new Promise(resolve => {
      setTimeout(() => {
        // Symulacja wykrytych danych pojazdu
        const detectedData = {
          brand: 'Toyota',
          model: 'Corolla',
          year: '2019'
        };
        setIsAnalyzingImage(false);
        resolve(detectedData);
      }, 2000);
    });
  };

  // Analiza zdjęcia za pomocą Google Vision API (na razie używamy symulacji)
  const analyzeImageWithVision = async (imageFile) => {
    try {
      setIsAnalyzingImage(true);
      
      // W produkcji tutaj byłoby prawdziwe wywołanie API Google Vision
      // Na razie używamy funkcji symulującej
      const detectedData = await mockVisionResponse();
      
      // Aktualizacja formularza wykrytymi danymi
      setFormData(prevData => ({
        ...prevData,
        brand: detectedData.brand || prevData.brand,
        model: detectedData.model || prevData.model,
        year: detectedData.year || prevData.year
      }));
      
      setIsAnalyzingImage(false);
    } catch (error) {
      console.error('Błąd podczas analizy zdjęcia:', error);
      setIsAnalyzingImage(false);
    }
  };

  // Upload zdjęć do Firebase Storage
  const uploadImages = async (listingId) => {
    if (images.length === 0) return [];
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadPromises = images.map((image, index) => {
        // Utworzenie referencji do miejsca w Storage
        const storageRef = ref(storage, `images/${listingId}/${Date.now()}_${image.name}`);
        
        // Utworzenie zadania uploadowania
        const uploadTask = uploadBytesResumable(storageRef, image);
        
        // Zwraca Promise, który rozwiązuje się z URL po zakończeniu uploadu
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Śledzenie postępu uploadowania
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (error) => {
              // Obsługa błędów uploadu
              console.error('Błąd uploadu:', error);
              reject(error);
            },
            async () => {
              // Upload zakończony pomyślnie, pobierz URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            }
          );
        });
      });
      
      // Poczekaj na zakończenie wszystkich uploadów
      const urls = await Promise.all(uploadPromises);
      setUploading(false);
      setImageUrls(urls);
      return urls;
    } catch (error) {
      console.error('Błąd podczas uploadowania zdjęć:', error);
      setUploading(false);
      throw error;
    }
  };

  // Obsługa wysyłania formularza
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Podstawowa walidacja
    if (!formData.brand || !formData.model || !formData.price) {
      setSubmitError('Proszę wypełnić wymagane pola: marka, model, cena');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // 1. Dodaj dokument ogłoszenia do Firestore, aby uzyskać ID
      const listingRef = await addDoc(collection(db, 'listings'), {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: 'user123', // To powinno pochodzić z kontekstu autentykacji w prawdziwej aplikacji
        status: 'active',
        views: 0,
        imageCount: images.length
      });
      
      // 2. Upload zdjęć do Firebase Storage używając ID ogłoszenia
      const imageUrls = await uploadImages(listingRef.id);
      
      // 3. Aktualizacja dokumentu ogłoszenia o URL-e zdjęć
      await updateDoc(listingRef, {
        imageUrls,
        mainImageUrl: imageUrls.length > 0 ? imageUrls[0] : null
      });
      
      // Reset formularza po pomyślnym wysłaniu
      setFormData({
        brand: '',
        model: '',
        year: '',
        mileage: '',
        engineCapacity: '',
        power: '',
        fuelType: '',
        transmission: '',
        price: '',
        visualCondition: '',
        description: ''
      });
      setImages([]);
      setImageUrls([]);
      setSubmitSuccess(true);
      setIsSubmitting(false);
      
      // Reset komunikatu sukcesu po 5 sekundach
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Błąd podczas wysyłania formularza:', error);
      setSubmitError('Wystąpił błąd podczas dodawania ogłoszenia. Spróbuj ponownie.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Dodaj ogłoszenie samochodu</h2>
      
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
          Ogłoszenie zostało dodane pomyślnie!
        </div>
      )}
      
      {submitError && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Pole Marka */}
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
              Marka*
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Pole Model */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
              Model*
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Pole Rok produkcji */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Rok produkcji
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear()}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Pole Przebieg */}
          <div>
            <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">
              Przebieg (km)
            </label>
            <input
              type="number"
              id="mileage"
              name="mileage"
              value={formData.mileage}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Pole Pojemność silnika */}
          <div>
            <label htmlFor="engineCapacity" className="block text-sm font-medium text-gray-700 mb-1">
              Pojemność silnika (cm³)
            </label>
            <input
              type="number"
              id="engineCapacity"
              name="engineCapacity"
              value={formData.engineCapacity}
              onChange={handleChange}
              min="0"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Pole Moc */}
          <div>
            <label htmlFor="power" className="block text-sm font-medium text-gray-700 mb-1">
              Moc (KM)
            </label>
            <input
              type="number"
              id="power"
              name="power"
              value={formData.power}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Wybór rodzaju paliwa */}
          <div>
            <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-1">
              Rodzaj paliwa
            </label>
            <select
              id="fuelType"
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Wybierz rodzaj paliwa</option>
              {fuelTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          {/* Wybór skrzyni biegów */}
          <div>
            <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 mb-1">
              Skrzynia biegów
            </label>
            <select
              id="transmission"
              name="transmission"
              value={formData.transmission}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Wybierz typ skrzyni biegów</option>
              {transmissionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          {/* Pole Cena */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Cena (PLN)*
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Wybór stanu wizualnego */}
          <div>
            <label htmlFor="visualCondition" className="block text-sm font-medium text-gray-700 mb-1">
              Ocena wizualna
            </label>
            <select
              id="visualCondition"
              name="visualCondition"
              value={formData.visualCondition}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Wybierz ocenę stanu wizualnego</option>
              {visualConditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Pole opisu pojazdu */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Opis pojazdu
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        
        {/* Sekcja uploadu zdjęć */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zdjęcia pojazdu
          </label>
          
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="fileInput"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <p className="mb-1 text-sm text-gray-500">
                  <span className="font-semibold">Kliknij aby dodać zdjęcia</span> lub przeciągnij i upuść
                </p>
                <p className="text-xs text-gray-500">
                  Pierwsze zdjęcie zostanie przeanalizowane przez AI
                </p>
              </div>
              <input
                id="fileInput"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                ref={fileInputRef}
              />
            </label>
          </div>
          
          {/* Informacja o analizie zdjęcia */}
          {isAnalyzingImage && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center">
              <svg
                className="animate-spin h-5 w-5 mr-3"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Analizuję zdjęcie za pomocą AI...
            </div>
          )}
          
          {/* Podgląd wybranych zdjęć */}
          {images.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Wybrane zdjęcia ({images.length}):
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Podgląd pojazdu ${index + 1}`}
                      className="h-24 w-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">
                        Główne
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Postęp uploadowania */}
          {uploading && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Przesyłanie zdjęć: {uploadProgress}%
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Przycisk wysyłania */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className={`w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              (isSubmitting || uploading) && 'opacity-70 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Dodawanie ogłoszenia...' : 'Dodaj ogłoszenie'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCarForm;