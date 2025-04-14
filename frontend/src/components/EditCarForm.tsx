import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useCars, { Car } from '../hooks/useCars';
import { useAuth } from '../contexts/AuthContext';
import Notification from './Notification';

// Common options for dropdowns
const BRANDS = [
  'Audi', 'BMW', 'Citroen', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai', 
  'Kia', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Renault', 
  'Seat', 'Skoda', 'Toyota', 'Volkswagen', 'Volvo', 'Other'
];

const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'Semi-Automatic'];
const BODY_TYPES = ['Sedan', 'Hatchback', 'Estate', 'SUV', 'Coupe', 'Convertible', 'Van', 'Pickup'];

interface FormData extends Omit<Car, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'views'> {
  id?: string;
}

const EditCarForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { fetchCarById, updateCar, loading, error } = useCars();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    mileage: 0,
    fuelType: '',
    transmission: '',
    description: '',
    images: [],
    status: 'active'
  });
  
  // UI state
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch car data
  useEffect(() => {
    const loadCar = async () => {
      if (id) {
        const car = await fetchCarById(id);
        if (car) {
          setFormData({
            title: car.title || '',
            brand: car.brand || '',
            model: car.model || '',
            year: car.year || new Date().getFullYear(),
            price: car.price || 0,
            mileage: car.mileage || 0,
            fuelType: car.fuelType || '',
            transmission: car.transmission || '',
            description: car.description || '',
            images: car.images || [],
            mainImage: car.mainImage,
            location: car.location,
            bodyType: car.bodyType,
            engineCapacity: car.engineCapacity,
            power: car.power,
            color: car.color,
            features: car.features,
            status: car.status
          });
        } else {
          // Car not found or user does not have permission
          setNotification({
            type: 'error',
            message: 'Cannot find car listing or you do not have permission to edit it.'
          });
          navigate('/dashboard');
        }
      }
    };

export default EditCarForm;
    
    loadCar();
  }, [id, fetchCarById, navigate]);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number inputs
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages(files);
      
      // Create previews
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };
  
  // Remove existing image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      mainImage: prev.mainImage === prev.images[index] 
        ? (prev.images.length > 1 ? prev.images[index === 0 ? 1 : 0] : undefined) 
        : prev.mainImage
    }));
  };
  
  // Set main image
  const setAsMainImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      mainImage: url
    }));
  };
  
  // Remove new image (before upload)
  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    
    // Release object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!currentUser) {
      setNotification({
        type: 'error',
        message: 'You must be logged in to update a car.'
      });
      return;
    }
    
    if (!formData.brand || !formData.model || !formData.price) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields.'
      });
      return;
    }
    
    try {
      if (id) {
        await updateCar(id, formData, newImages);
        setNotification({
          type: 'success',
          message: 'Car listing updated successfully!'
        });
        
        // Clear new images after successful upload
        setNewImages([]);
        setImagePreviews([]);
        
        // Navigate to car details or dashboard
        setTimeout(() => {
          navigate(`/cars/${id}`);
        }, 2000);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to update car listing. Please try again.'
      });
    }
  };
  
  if (!id) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="font-semibold">Error</p>
        <p>No car ID provided. Cannot edit this listing.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Edit Car Listing</h1>
      
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Title */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title*
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., 2019 Audi A4 2.0 TDI Premium"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand*
            </label>
            <select
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Brand</option>
              {BRANDS.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model*
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g., A4, Golf, Corolla"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year*
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (PLN)*
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* Mileage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mileage (km)*
            </label>
            <input
              type="number"
              name="mileage"
              value={formData.mileage}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* Fuel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Type
            </label>
            <select
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Fuel Type</option>
              {FUEL_TYPES.map(fuel => (
                <option key={fuel} value={fuel}>{fuel}</option>
              ))}
            </select>
          </div>
          
          {/* Transmission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transmission
            </label>
            <select
              name="transmission"
              value={formData.transmission}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Transmission</option>
              {TRANSMISSIONS.map(transmission => (
                <option key={transmission} value={transmission}>{transmission}</option>
              ))}
            </select>
          </div>
          
          {/* Body Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body Type
            </label>
            <select
              name="bodyType"
              value={formData.bodyType || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Body Type</option>
              {BODY_TYPES.map(bodyType => (
                <option key={bodyType} value={bodyType}>{bodyType}</option>
              ))}
            </select>
          </div>
          
          {/* Engine Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Engine Capacity (cc)
            </label>
            <input
              type="number"
              name="engineCapacity"
              value={formData.engineCapacity || ''}
              onChange={handleChange}
              min="0"
              step="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Power */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Power (HP)
            </label>
            <input
              type="number"
              name="power"
              value={formData.power || ''}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              name="color"
              value={formData.color || ''}
              onChange={handleChange}
              placeholder="e.g., Black, Silver, Red"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              placeholder="e.g., Warsaw, Krakow"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Provide detailed information about the car..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Image Upload & Management */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images
          </label>
          
          {/* Existing Images */}
          {formData.images.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className={`aspect-w-16 aspect-h-9 rounded-md overflow-hidden border-2 ${url === formData.mainImage ? 'border-blue-500' : 'border-gray-200'}`}>
                      <img
                        src={url}
                        alt={`Car ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        {url !== formData.mainImage && (
                          <button
                            type="button"
                            onClick={() => setAsMainImage(url)}
                            className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600"
                            title="Set as main image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          title="Remove image"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {url === formData.mainImage && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">
                        Main
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* New Image Upload */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add New Images</h3>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="imageUpload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 5MB)</p>
                </div>
                <input
                  id="imageUpload"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            </div>
          </div>
          
          {/* New Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">New Images to Upload</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden border-2 border-gray-200">
                      <img
                        src={preview}
                        alt={`New upload ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {uploadError && (
            <div className="mt-2 text-sm text-red-600">
              {uploadError}
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : 'Update Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};