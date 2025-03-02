import { DrugInfo, DrugDetails, PharmacyPrice, DrugPriceResponse } from '@/types/api';
import { findGsnByDrugName } from '@/lib/drug-gsn-mapping';
import { MOCK_DRUG_DATA, MOCK_DRUG_DATA_BY_GSN } from '@/lib/mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

interface DrugSearchResponse {
  drugName: string;
  gsn?: number;
}

interface DrugPriceRequest {
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

/**
 * Search for medications by name
 * @param query The search query
 * @returns A list of matching medications
 */
export async function searchMedications(query: string): Promise<DrugSearchResponse[]> {
  try {
    // Convert query to lowercase before encoding to ensure consistent URL format
    const normalizedQuery = query.toLowerCase();
    console.log(`Client: Searching for medications with query: "${normalizedQuery}"`);
    
    // Use the enhanced search endpoint that combines API results with GSN mapping
    const apiEndpoint = `${API_BASE_URL}/drugs/search?q=${encodeURIComponent(normalizedQuery)}`;
    
    console.log(`Using API endpoint: ${apiEndpoint}`);
    const response = await fetch(apiEndpoint);
    
    if (!response.ok) {
      let errorMessage = `Failed to fetch medications: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error as JSON, use the status code
        console.error('Could not parse error response as JSON:', e);
      }
      
      console.error(`Client: API error when searching for "${normalizedQuery}":`, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`Client: Received search results:`, data);
    
    // Return the results array from the response
    const results = data.results || [];
    console.log(`Client: Found ${results.length} results for "${normalizedQuery}"`);
    
    return results;
  } catch (error) {
    console.error('Client: Error searching medications:', error);
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
 * Get prices for a medication by NDC code
 * @param ndcCode The NDC code of the medication
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param radius Search radius in miles (optional)
 * @param quantity Medication quantity (optional)
 * @returns Price information for the medication
 */
export async function getDrugPricesByNdc(
  ndcCode: string,
  latitude: number,
  longitude: number,
  radius?: number,
  quantity?: number
): Promise<DrugPriceResponse> {
  try {
    const request = {
      ndcCode,
      latitude,
      longitude,
      radius,
      customizedQuantity: quantity ? true : undefined,
      quantity
    };

    const response = await fetch(`${API_BASE_URL}/drugs/prices/ndc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch drug prices by NDC: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching drug prices by NDC:', error);
    throw error;
  }
}

/**
 * Get detailed information about a medication by GSN
 * @param gsn The Generic Sequence Number of the medication
 * @returns Detailed information about the medication
 */
export async function getDetailedDrugInfo(gsn: number): Promise<any> {
  try {
    console.log(`Client: Getting detailed drug info for GSN: ${gsn}`);
    
    // Make the API request to our Next.js API route
    const response = await fetch(`/api/drugs/info/gsn?gsn=${gsn}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store' // Ensure we don't use cached responses
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Client: Drug info API error: ${response.status}`, errorText);
      throw new Error(`${response.status}: ${errorText || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log(`Client: Received drug info for GSN ${gsn}:`, data);
    
    return data;
  } catch (error) {
    console.error('Client: Error getting detailed drug info:', error);
    
    // Fall back to mock data if available
    if (process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK === 'true' || process.env.NEXT_PUBLIC_USE_MOCK_DRUG_INFO === 'true') {
      console.log(`Client: Falling back to mock data for GSN: ${gsn}`);
      
      // Use mock data from our predefined set
      const mockData = MOCK_DRUG_DATA_BY_GSN[gsn] || {
        brandName: `Medication ${gsn}`,
        genericName: `Generic Medication ${gsn}`,
        description: `This is a medication with GSN ${gsn}. Please consult with your healthcare provider for specific information.`,
        sideEffects: "Side effects may vary. Please consult with your healthcare provider for detailed information.",
        dosage: "Various strengths available",
        storage: "Store according to package instructions.",
        contraindications: "Please consult with your healthcare provider for contraindication information."
      };
      
      return mockData;
    }
    
    throw error;
  }
}

/**
 * Get detailed information about a medication by name
 * @param drugName The name of the medication
 * @param languageCode Optional language code for localized information
 * @returns Detailed information about the medication
 */
export async function getDrugInfo(drugName: string, languageCode?: string): Promise<DrugDetails> {
  try {
    // Normalize drug name to lowercase for API requests
    const normalizedDrugName = drugName.toLowerCase();
    console.log(`Client: Getting drug info for: "${normalizedDrugName}"`);
    
    // Build the URL with optional language code
    let url = `${API_BASE_URL}/drugs/info/name?name=${encodeURIComponent(normalizedDrugName)}`;
    
    if (languageCode) {
      url += `&languageCode=${encodeURIComponent(languageCode)}`;
    }
    
    console.log(`Using API endpoint: ${url}`);
    
    // Try to get real data from API
    const response = await fetch(url, {
      // Add cache: 'no-store' to prevent caching of failed responses
      cache: 'no-store'
    });
    
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error as JSON, use the status code
        console.error('Could not parse error response as JSON:', e);
      }
      
      console.error(`Client: API error when getting info for "${normalizedDrugName}":`, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`Client: Received drug info for "${normalizedDrugName}":`, data);
    
    // Format drug names with proper capitalization
    if (data) {
      if (data.genericName) {
        data.genericName = data.genericName.charAt(0).toUpperCase() + data.genericName.slice(1).toLowerCase();
      }
      if (data.brandName) {
        // Brand names may have multiple words, so capitalize each word
        data.brandName = data.brandName.split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching drug info:', error);
    
    // Provide a more user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // If this is a network error, provide a specific message
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network Error')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    // If this is an API error, provide a more helpful message
    if (errorMessage.includes('API error') || errorMessage.includes('401')) {
      throw new Error('Error loading drug information. Our service is currently experiencing issues. Please try again later.');
    }
    
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

/**
 * Compare multiple medications
 * @param medications Array of medication names or GSNs to compare
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param radius Search radius in miles (optional)
 * @returns Comparison data for the medications
 */
export async function compareMedicationsClient(
  medications: Array<{ name?: string; gsn?: number }>,
  latitude: number,
  longitude: number,
  radius?: number
): Promise<Array<DrugInfo & { prices: PharmacyPrice[] }>> {
  try {
    if (!medications || medications.length === 0) {
      throw new Error('No medications provided for comparison');
    }

    const response = await fetch(`${API_BASE_URL}/drugs/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        medications,
        latitude,
        longitude,
        radius
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to compare medications: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error comparing medications:', error);
    throw error;
  }
}

/**
 * Get alternative medications (generics or therapeutic alternatives)
 * @param drugName The name of the medication
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param includeGenerics Whether to include generic alternatives
 * @param includeTherapeutic Whether to include therapeutic alternatives
 * @returns A list of alternative medications with price information
 */
export async function getMedicationAlternatives(
  drugName: string,
  latitude: number,
  longitude: number,
  includeGenerics: boolean = true,
  includeTherapeutic: boolean = false
): Promise<Array<DrugInfo & { prices: PharmacyPrice[] }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/drugs/alternatives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drugName,
        latitude,
        longitude,
        includeGenerics,
        includeTherapeutic
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch medication alternatives: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching medication alternatives:', error);
    
    // If the API fails, return mock data
    // This is just for demonstration purposes
    const mockAlternatives = [];
    
    // Create a mock generic alternative
    if (includeGenerics) {
      const genericName = drugName.toLowerCase();
      mockAlternatives.push({
        brandName: `Generic ${drugName}`,
        genericName: genericName,
        gsn: 12345, // Mock GSN
        ndcCode: 'NDC-12345',
        description: `Generic version of ${drugName}`,
        sideEffects: `Similar side effects to ${drugName}`,
        dosage: `Same dosage as ${drugName}`,
        storage: `Store at room temperature`,
        contraindications: `Similar contraindications to ${drugName}`,
        prices: [
          { name: "Walgreens", price: 8.99, distance: "0.8 miles" },
          { name: "CVS Pharmacy", price: 9.50, distance: "1.2 miles" },
          { name: "Walmart Pharmacy", price: 6.99, distance: "2.5 miles" },
          { name: "Rite Aid", price: 10.75, distance: "3.1 miles" },
          { name: "Target Pharmacy", price: 7.25, distance: "4.0 miles" }
        ]
      });
    }
    
    // Create a mock therapeutic alternative
    if (includeTherapeutic) {
      mockAlternatives.push({
        brandName: `Alternative to ${drugName}`,
        genericName: `therapeutic-alt-${drugName.toLowerCase()}`,
        gsn: 67890, // Mock GSN
        ndcCode: 'NDC-67890',
        description: `Therapeutic alternative to ${drugName}`,
        sideEffects: `Different side effect profile than ${drugName}`,
        dosage: `Dosage may differ from ${drugName}`,
        storage: `Store at room temperature`,
        contraindications: `May have different contraindications than ${drugName}`,
        prices: [
          { name: "Walgreens", price: 10.99, distance: "0.8 miles" },
          { name: "CVS Pharmacy", price: 11.50, distance: "1.2 miles" },
          { name: "Walmart Pharmacy", price: 8.99, distance: "2.5 miles" },
          { name: "Rite Aid", price: 12.75, distance: "3.1 miles" },
          { name: "Target Pharmacy", price: 9.25, distance: "4.0 miles" }
        ]
      });
    }
    
    return mockAlternatives;
  }
}

// Mock pharmacy prices
const MOCK_PHARMACY_PRICES: PharmacyPrice[] = [
  { name: "Walgreens", price: 12.99, distance: "0.8 miles" },
  { name: "CVS Pharmacy", price: 14.50, distance: "1.2 miles" },
  { name: "Walmart Pharmacy", price: 9.99, distance: "2.5 miles" },
  { name: "Rite Aid", price: 13.75, distance: "3.1 miles" },
  { name: "Target Pharmacy", price: 11.25, distance: "4.0 miles" }
]; 