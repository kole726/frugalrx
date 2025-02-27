export interface DrugPriceRequest {
  drugName?: string;
  gsn?: number;
  ndcCode?: string | number;
  latitude: number;
  longitude: number;
  radius?: number;
  hqMappingName?: string;
  maximumPharmacies?: number;
  customizedQuantity?: boolean;
  quantity?: number;
}

export interface DrugInfo {
  brandName: string;
  genericName: string;
  gsn: number;
  ndcCode: string;
  strength?: string;
  form?: string;
  packageSize?: string;
  manufacturer?: string;
  description?: string;
  sideEffects?: string;
  dosage?: string;
  storage?: string;
  contraindications?: string;
  prices?: PharmacyPrice[];
}

export interface DrugPrice {
  price: number;
  pharmacy: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
}

export interface PharmacyPrice {
  name: string;
  price: number;
  distance: string;
}

export interface DrugPriceResponse {
  pharmacies: PharmacyPrice[];
}

export interface DrugDetails {
  brandName: string;
  genericName: string;
  description: string;
  sideEffects: string;
  dosage: string;
  storage: string;
  contraindications: string;
  admin?: string;        // Administration information
  disclaimer?: string;   // Disclaimer information
  interaction?: string;  // Drug interactions
  missedD?: string;      // Missed dose information
  monitor?: string;      // Monitoring requirements
  side?: string;         // Alternative field for side effects
  store?: string;        // Alternative field for storage
}

export interface APIError {
  message: string;
  status: number;
} 