'use server';

import { getAuthToken } from './auth';
import { DrugPriceRequest, DrugPriceResponse, DrugDetails } from '@/types/api';

// Define the drug search response interface since it's not in the API types
interface DrugSearchResponse {
  drugName: string;
  gsn?: number;
}

const AMERICAS_PHARMACY_API_URL = process.env.AMERICAS_PHARMACY_API_URL;

/**
 * Search for drugs directly from the Americas Pharmacy API
 * @param query The search query
 * @returns A list of matching drugs
 */
export async function searchDrugs(query: string): Promise<DrugSearchResponse[]> {
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
    const token = await getAuthToken();
    
    const response = await fetch(`${AMERICAS_PHARMACY_API_URL}/drugprices/byName`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    const token = await getAuthToken();
    
    const response = await fetch(`${AMERICAS_PHARMACY_API_URL}/druginfo/${gsn}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

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
 * Test the API connection with the Americas Pharmacy API
 * @returns true if the connection is successful, false otherwise
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${AMERICAS_PHARMACY_API_URL}/drugs/amo`, {
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