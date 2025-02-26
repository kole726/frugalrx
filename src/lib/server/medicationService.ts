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
    const token = await getAuthToken();
    
    const response = await fetch(`${process.env.AMERICAS_PHARMACY_API_URL}/drugs/names`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: 'walkerrx',
        prefixText: query
      }),
    });

    if (!response.ok) {
      throw new Error(`${response.status}`);
    }

    const data = await response.json();
    
    // Format the response to match the expected interface
    if (Array.isArray(data)) {
      return data.map(drugName => ({
        drugName: drugName
      }));
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