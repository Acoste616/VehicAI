import React, { useState } from 'react';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const DebugRegister = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setDebugInfo(null);
    setLoading(true);

    const auth = getAuth();
    let debugData = {
      steps: [],
      errors: []
    };

    try {
      // Krok 1: Utwórz użytkownika w Firebase Auth
      debugData.steps.push('1. Rozpoczynam tworzenie użytkownika w Firebase Auth');
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      debugData.steps.push(`2. Użytkownik utworzony w Auth: ${user.uid}`);
      debugData.user = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      };

      // Krok 2: Utwórz dokument użytkownika w Firestore
      debugData.steps.push('3. Próbuję utworzyć dokument użytkownika w Firestore');
      
      try {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: displayName || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        debugData.firestoreData = userData;
        
        await setDoc(doc(db, 'users', user.uid), userData);
        
        debugData.steps.push('4. Dokument użytkownika utworzony w Firestore');
        
        setSuccess('Użytkownik zarejestrowany pomyślnie! Możesz się teraz zalogować.');
      } catch (firestoreError) {
        debugData.steps.push('4. BŁĄD podczas tworzenia dokumentu w Firestore');
        debugData.errors.push({
          step: 'firestore',
          code: firestoreError.code,
          message: firestoreError.message
        });
        
        // Kontynuuj mimo błędu Firestore, bo użytkownik już został utworzony w Auth
        setSuccess('Konto utworzone, ale wystąpił problem z zapisem danych. Możesz się zalogować.');
      }

    } catch (authError) {
      debugData.steps.push('2. BŁĄD podczas tworzenia użytkownika w Auth');
      debugData.errors.push({
        step: 'auth',
        code: authError.code,
        message: authError.message
      });
      
      // Tłumaczenie błędów Firebase na przyjazne dla użytkownika komunikaty
      let message = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
      switch (authError.code) {
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
          message = `Wystąpił błąd: ${authError.message}`;
      }
      
      setError(message);
    } finally {
      setDebugInfo(debugData);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">🛠️ Debug Rejestracji</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          <p className="font-bold">Błąd:</p>
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
          <p className="font-bold">Sukces:</p>
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email:
          </label>
          <input 
            type="email" 
            id="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Hasło:
          </label>
          <input 
            type="password" 
            id="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
          <p className="text-xs text-gray-500 mt-1">Hasło musi mieć co najmniej 6 znaków</p>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="displayName">
            Nazwa użytkownika (opcjonalnie):
          </label>
          <input 
            type="text" 
            id="displayName"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        
        <div className="flex items-center justify-center">
          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            disabled={loading}
          >
            {loading ? 'Rejestracja...' : 'Zarejestruj się'}
          </button>
        </div>
      </form>
      
      {debugInfo && (
        <div className="mt-8 p-4 bg-gray-100 rounded text-xs font-mono overflow-auto">
          <h3 className="font-bold mb-2">Informacje debugowania:</h3>
          <div className="mb-2">
            <strong>Kroki:</strong>
            <ol className="list-decimal list-inside pl-2">
              {debugInfo.steps.map((step, index) => (
                <li key={index} className={step.includes('BŁĄD') ? 'text-red-600' : 'text-green-600'}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          
          {debugInfo.errors.length > 0 && (
            <div className="mb-2">
              <strong>Błędy:</strong>
              <ul className="list-disc list-inside pl-2">
                {debugInfo.errors.map((err, index) => (
                  <li key={index} className="text-red-600">
                    <strong>{err.step}:</strong> {err.code} - {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {debugInfo.user && (
            <div className="mb-2">
              <strong>Dane użytkownika Auth:</strong>
              <pre className="pl-2">{JSON.stringify(debugInfo.user, null, 2)}</pre>
            </div>
          )}
          
          {debugInfo.firestoreData && (
            <div>
              <strong>Dane Firestore:</strong>
              <pre className="pl-2">{JSON.stringify(debugInfo.firestoreData, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugRegister;