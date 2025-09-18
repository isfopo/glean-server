export interface GeoMarker {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface Item {
  id: string;
  photo: Blob | string; // Can be blob or URL
  geomarker: GeoMarker;
  title?: string;
  description?: string;
  createdAt: string;
}

export interface UserProfile {
  displayName?: string;
  avatar?: Blob | string;
  points?: number;
}

export interface User {
  did: string;
  handle: string;
  profile?: UserProfile;
  createdAt: string;
}

export interface CreateItemRequest {
  photo: Express.Multer.File;
  geomarker: GeoMarker;
  title?: string;
  description?: string;
}

export interface CreateUserRequest {
  handle: string;
  password: string;
  email?: string;
  profile?: Partial<UserProfile>;
}

export interface AuthSession {
  did: string;
  handle: string;
  accessJwt: string;
  refreshJwt: string;
}