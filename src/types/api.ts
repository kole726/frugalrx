export interface DrugPriceRequest {
  drugName: string;
  latitude: number;
  longitude: number;
  radius: number;
  hqMappingName: string;
  maximumPharmacies?: number;
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
  prices?: DrugPrice[];
}

export interface DrugPrice {
  price: number;
  pharmacy: {
    name: string;
    address: string;
    distance: number;
    latitude: number;
    longitude: number;
  };
}

export interface APIError {
  message: string;
  status: number;
} 