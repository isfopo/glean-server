export interface GeoMarker {
  lat: number;
  lng: number;
}

export interface Item {
  id: string;
  photo: string;
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
