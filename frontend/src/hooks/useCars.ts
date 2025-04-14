// src/hooks/useCars.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  FirestoreError
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../utils/firebase/config';
import { getCurrentUser } from '../utils/firebase/auth';

// Define car listing interface
export interface CarListing {
  id?: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  engineCapacity?: number;
  power?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  description?: string;
  mainImageUrl?: string;
  imageUrls?: string[];
  userId: string;
  createdAt?: any;
  updatedAt?: any;
  views?: number;
  features?: string[];
  visualCondition?: number;
  [key: string]: any; // Allow for additional properties
}

// Define search filters interface
export interface CarFilters {
  brand?: string | string[];
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  fuelType?: string | string[];
  bodyType?: string | string[];
  transmission?: string;
  userId?: string; // For filtering by user's own listings
  [key: string]: any; // Allow for additional filters
}

// Define hook return types
interface UseCarsReturn {
  cars: CarListing[];
  userCars: CarListing[];
  loading: boolean;
  error: string | null;
  fetchCars: (filters?: CarFilters) => Promise<void>;
  fetchUserCars: () => Promise<void>;
  addCar: (carData: CarListing, images: File[]) => Promise<string>;
  updateCar: (id: string, carData: Partial<CarListing>, newImages?: File[]) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
  getCar: (id: string) => Promise<CarListing | null>;
}

/**
 * Custom hook for managing car listings in Firestore
 */
const useCars = (): UseCarsReturn => {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [userCars, setUserCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch cars from Firestore with optional filters
   */
  const fetchCars = useCallback(async (filters?: CarFilters): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const constraints: QueryConstraint[] = [];
      
      // Apply filters if provided
      if (filters) {
        if (filters.brand) {
          if (Array.isArray(filters.brand)) {
            if (filters.brand.length > 0) {
              constraints.push(where('brand', 'in', filters.brand));
            }
          } else {
            constraints.push(where('brand', '==', filters.brand));
          }
        }
        
        if (filters.model) {
          constraints.push(where('model', '==', filters.model));
        }
        
        if (filters.minYear) {
          constraints.push(where('year', '>=', filters.minYear));
        }
        
        if (filters.maxYear) {
          constraints.push(where('year', '<=', filters.maxYear));
        }
        
        if (filters.fuelType) {
          if (Array.isArray(filters.fuelType)) {
            if (filters.fuelType.length > 0) {
              constraints.push(where('fuelType', 'in', filters.fuelType));
            }
          } else {
            constraints.push(where('fuelType', '==', filters.fuelType));
          }
        }
        
        if (filters.bodyType) {
          if (Array.isArray(filters.bodyType)) {
            if (filters.bodyType.length > 0) {
              constraints.push(where('bodyType', 'in', filters.bodyType));
            }
          } else {
            constraints.push(where('bodyType', '==', filters.bodyType));
          }
        }
        
        if (filters.transmission) {
          constraints.push(where('transmission', '==', filters.transmission));
        }
        
        if (filters.userId) {
          constraints.push(where('userId', '==', filters.userId));
        }
      }
      
      // Add default ordering by creation date (newest first)
      constraints.push(orderBy('createdAt', 'desc'));
      
      // Execute query
      const carsQuery = query(collection(db, 'listings'), ...constraints);
      const querySnapshot = await getDocs(carsQuery);
      
      // Process results
      const carsList: CarListing[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter by price range in memory (Firestore doesn't support multiple range queries)
        const price = data.price;
        if (
          (filters?.minPrice && price < filters.minPrice) || 
          (filters?.maxPrice && price > filters.maxPrice)
        ) {
          return; // Skip this item
        }
        
        carsList.push({
          id: doc.id,
          ...data
        } as CarListing);
      });
      
      setCars(carsList);
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error fetching cars:', error);
      setError('Failed to fetch car listings: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch cars belonging to the current user
   */
  const fetchUserCars = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        setError('You must be logged in to view your listings');
        setUserCars([]);
        return;
      }
      
      const userId = currentUser.uid;
      const carsQuery = query(
        collection(db, 'listings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(carsQuery);
      const userCarsList: CarListing[] = [];
      
      querySnapshot.forEach((doc) => {
        userCarsList.push({
          id: doc.id,
          ...doc.data()
        } as CarListing);
      });
      
      setUserCars(userCarsList);
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error fetching user cars:', error);
      setError('Failed to fetch your car listings: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a single car listing by ID
   */
  const getCar = useCallback(async (id: string): Promise<CarListing | null> => {
    try {
      const carDoc = await getDoc(doc(db, 'listings', id));
      
      if (!carDoc.exists()) {
        return null;
      }
      
      return {
        id: carDoc.id,
        ...carDoc.data()
      } as CarListing;
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error getting car details:', error);
      setError('Failed to fetch car details: ' + error.message);
      return null;
    }
  }, []);

  /**
   * Add a new car listing with images
   */
  const addCar = useCallback(async (carData: CarListing, images: File[]): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        throw new Error('You must be logged in to add a listing');
      }
      
      // Add metadata and timestamps
      const newCar = {
        ...carData,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: 0
      };
      
      // Add to Firestore first to get the document ID
      const docRef = await addDoc(collection(db, 'listings'), newCar);
      const carId = docRef.id;
      
      // Upload images if any
      if (images.length > 0) {
        const imageUrls = await uploadImages(carId, images);
        
        // Update the document with image URLs
        await updateDoc(docRef, {
          imageUrls,
          mainImageUrl: imageUrls[0] // Use the first image as the main image
        });
      }
      
      // Refresh user's cars list
      await fetchUserCars();
      
      return carId;
    } catch (err) {
      console.error('Error adding car listing:', err);
      setError('Failed to add car listing: ' + (err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUserCars]);

  /**
   * Update an existing car listing
   */
  const updateCar = useCallback(async (
    id: string,
    carData: Partial<CarListing>,
    newImages?: File[]
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        throw new Error('You must be logged in to update a listing');
      }
      
      // Get the car to check ownership
      const carRef = doc(db, 'listings', id);
      const carDoc = await getDoc(carRef);
      
      if (!carDoc.exists()) {
        throw new Error('Listing not found');
      }
      
      const carOwner = carDoc.data().userId;
      
      // Verify ownership
      if (carOwner !== currentUser.uid) {
        throw new Error('You can only edit your own listings');
      }
      
      // Prepare update data
      const updateData = {
        ...carData,
        updatedAt: serverTimestamp()
      };
      
      // Upload new images if provided
      if (newImages && newImages.length > 0) {
        const newImageUrls = await uploadImages(id, newImages);
        
        // Merge with existing images or replace them
        if (carData.imageUrls) {
          updateData.imageUrls = [...carData.imageUrls, ...newImageUrls];
        } else {
          const existingImages = carDoc.data().imageUrls || [];
          updateData.imageUrls = [...existingImages, ...newImageUrls];
        }
        
        // Set main image if not already set
        if (!carData.mainImageUrl && !carDoc.data().mainImageUrl) {
          updateData.mainImageUrl = newImageUrls[0];
        }
      }
      
      // Update the document
      await updateDoc(carRef, updateData);
      
      // Refresh user's cars list
      await fetchUserCars();
    } catch (err) {
      console.error('Error updating car listing:', err);
      setError('Failed to update car listing: ' + (err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUserCars]);

  /**
   * Delete a car listing and its images
   */
  const deleteCar = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        throw new Error('You must be logged in to delete a listing');
      }
      
      // Get the car to check ownership and image URLs
      const carRef = doc(db, 'listings', id);
      const carDoc = await getDoc(carRef);
      
      if (!carDoc.exists()) {
        throw new Error('Listing not found');
      }
      
      const carData = carDoc.data();
      const carOwner = carData.userId;
      
      // Verify ownership
      if (carOwner !== currentUser.uid) {
        throw new Error('You can only delete your own listings');
      }
      
      // Delete images from storage
      const imageUrls = carData.imageUrls || [];
      for (const imageUrl of imageUrls) {
        try {
          // Extract file path from URL
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (imageErr) {
          console.warn('Error deleting image:', imageErr);
          // Continue with other images and document deletion
        }
      }
      
      // Delete the document from Firestore
      await deleteDoc(carRef);
      
      // Refresh user's cars list
      await fetchUserCars();
    } catch (err) {
      console.error('Error deleting car listing:', err);
      setError('Failed to delete car listing: ' + (err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUserCars]);

  /**
   * Helper function to upload images to Firebase Storage
   */
  const uploadImages = async (carId: string, images: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    for (const image of images) {
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `car-images/${carId}/${Date.now()}_${image.name}`);
      
      // Upload the file
      const uploadTask = uploadBytesResumable(storageRef, image);
      
      // Wait for upload to complete
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Optional: Track progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload progress: ${progress}%`);
          },
          (error) => {
            reject(error);
          },
          async () => {
            // Upload completed successfully, get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            imageUrls.push(downloadURL);
            resolve();
          }
        );
      });
    }
    
    return imageUrls;
  };

  // Load cars on component mount
  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  return {
    cars,
    userCars,
    loading,
    error,
    fetchCars,
    fetchUserCars,
    addCar,
    updateCar,
    deleteCar,
    getCar
  };
};

export default useCars;