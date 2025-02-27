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
  type?: string; // Type of pharmacy (retail, mail-order, specialty, etc.)
  open24Hours?: boolean; // Whether the pharmacy is open 24 hours
  hasDelivery?: boolean; // Whether the pharmacy offers delivery services
  acceptsInsurance?: boolean; // Whether the pharmacy accepts insurance
  [key: string]: any; // For any additional properties that might be present
} 