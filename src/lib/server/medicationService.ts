'use server';

import { DrugPriceRequest, DrugInfo, DrugPrice, PharmacyPrice, DrugPriceResponse, DrugDetails, APIError, DrugVariation, DrugForm, DrugStrength, DrugQuantity } from '@/types/api';
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
    
    // Try the endpoint from the API documentation first
    try {
      // Use the endpoint from the API documentation (opFindDrugByName)
      const endpoint = `/drugs/${encodeURIComponent(query)}`;
      
      // Check if baseUrl already includes the pricing/v1 path
      const fullEndpoint = baseUrl.includes('/pricing/v1') ? endpoint : `/pricing/v1${endpoint}`;
      
      console.log(`Server: Trying GET request to ${baseUrl}${fullEndpoint}`);
      
      // Get authentication token
      const token = await getAuthToken();
      
      // Create URL with optional query parameters
      const url = new URL(`${baseUrl}${fullEndpoint}`);
      url.searchParams.append('count', '20'); // Optional: limit results to 20
      url.searchParams.append('hqAlias', 'walkerrx'); // Use the HQ_MAPPING from env vars
      
      console.log(`Full request URL: ${url.toString()}`);
      
      // Make API request using GET method as specified in the API docs
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
        console.error(`GET API error: ${response.status}`, errorText);
        throw new Error(`GET API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`GET request found ${Array.isArray(data) ? data.length : 0} drug matches for "${query}"`);
      
      // If we got data, format and return it
      if (Array.isArray(data) && data.length > 0) {
        console.log(`Sample drug data:`, data.slice(0, 2));
        return data.map(drugName => ({
          drugName: typeof drugName === 'string' 
            ? drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase()
            : drugName
        }));
      }
      
      // If we got an empty array, try the POST method
      if (Array.isArray(data) && data.length === 0) {
        console.log('GET request returned empty results, trying POST method');
        throw new Error('GET request returned empty results, trying POST method');
      }
    } catch (error) {
      const getError = error instanceof Error ? error : new Error(String(error));
      console.log(`GET request failed: ${getError.message}, trying POST method`);
      
      // If GET fails, try the endpoint from the Postman collection
      try {
        // Use the endpoint from the Postman collection
        const endpoint = `/drugs/names`;
        
        // Check if baseUrl already includes the pricing/v1 path
        const fullEndpoint = baseUrl.includes('/pricing/v1') ? endpoint : `/pricing/v1${endpoint}`;
        
        console.log(`Server: Trying POST request to ${baseUrl}${fullEndpoint}`);
        
        // Get authentication token
        const token = await getAuthToken();
        
        // Make API request using POST method as specified in the Postman collection
        const response = await fetch(`${baseUrl}${fullEndpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            hqMappingName: 'walkerrx',
            prefixText: query
          }),
          cache: 'no-store' // Ensure we don't use cached responses
        });

        // Handle response
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`POST API error: ${response.status}`, errorText);
          throw new Error(`POST API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`POST request found ${Array.isArray(data) ? data.length : 0} drug matches for "${query}"`);
        
        // If we got data, format and return it
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Sample drug data:`, data.slice(0, 2));
          return data.map(drugName => ({
            drugName: typeof drugName === 'string' 
              ? drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase()
              : drugName
          }));
        }
      } catch (error) {
        const postError = error instanceof Error ? error : new Error(String(error));
        console.error(`POST request failed: ${postError.message}`);
        // Both methods failed, fall back to mock data
      }
    }
    
    // If we get here, both API methods failed or returned empty results
    // Fall back to mock data
    console.log('Both API methods failed or returned empty results, falling back to mock data');
    return getMockDrugSearchResults(query);
  } catch (error) {
    console.error('Error in searchDrugs:', error);
    // Fall back to mock data on any error
    console.log('Error in searchDrugs, falling back to mock data');
    return getMockDrugSearchResults(query);
  }
}

/**
 * Get mock drug search results for testing or when the API fails
 * @param query The search query
 * @returns An array of mock drug search results
 */
function getMockDrugSearchResults(query: string): DrugSearchResponse[] {
  console.log(`Generating mock results for query: "${query}"`);
  
  // Mock data for common medications
  const MOCK_DRUGS = [
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
    { drugName: 'Tylenol', gsn: 7689 },
    { drugName: 'Tylox', gsn: 8790 },
    { drugName: 'Tylenol with Codeine', gsn: 9801 },
    { drugName: 'Tylenol PM', gsn: 1012 },
    { drugName: 'Tylenol Cold', gsn: 2123 }
  ];
  
  // Filter the mock drugs based on the query
  const normalizedQuery = query.toLowerCase();
  const filteredDrugs = MOCK_DRUGS.filter(drug => 
    drug.drugName.toLowerCase().includes(normalizedQuery)
  );
  
  console.log(`Found ${filteredDrugs.length} mock drugs matching "${normalizedQuery}"`);
  return filteredDrugs;
}

/**
 * Get prices for a medication
 * @param request The drug price request
 * @returns Price information for the medication
 */
export async function getDrugPrices(request: DrugPriceRequest): Promise<DrugPriceResponse> {
  try {
    console.log('Server: Fetching drug prices with criteria:', request);
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Get authentication token
    const token = await getAuthToken();
    
    // Determine which endpoint to use based on the provided parameters
    let endpoint = '';
    let requestBody = {};
    
    if (request.gsn) {
      endpoint = '/drugprices/byGSN';
      requestBody = {
        hqMappingName: request.hqMappingName || process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
        gsn: request.gsn,
        latitude: request.latitude,
        longitude: request.longitude,
        customizedQuantity: request.customizedQuantity || false
      };
      
      // Add quantity if customizedQuantity is true
      if (request.customizedQuantity && request.quantity) {
        requestBody = { ...requestBody, quantity: request.quantity };
      }
      
      // Add form if provided
      if (request.form) {
        requestBody = { ...requestBody, form: request.form };
      }
      
      // Add strength if provided
      if (request.strength) {
        requestBody = { ...requestBody, strength: request.strength };
      }
    } else if (request.drugName) {
      endpoint = '/drugprices/byName';
      requestBody = {
        hqMappingName: request.hqMappingName || process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
        drugName: request.drugName,
        latitude: request.latitude,
        longitude: request.longitude
      };
      
      // Add form if provided
      if (request.form) {
        requestBody = { ...requestBody, form: request.form };
      }
      
      // Add strength if provided
      if (request.strength) {
        requestBody = { ...requestBody, strength: request.strength };
      }
      
      // Add quantity if customizedQuantity is true
      if (request.customizedQuantity && request.quantity) {
        requestBody = { ...requestBody, 
          customizedQuantity: true,
          quantity: request.quantity 
        };
      }
    } else if (request.ndcCode) {
      endpoint = '/drugprices/byNdcCode';
      requestBody = {
        hqMappingName: request.hqMappingName || process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
        ndcCode: request.ndcCode,
        latitude: request.latitude,
        longitude: request.longitude,
        customizedQuantity: request.customizedQuantity || false
      };
      
      // Add quantity if customizedQuantity is true
      if (request.customizedQuantity && request.quantity) {
        requestBody = { ...requestBody, quantity: request.quantity };
      }
      
      // Add form if provided
      if (request.form) {
        requestBody = { ...requestBody, form: request.form };
      }
      
      // Add strength if provided
      if (request.strength) {
        requestBody = { ...requestBody, strength: request.strength };
      }
    } else {
      throw new Error('Either drugName, gsn, or ndcCode must be provided');
    }
    
    // Ensure the URL is properly formatted - remove any trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Check if baseUrl already includes the pricing/v1 path
    // If not, add it to ensure we have the complete path
    const pricingPath = baseUrl.includes('/pricing/v1') ? '' : '/pricing/v1';
    const fullEndpoint = `${pricingPath}${endpoint}`;
    
    console.log(`Server: Using endpoint ${fullEndpoint} with body:`, requestBody);
    
    // Make API request
    const response = await fetch(`${baseUrl}${fullEndpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store'
    });
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status}`, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Server: Received drug prices response with ${data.pharmacies?.length || 0} pharmacies`);
    
    // Process the response to extract all filter information
    const result: DrugPriceResponse = {
      pharmacies: data.pharmacies || []
    };
    
    // Extract brand/generic variations
    if (data.drug) {
      console.log('Server: Processing drug data:', data.drug);
      
      // Extract brand/generic flag
      const brandGenericFlag = data.drug.brandGenericFlag;
      const brandName = data.drug.brandName;
      const genericName = data.drug.genericName;
      
      // Create variations array
      const variations: DrugVariation[] = [];
      
      // Add the current drug as a variation
      if (brandGenericFlag === 'B' || brandGenericFlag === 'G') {
        variations.push({
          name: brandGenericFlag === 'B' ? brandName : `${genericName} (generic)`,
          type: brandGenericFlag === 'B' ? 'brand' : 'generic',
          gsn: data.drug.gsn
        });
      }
      
      // Add other variations if available
      if (data.drug.alternatives) {
        data.drug.alternatives.forEach((alt: any) => {
          variations.push({
            name: alt.brandGenericFlag === 'B' ? alt.brandName : `${alt.genericName} (generic)`,
            type: alt.brandGenericFlag === 'B' ? 'brand' : 'generic',
            gsn: alt.gsn
          });
        });
      }
      
      if (variations.length > 0) {
        result.brandVariations = variations;
        console.log(`Server: Found ${variations.length} brand/generic variations`);
      }
      
      // Extract forms if available
      if (data.drug.forms && Array.isArray(data.drug.forms)) {
        result.forms = data.drug.forms.map((form: any) => ({
          form: form.form,
          gsn: form.gsn
        }));
        console.log(`Server: Found ${result.forms?.length || 0} drug forms`);
      }
      
      // Extract strengths/dosages if available
      if (data.drug.strengths && Array.isArray(data.drug.strengths)) {
        result.strengths = data.drug.strengths.map((strength: any) => ({
          strength: strength.strength,
          gsn: strength.gsn
        }));
        console.log(`Server: Found ${result.strengths?.length || 0} drug strengths`);
      }
      
      // Extract quantities if available
      if (data.drug.quantities && Array.isArray(data.drug.quantities)) {
        result.quantities = data.drug.quantities.map((qty: any) => ({
          quantity: qty.quantity,
          uom: qty.uom
        }));
        console.log(`Server: Found ${result.quantities?.length || 0} drug quantities`);
      }
    } else if (data.drugInfo && data.drugInfo.brandVariations) {
      // Handle the previous response format for backward compatibility
      const brandVariations = data.drugInfo.brandVariations || [];
      console.log(`Server: Found ${brandVariations.length} brand variations for this drug`);
      
      // Add brand variation information to the response
      result.brandVariations = brandVariations.map((variation: any) => ({
        name: variation.name,
        type: variation.type || (variation.name.includes('(generic)') ? 'generic' : 'brand'),
        gsn: variation.gsn
      }));
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching drug prices:', error);
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
    
    // Use the correct endpoint from the API documentation
    const endpoint = `/druginfo/${gsn}`;
    
    // Check if baseUrl already includes the pricing/v1 path
    const fullEndpoint = baseUrl.includes('/pricing/v1') ? endpoint : `/pricing/v1${endpoint}`;
    
    console.log(`Making API request to ${baseUrl}${fullEndpoint} for GSN: ${gsn}`);
    
    const response = await fetch(`${baseUrl}${fullEndpoint}`, {
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
      console.error(`Request details: GSN=${gsn}, endpoint=${baseUrl}${fullEndpoint}`);
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
 * Get drug information by name
 * @param drugName The name of the drug
 * @param languageCode Optional language code for localized information
 * @returns Drug information
 */
export async function getDrugInfoByName(drugName: string, languageCode?: string): Promise<DrugDetails> {
  try {
    console.log(`Server: Getting drug info for: "${drugName}"`);
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Get authentication token
    const token = await getAuthToken();
    
    // First, try to find the GSN for the drug name
    const gsn = await findGsnForDrugName(drugName);
    
    if (gsn) {
      console.log(`Server: Found GSN ${gsn} for drug "${drugName}", getting detailed info`);
      return getDetailedDrugInfo(gsn, languageCode);
    }
    
    // If we couldn't find a GSN, return a basic drug info object
    console.log(`Server: No GSN found for drug "${drugName}", returning basic info`);
    
    // Create a basic drug info object
    const drugInfo: DrugDetails = {
      brandName: drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase(),
      genericName: drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase(),
      description: 'No detailed information available for this medication.',
      sideEffects: '',
      dosage: '',
      storage: '',
      contraindications: ''
    };
    
    return drugInfo;
  } catch (error) {
    console.error('Error in getDrugInfoByName:', error);
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
 * Get detailed drug information by GSN
 * @param gsn The Generic Sequence Number of the drug
 * @param languageCode Optional language code for localized information
 * @returns Detailed drug information
 */
export async function getDetailedDrugInfo(gsn: number, languageCode?: string): Promise<any> {
  try {
    console.log(`Server: Getting detailed drug info for GSN: ${gsn}`);
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Get authentication token
    const token = await getAuthToken();
    
    // Create URL with optional query parameters
    const url = new URL(`${baseUrl}/pricing/v1/druginfo/${gsn}`);
    
    // Add language code if provided
    if (languageCode) {
      url.searchParams.append('languageCode', languageCode);
    }
    
    console.log(`Server: Making API request to ${url.toString()}`);
    
    // Make API request
    const response = await fetch(url.toString(), {
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
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Server: Received detailed drug info for GSN ${gsn}`);
    
    return data;
  } catch (error) {
    console.error('Error in getDetailedDrugInfo:', error);
    throw error;
  }
}

/**
 * Find the GSN for a drug name by searching the API
 * @param drugName The name of the drug
 * @returns The GSN if found, otherwise undefined
 */
async function findGsnForDrugName(drugName: string): Promise<number | undefined> {
  try {
    console.log(`Server: Finding GSN for drug name: "${drugName}"`);
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Get authentication token
    const token = await getAuthToken();
    
    // First search for the drug to get its GSN
    const searchEndpoint = `/pricing/v1/drugs/${encodeURIComponent(drugName)}`;
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
      return undefined;
    }

    const searchResults = await searchResponse.json();
    if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
      console.log(`No results found for drug "${drugName}"`);
      return undefined;
    }

    // Try to find a result with a GSN
    for (const result of searchResults) {
      if (result.gsn) {
        console.log(`Found GSN ${result.gsn} for drug "${drugName}"`);
        return result.gsn;
      }
    }
    
    // If we get here, no GSN was found
    console.log(`No GSN found for drug "${drugName}"`);
    return undefined;
  } catch (error) {
    console.error('Error finding GSN for drug name:', error);
    return undefined;
  }
}
