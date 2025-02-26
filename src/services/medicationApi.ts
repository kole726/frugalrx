import { getAuthToken } from '@/utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const AMERICAS_PHARMACY_API_URL = process.env.NEXT_PUBLIC_AMERICAS_PHARMACY_API_URL;

interface DrugSearchResponse {
  drugName: string;
  gsn?: number;
}

interface DrugPriceRequest {
  drugName: string;
  latitude: number;
  longitude: number;
  radius?: number;
  hqMappingName?: string;
}

interface PharmacyPrice {
  name: string;
  price: number;
  distance: string;
}

interface DrugPriceResponse {
  pharmacies: PharmacyPrice[];
}

interface DrugDetails {
  brandName: string;
  genericName: string;
  description: string;
  sideEffects: string;
  dosage: string;
  storage: string;
  contraindications: string;
}

/**
 * Search for medications by name
 * @param query The search query
 * @returns A list of matching medications
 */
export async function searchMedications(query: string): Promise<DrugSearchResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/drugs/search/${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch medications: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching medications:', error);
    throw error;
  }
}

/**
 * Search for drugs directly from the Americas Pharmacy API
 * @param query The search query
 * @returns A list of matching drugs
 */
export async function searchDrugs(query: string) {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${AMERICAS_PHARMACY_API_URL}/drugs/${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search drugs: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching drugs:', error);
    throw error;
  }
}

/**
 * Get prices for a medication at nearby pharmacies
 * @param criteria The search criteria
 * @returns Price information for the medication
 */
export async function getDrugPrices(criteria: DrugPriceRequest): Promise<DrugPriceResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/drugs/prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drugName: criteria.drugName,
        latitude: criteria.latitude,
        longitude: criteria.longitude,
        radius: criteria.radius || 10,
        hqMappingName: criteria.hqMappingName || 'walkerrx'
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch drug prices: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching drug prices:', error);
    throw error;
  }
}

/**
 * Get detailed information about a medication by GSN
 * @param gsn The GSN (Generic Sequence Number) of the medication
 * @returns Detailed information about the medication
 */
export async function getDrugDetailsByGsn(gsn: number): Promise<DrugDetails> {
  try {
    const response = await fetch(`${API_BASE_URL}/drugs/info/${gsn}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch drug details: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching drug details:', error);
    throw error;
  }
}

/**
 * Get detailed information about a medication by name
 * @param drugName The name of the medication
 * @returns Detailed information about the medication
 */
export async function getDrugInfo(drugName: string) {
  try {
    // First search for the drug to get its GSN
    const searchResults = await searchMedications(drugName);
    if (!searchResults || searchResults.length === 0) {
      throw new Error('Drug not found');
    }

    // Get the first matching drug's GSN
    const drug = searchResults[0];
    if (!drug.gsn) {
      throw new Error('Drug GSN not available');
    }

    // Now fetch the drug info using the GSN
    return await getDrugDetailsByGsn(drug.gsn);
  } catch (error) {
    console.error('Error fetching drug info:', error);
    throw error;
  }
}

/**
 * Test the API connection with the Americas Pharmacy API
 * @returns true if the connection is successful, false otherwise
 */
export async function testApiConnection() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`https://api.americaspharmacy.com/pricing/v1/drugs/amo`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Connection Test:', data);
    return true;
  } catch (error) {
    console.error('API Connection Test Failed:', error);
    return false;
  }
} 