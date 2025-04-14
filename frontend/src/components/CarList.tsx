import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCars, { Car, SearchParams } from '../hooks/useCars';
import { useAuth } from '../contexts/AuthContext';

// Card component for individual car listing
const CarCard: React.FC<{ car: Car; onEdit?: () => void; onDelete?: () => void; showActions?: boolean }> = ({ 
  car, 
  onEdit, 
  onDelete,
  showActions = false
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);
  };

  const formatMileage = (mileage: number): string => {
    return new Intl.NumberFormat('pl-PL').format(mileage) + ' km';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg">
      <Link to={`/cars/${car.id}`} className="block">
        <div className="relative aspect-w-16 aspect-h-9">
          {car.mainImage ? (
            <img 
              src={car.mainImage} 
              alt={`${car.brand} ${car.model}`} 
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
          {car.status === 'sold' && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              SOLD
            </div>
          )}
          {car.status === 'inactive' && (
            <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded">
              INACTIVE
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/cars/${car.id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
            {car.brand} {car.model} ({car.year})
          </h3>
          
          <div className="mt-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>{formatMileage(car.mileage)}</span>
              <span>•</span>
              <span>{car.fuelType}</span>
              <span>•</span>
              <span>{car.transmission}</span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(car.price)}
            </p>
            <div className="text-xs text-gray-500">
              {car.createdAt ? new Date(car.createdAt).toLocaleDateString() : 'Recently added'}
            </div>
          </div>
        </Link>
        
        {showActions && (
          <div className="mt-4 flex space-x-2">
            <button
              onClick={onEdit}
              className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface CarListProps {
  searchParams?: SearchParams;
  showUserCarsOnly?: boolean;
  showActions?: boolean;
}

const CarList: React.FC<CarListProps> = ({ 
  searchParams, 
  showUserCarsOnly = false,
  showActions = false 
}) => {
  const { cars, loading, error, fetchCars, fetchUserCars, deleteCar } = useCars();
  const { currentUser } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (showUserCarsOnly && currentUser) {
      fetchUserCars();
    } else {
      fetchCars(searchParams);
    }
  }, [fetchCars, fetchUserCars, searchParams, showUserCarsOnly, currentUser]);

  const handleEdit = (carId: string) => {
    window.location.href = `/edit-car/${carId}`;
  };

  const handleDelete = (carId: string) => {
    setConfirmDelete(carId);
  };

  const confirmDeleteCar = async () => {
    if (confirmDelete) {
      try {
        await deleteCar(confirmDelete);
        setConfirmDelete(null);
      } catch (err) {
        console.error('Failed to delete car:', err);
      }
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
        <h3 className="text-lg font-medium text-gray-600 mb-2">No cars found</h3>
        <p className="text-gray-500 mb-4">
          {showUserCarsOnly 
            ? "You haven't added any cars yet."
            : "No cars match your search criteria."}
        </p>
        {showUserCarsOnly && (
          <Link 
            to="/add-car" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Your First Car
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <CarCard 
            key={car.id} 
            car={car}
            showActions={showActions}
            onEdit={() => car.id && handleEdit(car.id)}
            onDelete={() => car.id && handleDelete(car.id)} 
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4 w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this car listing? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCar}
                className="px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarList;