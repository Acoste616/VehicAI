import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Tworzenie instancji axios z domyślną konfiguracją
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor dodający token autoryzacyjny do każdego żądania
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    console.error('Błąd podczas dodawania tokenu:', error);
    return config;
  }
});

// Interceptor obsługujący błędy
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Tutaj możesz dodać logikę wylogowania użytkownika
      console.log('Użytkownik niezautoryzowany');
    }
    return Promise.reject(error);
  }
);

export default api; 