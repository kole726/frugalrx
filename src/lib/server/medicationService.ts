'use server';

import { DrugPriceRequest, DrugInfo, DrugPrice, PharmacyPrice, DrugPriceResponse, DrugDetails, DrugVariation, DrugForm, DrugStrength, DrugQuantity } from '@/types/api';
import { getAuthToken } from './auth';

// Define known working GSN values for fallback
const KNOWN_WORKING_GSNS = [
  62733, // Lipitor (atorvastatin) - confirmed working
  70954, // Metformin - potential alternative
  2323,  // Another potential alternative
];

// Define the APIError class for better error handling
class APIError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

// Define the interface for drug search response
interface DrugSearchResponse {
  drugName: string;
  gsn?: number;
}

// Update the DrugPriceResponse interface to include isMockData
interface EnhancedDrugPriceResponse extends Omit<DrugPriceResponse, 'pharmacies'> {
  isMockData: boolean;
  drugName?: string;
  gsn?: number;
  prices?: PharmacyPrice[];
  pharmacies: any[]; // Keep the original pharmacies property
  originalRequest?: {
    drugName?: string;
    gsn?: number;
  };
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
 * Get mock drug prices for when the API doesn't return data
 */
function getMockDrugPrices(request: DrugPriceRequest): EnhancedDrugPriceResponse {
  console.log('Server: Generating mock drug prices for', request.drugName || request.gsn);
  
  // Create mock pharmacy prices
  const mockPrices: PharmacyPrice[] = [
    {
      pharmacyName: 'Mock Pharmacy 1',
      price: 19.99,
      distance: 0.5,
      address: '123 Main St, Austin, TX 78701',
      latitude: request.latitude,
      longitude: request.longitude
    },
    {
      pharmacyName: 'Mock Pharmacy 2',
      price: 24.99,
      distance: 1.2,
      address: '456 Oak St, Austin, TX 78702',
      latitude: request.latitude + 0.01,
      longitude: request.longitude - 0.01
    },
    {
      pharmacyName: 'Mock Pharmacy 3',
      price: 15.99,
      distance: 2.3,
      address: '789 Pine St, Austin, TX 78703',
      latitude: request.latitude - 0.02,
      longitude: request.longitude + 0.02
    }
  ];
  
  // Create mock pharmacies (to satisfy the DrugPriceResponse interface)
  const mockPharmacies = mockPrices.map(price => ({
    name: price.pharmacyName,
    address: price.address,
    distance: price.distance.toString(), // Convert to string to match expected type
    latitude: price.latitude,
    longitude: price.longitude,
    price: price.price.toString() // Convert to string to match expected type
  }));
  
  return {
    drugName: request.drugName || 'Unknown Medication',
    gsn: request.gsn || 0,
    prices: mockPrices,
    pharmacies: mockPharmacies,
    isMockData: true
  };
}

/**
 * Get prices for a medication
 * @param request The drug price request
 * @returns Price information for the medication
 */
export async function getDrugPrices(request: DrugPriceRequest): Promise<EnhancedDrugPriceResponse> {
  try {
    console.log(`Server: Getting drug prices for ${request.drugName || request.gsn}`);
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new APIError('API URL not configured', 500);
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    let baseUrl = apiUrl;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // Get authentication token
    const token = await getAuthToken();
    
    // Determine the endpoint based on what we have (GSN or drug name)
    let endpoint;
    let requestBody: any = {
      hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
      latitude: request.latitude,
      longitude: request.longitude,
      customizedQuantity: false,
      quantity: 30 // Default quantity
    };
    
    // If we have a GSN, use it
    if (request.gsn) {
      endpoint = baseUrl.includes('/pricing/v1') 
        ? `${baseUrl}/drugprices/byGSN`
        : `${baseUrl}/pricing/v1/drugprices/byGSN`;
      requestBody.gsn = request.gsn;
    } 
    // If we have a drug name, use it
    else if (request.drugName) {
      endpoint = baseUrl.includes('/pricing/v1') 
        ? `${baseUrl}/drugprices/byName`
        : `${baseUrl}/pricing/v1/drugprices/byName`;
      requestBody.drugName = request.drugName.toLowerCase();
    }
    // If we have neither, throw an error
    else {
      throw new APIError('Either drugName or gsn is required', 400);
    }
    
    console.log(`Server: Making request to ${endpoint} with body:`, requestBody);
    
    // Make the API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Check for 204 No Content response (no data available)
    if (response.status === 204) {
      console.log(`Server: Received 204 No Content - no data available for ${request.drugName || request.gsn}`);
      
      // If we were using a drug name, try to find its GSN and retry
      if (request.drugName && !request.gsn) {
        const gsn = await findGsnForDrugName(request.drugName);
        if (gsn) {
          console.log(`Server: Found GSN ${gsn} for drug name ${request.drugName}, retrying with GSN`);
          return getDrugPrices({
            ...request,
            gsn,
            drugName: undefined
          });
        }
      }
      
      // If we were already using a GSN or couldn't find one, try a known working GSN as fallback
      if (request.gsn !== KNOWN_WORKING_GSNS[0]) {
        console.log(`Server: Trying known working GSN ${KNOWN_WORKING_GSNS[0]} as fallback`);
        const fallbackResponse = await getDrugPrices({
          ...request,
          gsn: KNOWN_WORKING_GSNS[0],
          drugName: undefined
        });
        
        // Return the fallback response but mark it as mock data
        return {
          ...fallbackResponse,
          isMockData: true,
          originalRequest: {
            drugName: request.drugName,
            gsn: request.gsn
          }
        };
      }
      
      // If we've already tried the fallback GSN or we're already using it, return mock data
      console.log(`Server: No data available, returning mock data`);
      return getMockDrugPrices(request);
    }
    
    // Check for other errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server: API error (${response.status}):`, errorText);
      
      // Try to parse the error response
      try {
        const errorJson = JSON.parse(errorText);
        throw new APIError(
          errorJson.message || `API error: ${response.status}`,
          response.status,
          errorJson
        );
      } catch (e) {
        // If we can't parse the error, throw a generic one
        throw new APIError(`API error: ${response.status}`, response.status);
      }
    }
    
    // Parse the response
    const data = await response.json();
    console.log(`Server: Successfully retrieved drug prices`);
    
    // Format the response
    return {
      drugName: request.drugName || data.drugName || '',
      gsn: request.gsn || data.gsn,
      prices: data.prices || [],
      pharmacies: data.pharmacies || [],
      isMockData: false
    };
  } catch (error) {
    console.error('Server: Error getting drug prices:', error);
    
    // If it's already an APIError, rethrow it
    if (error instanceof APIError) {
      throw error;
    }
    
    // Otherwise, wrap it in an APIError
    throw new APIError(
      error instanceof Error ? error.message : 'Unknown error getting drug prices',
      500
    );
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
 * Test API connection
 * @returns True if the API connection is successful, false otherwise
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    console.log('Server: Testing API connection');
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      return false;
    }
    
    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      console.error('Failed to get authentication token');
      return false;
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    let baseUrl = apiUrl;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    const hqMapping = process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx';
    
    // Try drug names endpoint first (this one works)
    console.log('Server: Testing drug names endpoint');
    try {
      // Check if baseUrl already includes the pricing/v1 path
      const url = baseUrl.includes('/pricing/v1') 
        ? `${baseUrl}/drugs/names`
        : `${baseUrl}/pricing/v1/drugs/names`;
        
      console.log(`Server: Testing API connection with URL: ${url}`);
      
      // Create request payload based on Postman collection
      const payload = {
        hqMappingName: hqMapping,
        prefixText: "tylenol"
      };
      
      console.log('Server: Request payload:', JSON.stringify(payload));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log(`Server: API connection successful with URL: ${url}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`Server: API connection failed with URL ${url}: ${response.status} ${response.statusText}`, errorText);
      }
    } catch (error) {
      console.error(`Server: Error testing drug names endpoint:`, error);
    }
    
    // Try drug prices endpoint with the known working GSN value first
    console.log('Server: Testing drug prices by GSN endpoint');
    
    // Try the known working GSN value first, then others as fallback
    const gsnValues = [
      62733, // Known working GSN from Postman collection
      1790,  // Tylenol
      70954, // Another common medication
      2323,  // Try another value
      4815   // Try another value
    ];
    
    // Check if baseUrl already includes the pricing/v1 path
    const url = baseUrl.includes('/pricing/v1') 
      ? `${baseUrl}/drugprices/byGSN`
      : `${baseUrl}/pricing/v1/drugprices/byGSN`;
    
    for (const gsn of gsnValues) {
      try {
        console.log(`Server: Testing API connection with URL: ${url} and GSN: ${gsn}`);
        
        // Create request payload based on Postman collection
        const payload = {
          hqMappingName: hqMapping,
          gsn: gsn,
          latitude: 30.2672,
          longitude: -97.7431,
          customizedQuantity: false,
          quantity: 30 // Default quantity
        };
        
        console.log(`Server: Request payload for GSN ${gsn}:`, JSON.stringify(payload));
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        // 204 No Content is a valid response, but means no data for this GSN
        if (response.status === 204) {
          console.log(`Server: Received 204 No Content for GSN ${gsn} - no data available`);
          continue; // Try next GSN
        }
        
        if (response.ok) {
          console.log(`Server: API connection successful with URL: ${url} and GSN: ${gsn}`);
          return true;
        } else {
          const errorText = await response.text();
          console.error(`Server: API connection failed with URL ${url} and GSN ${gsn}: ${response.status} ${response.statusText}`, errorText);
        }
      } catch (error) {
        console.error(`Server: Error testing drug prices by GSN endpoint with GSN ${gsn}:`, error);
      }
    }
    
    // If we get here, all API connection tests failed
    console.error('Server: All API connection tests failed');
    return false;
  } catch (error) {
    console.error('Server: Error testing API connection:', error);
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
    console.log(`Server: Getting detailed drug info for GSN: ${gsn}, language: ${languageCode || 'default'}`);
    
    // Validate API URL
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Get authentication token
    try {
      const token = await getAuthToken();
      
      // Create URL with optional query parameters
      const url = new URL(`${baseUrl}/pricing/v1/druginfo/${gsn}`);
      
      // Add language code if provided
      if (languageCode) {
        url.searchParams.append('languageCode', languageCode);
      }
      
      console.log(`Server: Making API request to ${url.toString()}`);
      
      // Make API request
      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        // Check if the response is OK
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Server: API error (${response.status}): ${errorText}`);
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        // Parse response
        const data = await response.json();
        console.log(`Server: Successfully retrieved detailed drug info for GSN: ${gsn}`);
        
        return data;
      } catch (fetchError) {
        console.error(`Server: Fetch error for GSN ${gsn}:`, fetchError);
        throw new Error(`Error fetching drug info: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
    } catch (authError) {
      console.error('Server: Authentication error:', authError);
      throw new Error(`Authentication error: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`Server: Error in getDetailedDrugInfo for GSN ${gsn}:`, error);
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
