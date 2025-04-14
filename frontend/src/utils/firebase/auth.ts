// src/utils/firebase/auth.ts
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    User as FirebaseUser,
    UserCredential,
    NextOrObserver,
    Unsubscribe
  } from 'firebase/auth';
  import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
  import { db } from './config'; // Import configured Firebase app
  import { app } from './config'; // Import Firebase app configuration
  
  // Initialize Firebase Auth
  const auth = getAuth(app);
  
  // Define user data interface
  export interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    createdAt?: any;
    updatedAt?: any;
    phoneNumber?: string | null;
    location?: string | null;
    isAdmin?: boolean;
  }
  
  /**
   * Register a new user with email and password
   * @param email - User's email
   * @param password - User's password
   * @param displayName - User's display name
   * @returns Promise that resolves with user data
   */
  export const registerWithEmailAndPassword = async (
    email: string, 
    password: string, 
    displayName?: string
  ): Promise<UserData> => {
    try {
      // First register with Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user document in Firestore
      const userData: UserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      
      return userData;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  /**
   * Sign in with email and password
   * @param email - User's email
   * @param password - User's password
   * @returns Promise that resolves with user data
   */
  export const loginWithEmailAndPassword = async (
    email: string, 
    password: string
  ): Promise<UserData> => {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      // If user document doesn't exist, create it
      if (!userDoc.exists()) {
        const userData: UserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', user.uid), userData);
        return userData;
      }
      
      // Update last login
      await updateDoc(doc(db, 'users', user.uid), {
        updatedAt: serverTimestamp()
      });
      
      return userDoc.data() as UserData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  /**
   * Sign in with Google
   * @returns Promise that resolves with user data
   */
  export const signInWithGoogle = async (): Promise<UserData> => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential: UserCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Check if user document exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      // If user document doesn't exist, create it
      if (!userDoc.exists()) {
        const userData: UserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', user.uid), userData);
        return userData;
      }
      
      // Update last login
      await updateDoc(doc(db, 'users', user.uid), {
        updatedAt: serverTimestamp()
      });
      
      return userDoc.data() as UserData;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };
  
  /**
   * Sign out the current user
   * @returns Promise that resolves when sign out is complete
   */
  export const logoutUser = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };
  
  /**
   * Send password reset email
   * @param email - User's email
   * @returns Promise that resolves when the email is sent
   */
  export const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };
  
  /**
   * Get the current user
   * @returns Current user object or null if not signed in
   */
  export const getCurrentUser = (): FirebaseUser | null => {
    return auth.currentUser;
  };
  
  /**
   * Get ID token for the current user
   * @param forceRefresh - Whether to force refresh the token
   * @returns Promise that resolves with the ID token string
   */
  export const getIdToken = async (forceRefresh = false): Promise<string> => {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken(forceRefresh);
    }
    throw new Error('No user is signed in');
  };
  
  /**
   * Subscribe to auth state changes
   * @param callback - Function to call when auth state changes
   * @returns Unsubscribe function
   */
  export const onAuthStateChange = (callback: NextOrObserver<FirebaseUser>): Unsubscribe => {
    return onAuthStateChanged(auth, callback);
  };
  
  export default {
    registerWithEmailAndPassword,
    loginWithEmailAndPassword,
    signInWithGoogle,
    logoutUser,
    resetPassword,
    getCurrentUser,
    getIdToken,
    onAuthStateChange,
    auth
  };