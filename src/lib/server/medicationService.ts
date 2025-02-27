'use server';

import { DrugPriceRequest, DrugInfo, DrugPrice, PharmacyPrice, DrugPriceResponse, DrugDetails, APIError } from '@/types/api';
import { getAuthToken } from './auth';

// Define the interface for drug search response
interface DrugSearchResponse {
  drugName: string;
  gsn?: number;
}

/**
 * Search for drugs by name
 * @param query The search query
 * @returns A list of matching drugs
 */
export async function searchDrugs(query: string): Promise<DrugSearchResponse[]> {
  try {
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Convert query to lowercase to ensure consistent API requests
    const normalizedQuery = query.toLowerCase();
    console.log(`Searching for drugs with query: "${normalizedQuery}" at ${apiUrl}/drugs/names`);
    
    // Get authentication token
    let token;
    try {
      token = await getAuthToken();
      console.log('Successfully obtained auth token for drug search');
    } catch (authError) {
      console.error('Authentication error:', authError);
      throw new Error(`Authentication failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
    }
    
    // Make API request
    console.log(`Making API request to ${apiUrl}/drugs/names with query: ${normalizedQuery}`);
    const response = await fetch(`${apiUrl}/drugs/names`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: 'walkerrx',
        prefixText: normalizedQuery
      }),
      cache: 'no-store' // Ensure we don't use cached responses
    });

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Drug search API error: ${response.status}`, errorText);
      console.error(`Request details: query="${normalizedQuery}", endpoint=${apiUrl}/drugs/names`);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Found ${Array.isArray(data) ? data.length : 0} drug matches for "${normalizedQuery}"`);
    
    // Format the response to match the expected interface
    if (Array.isArray(data)) {
      return data.map(drugName => {
        // Format drug name with proper capitalization (first letter uppercase, rest lowercase)
        // The API returns drug names in ALL CAPS
        const formattedName = typeof drugName === 'string' 
          ? drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase()
          : drugName;
          
        return {
          drugName: formattedName
        };
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error searching drugs:', error);
    throw new Error(`Failed to search drugs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get prices for a medication
 * @param request The drug price request
 * @returns Price information for the medication
 */
export async function getDrugPrices(request: DrugPriceRequest): Promise<DrugPriceResponse> {
  try {
    const token = await getAuthToken();
    
    // Determine which endpoint to use based on the request
    let endpoint = '/drugprices/byName';
    const body: Record<string, string | number | boolean | undefined> = {
      hqMappingName: 'walkerrx',
      latitude: request.latitude,
      longitude: request.longitude,
    };
    
    if ('gsn' in request) {
      endpoint = '/drugprices/byGSN';
      body.gsn = request.gsn;
    } else if ('drugName' in request) {
      body.drugName = request.drugName;
    }
    
    // Add optional parameters if provided
    if (request.customizedQuantity) {
      body.customizedQuantity = request.customizedQuantity;
      body.quantity = request.quantity;
    }
    
    const response = await fetch(`${process.env.AMERICAS_PHARMACY_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting drug prices:', error);
    throw new Error(`Failed to get drug prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get detailed information about a medication by GSN
 * @param gsn The Generic Sequence Number of the medication
 * @returns Detailed information about the medication
 */
export async function getDrugDetailsByGsn(gsn: number): Promise<DrugDetails> {
  try {
    const token = await getAuthToken();
    
    // For drug details, we'll use the byGSN endpoint with default coordinates
    const response = await fetch(`${process.env.AMERICAS_PHARMACY_API_URL}/drugprices/byGSN`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: 'walkerrx',
        gsn: gsn,
        latitude: 30.4014,  // Default latitude
        longitude: -97.7525 // Default longitude
      }),
    });

    if (!response.ok) {
      throw new Error(`${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting drug details:', error);
    throw new Error(`Failed to get drug details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test the connection to the Americas Pharmacy API
 * @returns True if the connection is successful, false otherwise
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    // Try to get an auth token
    const token = await getAuthToken();
    
    // If we got a token, try a simple API call to verify it works
    const response = await fetch(`${process.env.AMERICAS_PHARMACY_API_URL}/drugs/names`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: 'walkerrx',
        prefixText: 'a'  // Simple prefix to test
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}

/**
 * Get pharmacies near a specific location
 * @param latitude The latitude coordinate
 * @param longitude The longitude coordinate
 * @param pharmacyCount Optional number of pharmacies to return (default: 10)
 * @returns A list of pharmacies near the specified location
 */
export async function getPharmacies(
  latitude: number,
  longitude: number,
  pharmacyCount: number = 10
): Promise<any> {
  try {
    const token = await getAuthToken();
    
    const url = new URL(`${process.env.AMERICAS_PHARMACY_API_URL}/pharmacies`);
    url.searchParams.append('lat', latitude.toString());
    url.searchParams.append('long', longitude.toString());
    url.searchParams.append('hqmappingName', 'walkerrx');
    url.searchParams.append('pharmacyCount', pharmacyCount.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting pharmacies:', error);
    throw new Error(`Failed to get pharmacies: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get detailed information about a medication by name
 * @param drugName The name of the medication
 * @returns Detailed information about the medication
 */
export async function getDrugInfoByName(drugName: string): Promise<DrugDetails> {
  try {
    const token = await getAuthToken();
    
    // Normalize drug name to lowercase
    const normalizedDrugName = drugName.toLowerCase();
    console.log(`Getting drug info for: "${normalizedDrugName}"`);
    
    // First, search for the drug to get its GSN
    console.log(`Searching for drug with name: ${normalizedDrugName}`);
    const searchResults = await searchDrugs(normalizedDrugName);
    
    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      console.error(`No drug found with name: ${normalizedDrugName}`);
      throw new Error(`Drug not found: ${drugName}`);
    }
    
    // Find the exact match or closest match
    const exactMatch = searchResults.find(
      drug => drug.drugName.toLowerCase() === normalizedDrugName
    );
    
    const drugToUse = exactMatch || searchResults[0];
    console.log(`Using drug: ${drugToUse.drugName} for info lookup`);
    
    // If we have a GSN, use it to get detailed information
    if (drugToUse.gsn) {
      return await getDrugDetailsByGsn(drugToUse.gsn);
    }
    
    // If no GSN, we'll need to use the drug name to get prices and extract info
    const response = await fetch(`${process.env.AMERICAS_PHARMACY_API_URL}/drugprices/byName`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: 'walkerrx',
        drugName: drugToUse.drugName,
        latitude: 30.4014,  // Default latitude
        longitude: -97.7525 // Default longitude
      }),
    });

    if (!response.ok) {
      throw new Error(`${response.status}`);
    }

    const data = await response.json();
    
    // Format the response to match the DrugDetails interface
    return {
      brandName: data.brandName || drugToUse.drugName,
      genericName: data.genericName || drugToUse.drugName,
      description: data.description || `Information about ${drugToUse.drugName}`,
      sideEffects: data.sideEffects || "Please consult with your healthcare provider for information about side effects.",
      dosage: data.dosage || "Various strengths available",
      storage: data.storage || "Store according to package instructions.",
      contraindications: data.contraindications || "Please consult with your healthcare provider for contraindication information."
    };
  } catch (error) {
    console.error('Error getting drug info by name:', error);
    throw new Error(`Failed to get drug info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 