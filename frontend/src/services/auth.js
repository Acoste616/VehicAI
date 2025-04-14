import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
  } from 'firebase/auth';
  import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
  import { db } from '../config/firebase';
  
  /**
   * Serwis do obsługi autentykacji
   */
  class AuthService {
    constructor() {
      this.auth = getAuth();
    }
  
    /**
     * Rejestracja nowego użytkownika
     * @param {string} email - Adres email użytkownika
     * @param {string} password - Hasło użytkownika
     * @param {string} displayName - Nazwa wyświetlana użytkownika (opcjonalna)
     * @returns {Promise<Object>} - Promise z danymi nowego użytkownika
     */
    async register(email, password, displayName = '') {
      try {
        console.log('Rozpoczęcie rejestracji...');
        // Utwórz użytkownika w Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        const user = userCredential.user;
        console.log('Użytkownik zarejestrowany w Auth:', user.uid);
        
        // Aktualizuj profil, jeśli podano displayName
        if (displayName) {
          await updateProfile(user, { displayName });
          console.log('Zaktualizowano nazwę wyświetlaną:', displayName);
        }
        
        // Utwórz dokument użytkownika w Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          console.log('Utworzono dokument użytkownika w Firestore');
        } catch (firestoreError) {
          console.error('Błąd podczas tworzenia dokumentu w Firestore:', firestoreError);
          // Kontynuuj mimo błędu Firestore - użytkownik został utworzony w Auth
        }
        
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        };
      } catch (error) {
        console.error('Błąd rejestracji:', error);
        
        // Tłumaczenie błędów Firebase na przyjazne dla użytkownika komunikaty
        let message = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
        switch (error.code) {
          case 'auth/email-already-in-use':
            message = 'Ten adres email jest już używany przez inne konto.';
            break;
          case 'auth/invalid-email':
            message = 'Podany adres email jest nieprawidłowy.';
            break;
          case 'auth/weak-password':
            message = 'Hasło jest zbyt słabe. Powinno zawierać co najmniej 6 znaków.';
            break;
          case 'auth/operation-not-allowed':
            message = 'Rejestracja przez email/hasło jest wyłączona.';
            break;
          default:
            message = `Wystąpił błąd: ${error.message}`;
        }
        
        throw new Error(message);
      }
    }
  
    /**
     * Logowanie użytkownika
     * @param {string} email - Adres email użytkownika
     * @param {string} password - Hasło użytkownika
     * @returns {Promise<Object>} - Promise z danymi zalogowanego użytkownika
     */
    async login(email, password) {
      try {
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        const user = userCredential.user;
        
        // Aktualizuj timestamp ostatniego logowania w Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            lastLogin: serverTimestamp()
          });
        } catch (firestoreError) {
          console.error('Błąd podczas aktualizacji ostatniego logowania:', firestoreError);
          // Kontynuuj mimo błędu - użytkownik został zalogowany
        }
        
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        };
      } catch (error) {
        console.error('Błąd logowania:', error);
        
        // Tłumaczenie błędów Firebase
        let message = 'Wystąpił błąd podczas logowania. Spróbuj ponownie.';
        switch (error.code) {
          case 'auth/user-not-found':
            message = 'Nie znaleziono użytkownika o podanym adresie email.';
            break;
          case 'auth/wrong-password':
            message = 'Nieprawidłowe hasło.';
            break;
          case 'auth/invalid-email':
            message = 'Podany adres email jest nieprawidłowy.';
            break;
          case 'auth/user-disabled':
            message = 'To konto zostało wyłączone.';
            break;
          case 'auth/too-many-requests':
            message = 'Zbyt wiele nieudanych prób logowania. Spróbuj później.';
            break;
          default:
            message = `Wystąpił błąd: ${error.message}`;
        }
        
        throw new Error(message);
      }
    }
  
    /**
     * Logowanie przez Google
     * @returns {Promise<Object>} - Promise z danymi zalogowanego użytkownika
     */
    async loginWithGoogle() {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(this.auth, provider);
        const user = userCredential.user;
        
        // Sprawdź, czy użytkownik istnieje w Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          // Jeśli nie, utwórz dokument użytkownika
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });
        } else {
          // Jeśli tak, zaktualizuj timestamp ostatniego logowania
          await updateDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL
        };
      } catch (error) {
        console.error('Błąd logowania przez Google:', error);
        throw new Error('Wystąpił błąd podczas logowania przez Google. Spróbuj ponownie.');
      }
    }
  
    /**
     * Wylogowanie użytkownika
     * @returns {Promise<void>}
     */
    async logout() {
      try {
        await signOut(this.auth);
      } catch (error) {
        console.error('Błąd wylogowania:', error);
        throw new Error('Wystąpił błąd podczas wylogowania. Spróbuj ponownie.');
      }
    }
  
    /**
     * Resetowanie hasła
     * @param {string} email - Adres email użytkownika
     * @returns {Promise<void>}
     */
    async resetPassword(email) {
      try {
        await sendPasswordResetEmail(this.auth, email);
      } catch (error) {
        console.error('Błąd resetowania hasła:', error);
        
        let message = 'Wystąpił błąd podczas wysyłania linku do resetowania hasła.';
        switch (error.code) {
          case 'auth/user-not-found':
            message = 'Nie znaleziono użytkownika o podanym adresie email.';
            break;
          case 'auth/invalid-email':
            message = 'Podany adres email jest nieprawidłowy.';
            break;
          default:
            message = `Wystąpił błąd: ${error.message}`;
        }
        
        throw new Error(message);
      }
    }
  
    /**
     * Aktualizacja profilu użytkownika
     * @param {Object} userData - Dane do aktualizacji
     * @returns {Promise<void>}
     */
    async updateUserProfile(userData) {
      try {
        const user = this.auth.currentUser;
        if (!user) {
          throw new Error('Brak zalogowanego użytkownika.');
        }
        
        // Aktualizuj profil w Auth, jeśli podano displayName lub photoURL
        if (userData.displayName || userData.photoURL) {
          await updateProfile(user, {
            displayName: userData.displayName,
            photoURL: userData.photoURL
          });
        }
        
        // Aktualizuj dane w Firestore
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Błąd aktualizacji profilu:', error);
        throw new Error('Wystąpił błąd podczas aktualizacji profilu. Spróbuj ponownie.');
      }
    }
  
    /**
     * Pobranie aktualnie zalogowanego użytkownika
     * @returns {Object|null} - Obiekt użytkownika lub null
     */
    getCurrentUser() {
      return this.auth.currentUser;
    }
  
    /**
     * Nasłuchiwanie na zmiany stanu autentykacji
     * @param {Function} callback - Funkcja wywoływana przy zmianie stanu
     * @returns {Function} - Funkcja do anulowania nasłuchiwania
     */
    onAuthStateChanged(callback) {
      return onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          // Pobranie dodatkowych danych z Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              callback({
                ...userData,
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || userData.displayName,
                emailVerified: user.emailVerified,
                photoURL: user.photoURL || userData.photoURL
              });
            } else {
              // Jeśli dokument nie istnieje, używamy tylko danych z Auth
              callback({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                emailVerified: user.emailVerified,
                photoURL: user.photoURL
              });
            }
          } catch (error) {
            console.error('Błąd pobierania danych użytkownika z Firestore:', error);
            // W przypadku błędu, zwróć podstawowe dane z Auth
            callback({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              emailVerified: user.emailVerified,
              photoURL: user.photoURL
            });
          }
        } else {
          // Użytkownik wylogowany
          callback(null);
        }
      });
    }
  }
  
  // Eksportuj pojedynczą instancję serwisu
  const authService = new AuthService();
  export default authService;