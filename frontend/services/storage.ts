import { 
    ref, 
    uploadBytesResumable, 
    getDownloadURL, 
    deleteObject, 
    UploadTaskSnapshot 
  } from 'firebase/storage';
  import { storage } from '../config/firebase';
  
  export interface UploadProgressCallback {
    (snapshot: UploadTaskSnapshot): void;
  }
  
  export interface ErrorCallback {
    (error: Error): void;
  }
  
  export interface SuccessCallback {
    (downloadURL: string): void;
  }
  
  /**
   * Upload a file to Firebase Storage
   * 
   * @param file The file to upload
   * @param path The path in storage where the file will be stored
   * @param onProgress Callback function to track upload progress
   * @param onError Callback function to handle errors
   * @param onSuccess Callback function when upload is complete
   * @returns The upload task that can be used to pause, resume, or cancel the upload
   */
  export const uploadFile = (
    file: File,
    path: string,
    onProgress?: UploadProgressCallback,
    onError?: ErrorCallback,
    onSuccess?: SuccessCallback
  ) => {
    // Create storage reference
    const storageRef = ref(storage, path);
    
    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Register event handlers
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Call progress callback if provided
        if (onProgress) {
          onProgress(snapshot);
        }
      },
      (error) => {
        // Call error callback if provided
        if (onError) {
          onError(error);
        }
      },
      () => {
        // Upload completed successfully, get download URL
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          // Call success callback if provided
          if (onSuccess) {
            onSuccess(downloadURL);
          }
        });
      }
    );
    
    return uploadTask;
  };
  
  /**
   * Delete a file from Firebase Storage by URL
   * 
   * @param url The download URL of the file to delete
   * @returns A promise that resolves when the file is deleted
   */
  export const deleteFileByUrl = async (url: string): Promise<void> => {
    try {
      // Get the storage reference from the URL
      const storageRef = ref(storage, url);
      
      // Delete the file
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };
  
  /**
   * Generate a unique file path for storage
   * 
   * @param folder The folder to store the file in
   * @param filename The original filename
   * @returns A unique path for the file
   */
  export const generateFilePath = (folder: string, filename: string): string => {
    const timestamp = Date.now();
    const extension = filename.split('.').pop();
    return `${folder}/${timestamp}_${Math.random().toString(36).substring(2, 10)}.${extension}`;
  };
  
  export default {
    uploadFile,
    deleteFileByUrl,
    generateFilePath
  };