export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  hours?: string;
  website?: string;
  [key: string]: any; // For any additional properties that might be present
} 