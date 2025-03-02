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
    
    // Ensure the query is at least 3 characters long
    if (query.length < 3) {
      console.log(`Server: Query "${query}" is too short, minimum 3 characters required`);
      return [];
    }
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Define the endpoint for drug names search - the baseUrl already includes '/pricing'
    const endpoint = '/v1/drugs/names';
    
    console.log(`Server: Searching for drugs at ${baseUrl}${endpoint}`);
    
    // Get authentication token
    const token = await getAuthToken();
    console.log('Successfully obtained auth token for drug search');
    
    // Create request body with the required parameters
    const requestBody = {
      hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
      prefixText: query
    };
    
    // Make API request using POST method as specified in the Postman collection
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store' // Ensure we don't use cached responses
    });

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Drug search API error: ${response.status}`, errorText);
      console.error(`Request details: query="${query}", endpoint=${baseUrl}${endpoint}`);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Found ${Array.isArray(data) ? data.length : 0} drug matches for "${query}" from API`);
    
    // Format the response to match the expected interface
    // According to the Postman collection, the response is an array of strings
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
 * Get prices for a medication at nearby pharmacies
 * @param request The search criteria
 * @returns Price information for the medication
 */
export async function getDrugPrices(request: DrugPriceRequest): Promise<DrugPriceResponse> {
  try {
    console.log(`Server: Getting drug prices with request:`, request);
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Determine the appropriate endpoint based on the request
    let endpoint = '';
    
    if (request.drugName) {
      endpoint = '/drugprices/byName';
      console.log(`Server: Getting drug prices by name: ${request.drugName}`);
      
      // Normalize drug name - remove "Brand" prefix if present
      // The API doesn't recognize "Brand" prefixes that might be added by our application
      if (request.drugName.startsWith('Brand ')) {
        request.drugName = request.drugName.replace('Brand ', '');
        console.log(`Server: Normalized drug name to: ${request.drugName}`);
      }
      
      // Ensure drug name is at least 3 characters
      if (request.drugName.length < 3) {
        console.error(`Server: Drug name "${request.drugName}" is too short, minimum 3 characters required`);
        throw new Error('Drug name must be at least 3 characters');
      }
    } else if (request.gsn) {
      endpoint = '/drugprices/byGSN';
      console.log(`Server: Getting drug prices by GSN: ${request.gsn}`);
    } else if (request.ndcCode) {
      endpoint = '/drugprices/byNdcCode';
      console.log(`Server: Getting drug prices by NDC: ${request.ndcCode}`);
    } else {
      throw new Error('Invalid request: must provide drugName, gsn, or ndcCode');
    }
    
    // Get authentication token
    const token = await getAuthToken();
    console.log('Successfully obtained auth token for drug prices');
    
    // Create request body
    const requestBody = {
      hqMappingName: request.hqMappingName || process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
      latitude: request.latitude,
      longitude: request.longitude,
    };
    
    // Add the appropriate identifier based on the endpoint
    if (endpoint.includes('byName')) {
      Object.assign(requestBody, { drugName: request.drugName });
    } else if (endpoint.includes('byGSN')) {
      Object.assign(requestBody, { gsn: request.gsn });
    } else if (endpoint.includes('byNdcCode')) {
      Object.assign(requestBody, { ndcCode: request.ndcCode });
    }
    
    // Add optional parameters if provided
    if (request.customizedQuantity && request.quantity) {
      Object.assign(requestBody, { 
        customizedQuantity: request.customizedQuantity,
        quantity: request.quantity
      });
    }
    
    // Add radius if provided
    if (request.radius) {
      Object.assign(requestBody, { radius: request.radius });
    }
    
    console.log(`Server: Requesting drug prices from ${baseUrl}${endpoint}`, requestBody);
    
    // Make API request
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store' // Ensure we don't use cached responses
    });
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Drug prices API error: ${response.status}`, errorText);
      
      // Check if this is a "drug not found" error
      if (response.status === 400 && errorText.includes('Invalid drug name or drug name not found')) {
        console.log(`Server: Drug "${request.drugName}" not found in the API`);
        // Return empty results instead of throwing an error
        return {
          pharmacies: [],
          drugInfo: null,
          error: `Drug "${request.drugName}" not found`
        };
      }
      
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Server: Received drug prices response with ${data.pharmacies?.length || 0} pharmacies`);
    
    // Format the response to match the expected interface
    return {
      pharmacies: data.pharmacies || [],
      drugInfo: data.drugInfo || null
    };
  } catch (error) {
    console.error('Error in getDrugPrices:', error);
    throw error;
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
    console.log('[API TEST] Starting API connection test...');
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('[API TEST] Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('Missing API URL configuration');
    }
    
    console.log(`[API TEST] Using API URL: ${apiUrl}`);
    
    // Try to get an auth token
    console.log('[API TEST] Attempting to get authentication token...');
    const token = await getAuthToken();
    console.log('[API TEST] Successfully obtained authentication token');
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') 
      ? apiUrl.slice(0, -1) 
      : apiUrl;
    
    // Define the endpoint for drug names search
    const endpoint = '/drugs/names';
    
    console.log(`[API TEST] Testing API connection to ${baseUrl}${endpoint}`);
    
    // Create request body with the required parameters
    const requestBody = {
      hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
      prefixText: 'lip' // Using a longer prefix to ensure valid results
    };
    
    console.log(`[API TEST] Making API request with parameters:`, {
      hqMappingName: requestBody.hqMappingName,
      prefixText: requestBody.prefixText
    });
    
    // If we got a token, try a simple API call to verify it works
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[API TEST] API response status: ${response.status}`);
    
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = `Could not read error response: ${e}`;
      }
      
      console.error(`[API TEST] API connection test failed with status ${response.status}:`, errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Try to parse the response to ensure it's valid JSON
    let data;
    try {
      data = await response.json();
      console.log(`[API TEST] Successfully parsed API response`);
    } catch (e) {
      console.error(`[API TEST] Failed to parse API response:`, e);
      throw new Error(`Failed to parse API response: ${e}`);
    }
    
    const isValidResponse = Array.isArray(data);
    
    if (!isValidResponse) {
      console.error('[API TEST] API connection test failed: Invalid response format', data);
      throw new Error('Invalid API response format');
    }
    
    console.log(`[API TEST] API connection test successful. Found ${data.length} results.`);
    
    // Log the first few results for verification
    if (data.length > 0) {
      console.log('[API TEST] First few results:');
      data.slice(0, 5).forEach((item: any, index: number) => {
        console.log(`  ${index + 1}. ${item.drugName || item}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('[API TEST] API connection test failed:', error);
    // Return false instead of throwing to maintain compatibility
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
    if (!drugName || typeof drugName !== 'string') {
      console.error(`Server: Invalid drug name provided: ${drugName}`);
      throw new Error('Invalid drug name provided');
    }

    // Normalize drug name: trim whitespace and convert to lowercase
    const normalizedDrugName = drugName.trim().toLowerCase();
    
    if (normalizedDrugName.length < 3) {
      console.error(`Server: Drug name too short: "${normalizedDrugName}"`);
      throw new Error('Drug name must be at least 3 characters long');
    }
    
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
      try {
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
      } catch (error) {
        console.error(`Server: Error retrieving drug details by GSN: ${error}`);
        throw error;
      }
    }
    
    // If no GSN, we'll need to use the drug name to get prices and extract info
    console.log(`Server: No GSN available, retrieving drug info by name: ${drugToUse.drugName}`);
    
    try {
      // Validate API URL
      const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
      if (!apiUrl) {
        console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
        throw new Error('API URL not configured');
      }
      
      // Ensure the URL is properly formatted by removing trailing slashes
      const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      
      // Define the endpoint - the baseUrl already includes '/pricing'
      const endpoint = '/v1/drugprices/byName';
      
      console.log(`Getting drug info by name from ${baseUrl}${endpoint} for drug: ${drugToUse.drugName}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
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
      console.log(`Server: Received drug info by name for ${drugToUse.drugName}:`, data);
      
      // Extract drug information from the pricing response
      // The API doesn't provide detailed drug info when searching by name,
      // so we'll create a basic drug info object with the available data
      const drugDetails: DrugDetails = {
        brandName: data.brandName || drugToUse.drugName,
        genericName: data.genericName || drugToUse.drugName,
        description: `${drugToUse.drugName} is a medication used to treat various conditions. Please consult with your healthcare provider for specific information.`,
        sideEffects: "Please consult with your healthcare provider for information about side effects.",
        dosage: "Various strengths available",
        storage: "Store according to package instructions.",
        contraindications: "Please consult with your healthcare provider for contraindication information."
      };
      
      console.log(`Server: Created drug details for ${drugToUse.drugName}:`, drugDetails);
      return drugDetails;
    } catch (error) {
      console.error(`Server: Error getting drug info by name: ${error}`);
      throw error;
    }
  } catch (error) {
    console.error(`Server: Error in getDrugInfoByName: ${error}`);
    throw error;
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
    
    // Define the endpoint according to the API documentation
    // The baseUrl already includes '/pricing', so we just need to add the rest of the path
    const endpoint = `/v1/druginfo/${gsn}`;
    
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

/**
 * Get drug prices aggregated by pharmacy chain
 * @param request The drug price request
 * @returns Drug prices aggregated by pharmacy chain
 */
export async function getGroupDrugPrices(request: DrugPriceRequest): Promise<DrugPriceResponse> {
  try {
    console.log(`Server: Getting group drug prices with request:`, request);
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Define the endpoint for group drug prices
    const endpoint = '/drugprices/groupdrugprices';
    
    console.log(`Server: Getting group drug prices from ${baseUrl}${endpoint}`);
    
    // Get authentication token
    const token = await getAuthToken();
    console.log('Successfully obtained auth token for group drug prices');
    
    // Create request body
    const requestBody = {
      hqMappingName: request.hqMappingName || process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
      latitude: request.latitude,
      longitude: request.longitude,
    };
    
    // Add the appropriate identifier based on the request
    if (request.drugName) {
      Object.assign(requestBody, { drugName: request.drugName });
    } else if (request.gsn) {
      Object.assign(requestBody, { gsn: request.gsn });
    } else if (request.ndcCode) {
      Object.assign(requestBody, { ndcCode: request.ndcCode });
    } else {
      throw new Error('Invalid request: must provide drugName, gsn, or ndcCode');
    }
    
    // Add optional parameters if provided
    if (request.customizedQuantity && request.quantity) {
      Object.assign(requestBody, { 
        customizedQuantity: request.customizedQuantity,
        quantity: request.quantity
      });
    }
    
    if (request.radius) {
      Object.assign(requestBody, { radius: request.radius });
    }
    
    if (request.maximumPharmacies) {
      Object.assign(requestBody, { maximumPharmacies: request.maximumPharmacies });
    }
    
    console.log(`Server: Requesting group drug prices from ${baseUrl}${endpoint}`, requestBody);
    
    // Make API request
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store' // Ensure we don't use cached responses
    });
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Group drug prices API error: ${response.status}`, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Server: Received group drug prices response with ${data.pharmacies?.length || 0} pharmacy groups`);
    
    // Format the response to match the expected interface
    return {
      pharmacies: data.pharmacies || [],
      drugInfo: data.drugInfo || null
    };
  } catch (error) {
    console.error('Error in getGroupDrugPrices:', error);
    throw error;
  }
}

/**
 * Search for drugs by name using the GET method
 * @param prefixText The prefix text to search for
 * @param count Optional number of results to return (default: 10)
 * @param hqAlias Optional HQ alias
 * @returns An array of drug search results
 */
export async function searchDrugsByPrefix(
  prefixText: string,
  count: number = 10,
  hqAlias?: string
): Promise<DrugSearchResponse[]> {
  try {
    console.log(`Server: Searching for drugs with prefix: ${prefixText}, count: ${count}`);
    
    // Ensure the prefix is at least 3 characters long
    if (prefixText.length < 3) {
      console.log(`Server: Prefix "${prefixText}" is too short, minimum 3 characters required`);
      return [];
    }
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Define the endpoint for drug search by prefix - the baseUrl already includes '/pricing'
    const endpoint = `/v1/drugs/${encodeURIComponent(prefixText)}`;
    
    // Build the URL with query parameters
    const url = new URL(`${baseUrl}${endpoint}`);
    url.searchParams.append('count', count.toString());
    
    if (hqAlias) {
      url.searchParams.append('hqAlias', hqAlias);
    } else if (process.env.AMERICAS_PHARMACY_HQ_MAPPING) {
      url.searchParams.append('hqAlias', process.env.AMERICAS_PHARMACY_HQ_MAPPING);
    }
    
    console.log(`Server: Searching for drugs at ${url.toString()}`);
    
    // Get authentication token
    const token = await getAuthToken();
    console.log('Successfully obtained auth token for drug search by prefix');
    
    // Make API request using GET method
    const response = await fetch(url.toString(), {
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
      console.error(`Drug search by prefix API error: ${response.status}`, errorText);
      console.error(`Request details: prefix="${prefixText}", endpoint=${url.toString()}`);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Found ${Array.isArray(data) ? data.length : 0} drug matches for "${prefixText}" from API`);
    
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
    
    return [];
  } catch (error) {
    console.error('Error in searchDrugsByPrefix:', error);
    throw error;
  }
}
