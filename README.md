# Glean ATproto Server

A TypeScript-based ATproto server built with Node.js and Express for managing items with photos and geolocations, along with user profiles.

## Features

- **ATproto-compliant lexicons** for items and user profiles
- **Item management** with photo uploads and geolocation
- **User authentication** and profile management
- **Location-based queries** for finding nearby items
- **File upload support** for photos and profile images
- **Session management** with JWT-like tokens
- **TypeScript** for type safety
- **Modular architecture** with separate routes and middleware

## Project Structure

```
src/
├── lexicons/           # ATproto lexicon definitions
│   ├── item.json      # Item record schema
│   └── profile.json   # User profile schema
├── lib/               # Core libraries
│   └── repository.ts  # Data management and ATproto operations
├── middleware/        # Express middleware
│   └── auth.ts       # Authentication middleware
├── routes/           # API route handlers
│   ├── auth.ts      # Authentication endpoints
│   ├── items.ts     # Item management endpoints
│   └── users.ts     # User management endpoints
├── types/           # TypeScript type definitions
│   └── index.ts     # Shared interfaces and types
└── server.ts        # Main server entry point
```

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd /path/to/your/project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Authentication

#### Create Account
```http
POST /api/auth/createAccount
Content-Type: application/json

{
  "handle": "john.doe",
  "password": "secure_password",
  "email": "john@example.com",
  "profile": {
    "displayName": "John Doe",
    "description": "A new user"
  }
}
```

#### Login
```http
POST /api/auth/createSession
Content-Type: application/json

{
  "identifier": "john.doe",
  "password": "secure_password"
}
```

#### Get Session
```http
GET /api/auth/getSession
Authorization: Bearer <access_token>
```

#### Logout
```http
POST /api/auth/deleteSession
Authorization: Bearer <access_token>
```

### Items

#### Create Item
```http
POST /api/items
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

photo: <image_file>
geomarker: {"lat": 37.7749, "lng": -122.4194, "accuracy": 10}
title: "Sample Item"
description: "A description of the item"
```

#### Get All Items
```http
GET /api/items
```

#### Get Items by Location
```http
GET /api/items/location?lat=37.7749&lng=-122.4194&radius=5
```

#### Get Specific Item
```http
GET /api/items/:id
```

#### Delete Item
```http
DELETE /api/items/:id
Authorization: Bearer <access_token>
```

### Users

#### Get All Users
```http
GET /api/users
```

#### Get User Profile
```http
GET /api/users/:handle_or_did
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

displayName: "Updated Name"
description: "Updated bio"
avatar: <image_file>
```

#### Delete Account
```http
DELETE /api/users/account
Authorization: Bearer <access_token>
```

## Lexicon Schemas

### Item Schema (`app.gleam.item`)

```json
{
  "lexicon": 1,
  "id": "app.gleam.item",
  "defs": {
    "main": {
      "type": "record",
      "description": "An item with photo and location information",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["id", "photo", "geomarker", "createdAt"],
        "properties": {
          "id": { "type": "string" },
          "photo": {
            "type": "blob",
            "accept": ["image/png", "image/jpeg", "image/webp"],
            "maxSize": 10000000
          },
          "geomarker": { "type": "ref", "ref": "#geomarker" },
          "title": { "type": "string", "maxLength": 300 },
          "description": { "type": "string", "maxLength": 1000 },
          "createdAt": { "type": "string", "format": "datetime" }
        }
      }
    },
    "geomarker": {
      "type": "object",
      "required": ["lat", "lng"],
      "properties": {
        "lat": { "type": "number", "minimum": -90, "maximum": 90 },
        "lng": { "type": "number", "minimum": -180, "maximum": 180 },
        "accuracy": { "type": "number", "minimum": 0 }
      }
    }
  }
}
```

### Profile Schema (`app.gleam.actor.profile`)

```json
{
  "lexicon": 1,
  "id": "app.gleam.actor.profile",
  "defs": {
    "main": {
      "type": "record",
      "key": "literal:self",
      "record": {
        "type": "object",
        "properties": {
          "displayName": { "type": "string", "maxLength": 64 },
          "avatar": {
            "type": "blob",
            "accept": ["image/png", "image/jpeg", "image/webp"],
            "maxSize": 1000000
          },
          "points": { "type": "number" }
        }
      }
    }
  }
}
```

## Example Usage

### Creating a User and Item

```typescript
// 1. Create account
const accountResponse = await fetch('http://localhost:3000/api/auth/createAccount', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    handle: 'photographer123',
    password: 'secure_pass',
    profile: {
      displayName: 'Amazing Photographer',
      description: 'I love taking photos of interesting items!'
    }
  })
});

const { accessJwt } = await accountResponse.json();

// 2. Create an item with photo and location
const formData = new FormData();
formData.append('photo', photoFile);
formData.append('geomarker', JSON.stringify({
  lat: 37.7749,
  lng: -122.4194,
  accuracy: 10
}));
formData.append('title', 'Vintage Camera');
formData.append('description', 'Found this amazing vintage camera at a flea market');

const itemResponse = await fetch('http://localhost:3000/api/items', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessJwt}` },
  body: formData
});

const newItem = await itemResponse.json();
console.log('Created item:', newItem);
```

### Querying Items by Location

```typescript
// Find items within 5km of San Francisco city center
const response = await fetch(
  'http://localhost:3000/api/items/location?lat=37.7749&lng=-122.4194&radius=5'
);
const nearbyItems = await response.json();
console.log('Found', nearbyItems.length, 'items nearby');
```

## Development Notes

### Current Implementation

- **In-memory storage** using Maps (suitable for development/testing)
- **Simplified authentication** (no password hashing for demo)
- **Base64 image storage** (works but not ideal for production)
- **Basic session management** using UUID tokens

### Production Considerations

For production deployment, consider:

1. **Database integration** (PostgreSQL, MongoDB, etc.)
2. **Proper password hashing** (bcrypt, argon2)
3. **Image storage service** (AWS S3, Cloudinary, etc.)
4. **Real JWT implementation** with proper signing
5. **Rate limiting** and DDoS protection
6. **Input validation** and sanitization
7. **HTTPS enforcement**
8. **Logging and monitoring**
9. **Backup and recovery**
10. **Horizontal scaling** considerations

### Adding Features

The modular structure makes it easy to extend:

- Add new lexicons in `src/lexicons/`
- Create new routes in `src/routes/`
- Add middleware in `src/middleware/`
- Define new types in `src/types/`

## Health Check

The server provides a health check endpoint:

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-18T01:46:16.000Z",
  "version": "1.0.0"
}
```

## License

ISC
