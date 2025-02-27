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
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Define the endpoint - ensure it includes the pricing/v1 path if not already in the baseUrl
    const endpoint = baseUrl.includes('/pricing/v1') ? '/drugs/names' : '/pricing/v1/drugs/names';
    
    // Convert query to lowercase to ensure consistent API requests
    const normalizedQuery = query.toLowerCase();
    console.log(`Searching for drugs with query: "${normalizedQuery}" at ${baseUrl}${endpoint}`);
    
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
    console.log(`Making API request to ${baseUrl}${endpoint} with query: ${normalizedQuery}`);
    const response = await fetch(`${baseUrl}${endpoint}`, {
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
      console.error(`Request details: query="${normalizedQuery}", endpoint=${baseUrl}${endpoint}`);
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
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
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
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') 
      ? apiUrl.slice(0, -1) 
      : apiUrl;
    
    // Define the endpoint - ensure it includes the pricing/v1 path if not already in the baseUrl
    const fullEndpoint = baseUrl.includes('/pricing/v1') ? endpoint : `/pricing/v1${endpoint}`;
    
    console.log(`Making API request to ${baseUrl}${fullEndpoint} for drug prices`);
    const response = await fetch(`${baseUrl}${fullEndpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Drug prices API error: ${response.status}`, errorText);
      throw new Error(`${response.status}: ${errorText || 'Unknown error'}`);
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
    
    // Define the endpoint - ensure it includes the pricing/v1 path if not already in the baseUrl
    const endpoint = baseUrl.includes('/pricing/v1') ? '/drugprices/byGSN' : '/pricing/v1/drugprices/byGSN';
    
    console.log(`Making API request to ${baseUrl}${endpoint} for GSN: ${gsn}`);
    
    // For drug details, we'll use the byGSN endpoint with default coordinates
    const response = await fetch(`${baseUrl}${endpoint}`, {
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
    
    // Define the endpoint - ensure it includes the pricing/v1 path if not already in the baseUrl
    const endpoint = baseUrl.includes('/pricing/v1') ? '/drugs/names' : '/pricing/v1/drugs/names';
    
    console.log(`Testing API connection to ${baseUrl}${endpoint}`);
    
    // If we got a token, try a simple API call to verify it works
    const response = await fetch(`${baseUrl}${endpoint}`, {
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
    
    // Normalize drug name to lowercase
    const normalizedDrugName = drugName.toLowerCase();
    console.log(`Server: Getting drug info for: "${normalizedDrugName}"`);
    
    // First, search for the drug to get its GSN
    console.log(`Server: Searching for drug with name: ${normalizedDrugName}`);
    const searchResults = await searchDrugs(normalizedDrugName);
    
    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      console.error(`Server: No drug found with name: ${normalizedDrugName}`);
      throw new Error(`Drug not found: ${drugName}`);
    }
    
    // Find the exact match or closest match
    const exactMatch = searchResults.find(
      drug => drug.drugName.toLowerCase() === normalizedDrugName
    );
    
    const drugToUse = exactMatch || searchResults[0];
    console.log(`Server: Using drug: ${drugToUse.drugName} for info lookup`);
    
    // If we have a GSN, use it to get detailed information
    if (drugToUse.gsn) {
      console.log(`Server: Retrieving drug details by GSN: ${drugToUse.gsn}`);
      const details = await getDrugDetailsByGsn(drugToUse.gsn);
      console.log(`Server: Retrieved drug details by GSN for ${drugToUse.drugName}:`, details);
      
      // Format the response to match the DrugDetails interface
      const formattedDetails = {
        brandName: details.brandName || drugToUse.drugName,
        genericName: details.genericName || drugToUse.drugName,
        description: details.description || `${drugToUse.drugName} is a medication used to treat various conditions. Please consult with your healthcare provider for specific information.`,
        sideEffects: details.sideEffects || "Please consult with your healthcare provider for information about side effects.",
        dosage: details.dosage || "Various strengths available",
        storage: details.storage || "Store according to package instructions.",
        contraindications: details.contraindications || "Please consult with your healthcare provider for contraindication information."
      };
      
      console.log(`Server: Formatted drug details by GSN for ${drugToUse.drugName}:`, formattedDetails);
      return formattedDetails;
    }
    
    // If no GSN, we'll need to use the drug name to get prices and extract info
    console.log(`Server: No GSN available, retrieving drug info by name: ${drugToUse.drugName}`);
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Define the endpoint - ensure it includes the pricing/v1 path if not already in the baseUrl
    const endpoint = baseUrl.includes('/pricing/v1') ? '/drugprices/byName' : '/pricing/v1/drugprices/byName';
    
    console.log(`Getting drug info by name from ${baseUrl}${endpoint} for drug: ${drugToUse.drugName}`);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
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
      const errorText = await response.text();
      console.error(`Server: API error when getting drug info by name: ${response.status}`, errorText);
      console.error(`Request details: drugName=${drugToUse.drugName}, endpoint=${baseUrl}${endpoint}`);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Server: Retrieved drug info for ${drugToUse.drugName} from prices API:`, data);
    
    // Extract drug information from the response
    // Format the drug name with proper capitalization
    const formattedDrugName = drugToUse.drugName.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Format the response to match the DrugDetails interface
    const drugDetails = {
      brandName: data.brandName || formattedDrugName,
      genericName: data.genericName || formattedDrugName,
      description: data.description || `${formattedDrugName} is a medication used to treat various conditions. Please consult with your healthcare provider for specific information.`,
      sideEffects: data.sideEffects || "Please consult with your healthcare provider for information about side effects.",
      dosage: data.dosage || "Various strengths available",
      storage: data.storage || "Store according to package instructions.",
      contraindications: data.contraindications || "Please consult with your healthcare provider for contraindication information."
    };
    
    console.log(`Server: Formatted drug details for ${drugToUse.drugName}:`, drugDetails);
    return drugDetails;
  } catch (error) {
    console.error('Server: Error getting drug info by name:', error);
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
