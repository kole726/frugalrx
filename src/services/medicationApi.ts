const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

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
  maximumPharmacies?: number;
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
      body: JSON.stringify(criteria),
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
 * Test the API connection
 * @returns true if the connection is successful, false otherwise
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/test-connection`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Connection Test:', data);
    return data.status === 'connected';
  } catch (error) {
    console.error('API Connection Test Failed:', error);
    return false;
  }
}

/**
 * Get pharmacies near a specific ZIP code
 * @param zipCode The ZIP code to search near
 * @returns A list of pharmacies near the specified ZIP code
 */
export async function getPharmaciesByZipCode(zipCode: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/pharmacies?zipCode=${encodeURIComponent(zipCode)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch pharmacies: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    throw error;
  }
} 