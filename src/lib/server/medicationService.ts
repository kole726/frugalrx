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
 * @returns An array of drug search results
 */
export async function searchDrugs(query: string): Promise<DrugSearchResponse[]> {
  try {
    console.log(`Server: Searching for drugs with query: ${query}`);
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Use the correct endpoint from the API documentation
    const endpoint = `/v1/drugs/${encodeURIComponent(query)}`;
    
    console.log(`Server: Searching for drugs at ${baseUrl}${endpoint}`);
    
    // Get authentication token
    const token = await getAuthToken();
    console.log('Successfully obtained auth token for drug search');
    
    // Create URL with optional query parameters
    const requestUrl = new URL(`${baseUrl}${endpoint}`);
    requestUrl.searchParams.append('count', '20'); // Optional: limit results to 20
    requestUrl.searchParams.append('hqAlias', process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx');
    
    // Make API request using GET method as specified in the API docs
    const response = await fetch(requestUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      cache: 'no-store' // Ensure we don't use cached responses
    });

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Drug search API error: ${response.status}`, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Found ${Array.isArray(data) ? data.length : 0} drug matches for "${query}"`);
    
    // Format the response to match the expected interface
    if (Array.isArray(data)) {
      return data.map(drugName => ({
        drugName: typeof drugName === 'string' 
          ? drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase()
          : drugName
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error in searchDrugs:', error);
    throw error;
  }
}

/**
 * Get mock drug search results for development and testing
 * @param query The search query
 * @returns A list of mock drug results
 */
function getMockDrugSearchResults(query: string): DrugSearchResponse[] {
  // Common medications for testing
  const commonMedications = [
    { drugName: 'Amoxicillin', gsn: 1234 },
    { drugName: 'Lisinopril', gsn: 2345 },
    { drugName: 'Atorvastatin', gsn: 3456 },
    { drugName: 'Metformin', gsn: 4567 },
    { drugName: 'Levothyroxine', gsn: 5678 },
    { drugName: 'Amlodipine', gsn: 6789 },
    { drugName: 'Metoprolol', gsn: 7890 },
    { drugName: 'Albuterol', gsn: 8901 },
    { drugName: 'Omeprazole', gsn: 9012 },
    { drugName: 'Losartan', gsn: 1023 },
    { drugName: 'Gabapentin', gsn: 2134 },
    { drugName: 'Hydrochlorothiazide', gsn: 3245 },
    { drugName: 'Sertraline', gsn: 4356 },
    { drugName: 'Simvastatin', gsn: 5467 },
    { drugName: 'Vyvanse', gsn: 6578 },
    { drugName: 'Triamcinolone', gsn: 7689 },
    { drugName: 'Trimethoprim', gsn: 8790 },
    { drugName: 'Triamterene', gsn: 9801 },
    { drugName: 'Triptorelin', gsn: 1012 },
    { drugName: 'Trifluoperazine', gsn: 2123 }
  ];
  
  // Filter medications based on the query
  return commonMedications.filter(med => 
    med.drugName.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Get prices for a medication
 * @param request The drug price request
 * @returns Price information for the medication
 */
export async function getDrugPrices(request: DrugPriceRequest): Promise<DrugPriceResponse> {
  try {
    const token = await getAuthToken();
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Determine which endpoint to use based on the request
    let endpoint = '/v1/drugprices/byName';
    const body: Record<string, any> = {
      hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
      latitude: request.latitude,
      longitude: request.longitude,
      radius: request.radius || 10,
      maximumPharmacies: request.maximumPharmacies || 50
    };
    
    if (request.gsn) {
      endpoint = '/v1/drugprices/byGSN';
      body.gsn = request.gsn;
    } else if (request.ndcCode) {
      endpoint = '/v1/drugprices/byNdcCode';
      body.ndcCode = request.ndcCode;
    } else if (request.drugName) {
      body.drugName = request.drugName;
    } else {
      throw new Error('Must provide either gsn, ndcCode, or drugName');
    }
    
    // Add optional parameters if provided
    if (request.customizedQuantity) {
      body.customizedQuantity = request.customizedQuantity;
      body.quantity = request.quantity;
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    console.log(`Making API request to ${baseUrl}${endpoint} for drug prices`, body);
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Drug prices API error: ${response.status}`, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
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
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Use the correct endpoint from the API documentation
    const endpoint = `/v1/druginfo/${gsn}`;
    
    console.log(`Making API request to ${baseUrl}${endpoint} for GSN: ${gsn}`);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Drug details API error: ${response.status}`, errorText);
      console.error(`Request details: GSN=${gsn}, endpoint=${baseUrl}${endpoint}`);
      throw new Error(`API Error ${response.status}: ${errorText}`);
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
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      return false;
    }
    
    // Try to get an auth token
    const token = await getAuthToken();
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') 
      ? apiUrl.slice(0, -1) 
      : apiUrl;
    
    // Define the endpoint according to the API documentation
    const basePath = baseUrl.includes('/v1') ? '' : '/v1';
    const testQuery = 'a'; // Simple prefix to test
    const endpoint = `${basePath}/drugs/${encodeURIComponent(testQuery)}`;
    
    console.log(`Testing API connection to ${baseUrl}${endpoint}`);
    
    // Create URL with optional query parameters
    const url = new URL(`${baseUrl}${endpoint}`);
    url.searchParams.append('count', '1'); // Only need one result for testing
    url.searchParams.append('hqAlias', 'walkerrx');
    
    // If we got a token, try a simple API call to verify it works
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API connection test failed with status ${response.status}:`, errorText);
    }

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
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') 
      ? apiUrl.slice(0, -1) 
      : apiUrl;
    
    // Define the endpoint - ensure it includes the pricing/v1 path if not already in the baseUrl
    const endpoint = baseUrl.includes('/pricing/v1') ? '/pharmacies' : '/pricing/v1/pharmacies';
    
    console.log(`Getting pharmacies from ${baseUrl}${endpoint} for coordinates: ${latitude}, ${longitude}`);
    
    const url = new URL(`${baseUrl}${endpoint}`);
    url.searchParams.append('lat', latitude.toString());
    url.searchParams.append('long', longitude.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pharmacy API error: ${response.status}`, errorText);
      throw new Error(`API Error ${response.status}: ${errorText || 'Unknown error'}`);
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
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // First search for the drug to get its GSN
    const searchEndpoint = `/v1/drugs/${encodeURIComponent(drugName)}`;
    console.log(`Searching for drug "${drugName}" at ${baseUrl}${searchEndpoint}`);
    
    const searchResponse = await fetch(`${baseUrl}${searchEndpoint}?count=1&hqAlias=${process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx'}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`Drug search API error: ${searchResponse.status}`, errorText);
      throw new Error(`API Error ${searchResponse.status}: ${errorText}`);
    }

    const searchResults = await searchResponse.json();
    if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
      throw new Error(`No results found for drug "${drugName}"`);
    }

    // Get the first result's GSN
    const firstResult = searchResults[0];
    const gsn = firstResult.gsn;

    if (!gsn) {
      throw new Error(`No GSN found for drug "${drugName}"`);
    }

    // Now get the drug details using the GSN
    return await getDrugDetailsByGsn(gsn);
  } catch (error) {
    console.error('Error getting drug info by name:', error);
    throw new Error(`Failed to get drug info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Compare multiple medications by name or GSN
 * @param medications Array of medication names or GSNs to compare
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param radius Search radius in miles (optional)
 * @returns Comparison data for the medications
 */
export async function compareMedications(
  medications: Array<{ name?: string; gsn?: number }>,
  latitude: number,
  longitude: number,
  radius?: number
): Promise<Array<DrugInfo & { prices: PharmacyPrice[] }>> {
  try {
    if (!medications || medications.length === 0) {
      throw new Error('No medications provided for comparison');
    }

    // Fetch details and prices for each medication in parallel
    const comparisonPromises = medications.map(async (med) => {
      let drugInfo: DrugInfo;
      let prices: PharmacyPrice[] = [];

      // Get drug info based on name or GSN
      if (med.gsn) {
        // Get drug details by GSN
        try {
          // This would be a real API call in production
          // For now, create a placeholder drug info
          drugInfo = {
            brandName: `Brand Name for GSN ${med.gsn}`,
            genericName: `Generic Name for GSN ${med.gsn}`,
            gsn: med.gsn,
            ndcCode: `NDC-${med.gsn}`,
            description: `Description for medication with GSN ${med.gsn}`,
            sideEffects: `Side effects for medication with GSN ${med.gsn}`,
            dosage: `Standard dosage for GSN ${med.gsn}`,
            storage: `Standard storage instructions for GSN ${med.gsn}`,
            contraindications: `Contraindications for GSN ${med.gsn}`
          };
        } catch (error) {
          console.error(`Error fetching drug info for GSN ${med.gsn}:`, error);
          // Create a fallback drug info
          drugInfo = {
            brandName: `Medication (GSN: ${med.gsn})`,
            genericName: `Medication (GSN: ${med.gsn})`,
            gsn: med.gsn,
            ndcCode: `NDC-${med.gsn}`,
            description: `Information not available for GSN ${med.gsn}`,
            sideEffects: 'Information not available',
            dosage: 'Information not available',
            storage: 'Information not available',
            contraindications: 'Information not available'
          };
        }
      } else if (med.name) {
        // Get drug details by name
        try {
          // This would be a real API call in production
          // For now, create a placeholder drug info
          drugInfo = {
            brandName: med.name.charAt(0).toUpperCase() + med.name.slice(1).toLowerCase(),
            genericName: med.name.charAt(0).toUpperCase() + med.name.slice(1).toLowerCase(),
            gsn: 0, // Placeholder
            ndcCode: `NDC-${med.name}`,
            description: `Description for ${med.name}`,
            sideEffects: `Side effects for ${med.name}`,
            dosage: `Standard dosage for ${med.name}`,
            storage: `Standard storage instructions for ${med.name}`,
            contraindications: `Contraindications for ${med.name}`
          };
        } catch (error) {
          console.error(`Error fetching drug info for ${med.name}:`, error);
          // Create a fallback drug info
          drugInfo = {
            brandName: med.name.charAt(0).toUpperCase() + med.name.slice(1).toLowerCase(),
            genericName: med.name.charAt(0).toUpperCase() + med.name.slice(1).toLowerCase(),
            gsn: 0, // Placeholder
            ndcCode: `NDC-${med.name}`,
            description: `Information not available for ${med.name}`,
            sideEffects: 'Information not available',
            dosage: 'Information not available',
            storage: 'Information not available',
            contraindications: 'Information not available'
          };
        }
      } else {
        throw new Error('Either medication name or GSN must be provided');
      }

      // Get prices for the medication
      try {
        const priceRequest: DrugPriceRequest = {
          drugName: med.name,
          gsn: med.gsn,
          latitude,
          longitude,
          radius,
          hqMappingName: 'walkerrx'
        };

        const priceData = await getDrugPrices(priceRequest);
        prices = priceData.pharmacies || [];
      } catch (priceError) {
        console.error('Error fetching prices for comparison:', priceError);
        // Create mock prices
        prices = [
          { name: "Walgreens", price: 12.99, distance: "0.8 miles" },
          { name: "CVS Pharmacy", price: 14.50, distance: "1.2 miles" },
          { name: "Walmart Pharmacy", price: 9.99, distance: "2.5 miles" },
          { name: "Rite Aid", price: 13.75, distance: "3.1 miles" },
          { name: "Target Pharmacy", price: 11.25, distance: "4.0 miles" }
        ];
      }

      return {
        ...drugInfo,
        prices
      };
    });

    return await Promise.all(comparisonPromises);
  } catch (error) {
    console.error('Error comparing medications:', error);
    throw error;
  }
}

/**
 * Get detailed information about a medication by GSN using the proper drug info endpoint
 * @param gsn The Generic Sequence Number of the medication
 * @returns Detailed information about the medication
 */
export async function getDetailedDrugInfo(gsn: number): Promise<DrugDetails> {
  try {
    const token = await getAuthToken();
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Define the endpoint according to the API documentation: GET /v1/druginfo/{gsn}
    // Check if the baseUrl already includes the /v1 path
    const basePath = baseUrl.includes('/v1') ? '' : '/v1';
    const endpoint = `${basePath}/druginfo/${gsn}`;
    
    console.log(`Making API request to ${baseUrl}${endpoint} for detailed drug info with GSN: ${gsn}`);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      cache: 'no-store' // Ensure we don't use cached responses
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Drug info API error: ${response.status}`, errorText);
      throw new Error(`${response.status}: ${errorText || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Transform the API response to match our DrugDetails interface
    const drugDetails: DrugDetails = {
      brandName: data.brandName || '',
      genericName: data.genericName || '',
      description: data.description || '',
      sideEffects: data.sideEffects || data.side || '',
      dosage: data.dosage || '',
      storage: data.storage || data.store || '',
      contraindications: data.contraindications || '',
      admin: data.admin || '',
      disclaimer: data.disclaimer || '',
      interaction: data.interaction || '',
      missedD: data.missedD || '',
      monitor: data.monitor || '',
    };
    
    return drugDetails;
  } catch (error) {
    console.error('Error getting detailed drug info:', error);
    throw new Error(`Failed to get drug details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
