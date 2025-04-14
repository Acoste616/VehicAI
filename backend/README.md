# VehicAI API

A RESTful API for the VehicAI car listings platform built with Express.js and Firebase.

## Features

- Full CRUD operations for car listings
- Data validation and error handling
- Firebase Firestore integration
- RESTful API endpoints with proper HTTP status codes
- Filtering capabilities for car listings

## Prerequisites

- Node.js 16.x or higher
- Firebase project with Firestore database

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vehicai-api.git
cd vehicai-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project in the Firebase Console
   - Generate a private key for Admin SDK (Project Settings > Service Accounts > Generate new private key)
   - Save the key as `serviceAccountKey.json` in the project root directory

4. Create a `.env` file based on the provided `.env.example`:
```bash
cp .env.example .env
```

5. Update the `.env` file with your Firebase project details.

## Running the API

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### List Car Listings
```
GET /cars
```
Query parameters:
- `brand`: Filter by car brand
- `model`: Filter by car model
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `minYear`: Minimum year
- `maxYear`: Maximum year
- `fuelType`: Filter by fuel type
- `bodyType`: Filter by body type
- `limit`: Number of records to return (default: 20)
- `offset`: Offset for pagination

### Get Single Car Listing
```
GET /cars/:id
```
Where `:id` is the Firestore document ID of the car listing.

### Create Car Listing
```
POST /cars
```
Request body example:
```json
{
  "brand": "BMW",
  "model": "3 Series",
  "year": 2019,
  "price": 129900,
  "mileage": 45000,
  "fuelType": "Benzyna",
  "transmission": "Automatyczna",
  "engineCapacity": 1998,
  "power": 190,
  "visualCondition": 5,
  "description": "BMW serii 3 G20 w idealnym stanie...",
  "imageUrls": [
    "https://example.com/images/car1.jpg",
    "https://example.com/images/car2.jpg"
  ],
  "mainImageUrl": "https://example.com/images/car1.jpg",
  "bodyType": "Sedan",
  "features": [
    "Klimatyzacja automatyczna",
    "Skórzana tapicerka"
  ]
}
```

### Update Car Listing
```
PUT /cars/:id
```
Request body should contain only the fields to be updated.

### Delete Car Listing
```
DELETE /cars/:id
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "count": 10,  // Only for list responses
  "message": "Operation successful message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "errors": [ ... ]  // Validation errors array, if applicable
}
```

## HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## License

MIT