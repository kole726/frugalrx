import { DrugInfo, DrugDetails, PharmacyPrice, DrugPriceResponse } from '@/types/api';
import { findGsnByDrugName } from '@/lib/drug-gsn-mapping';

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
    const normalizedQuery = query.toLowerCase().trim();
    console.log(`Client: Searching for medications with query: "${normalizedQuery}"`);
    
    if (normalizedQuery.length < 2) {
      console.log('Query too short, returning empty results');
      return [];
    }
    
    // Track API call attempts for logging
    let apiAttempts = 0;
    let apiSuccess = false;
    
    // First try direct API call if we're on the server
    if (typeof window === 'undefined') {
      try {
        apiAttempts++;
        console.log(`Server: Attempt ${apiAttempts} - Direct API call for drug search`);
        
        // Get authentication token (server-side only)
        const { getAuthToken } = await import('@/lib/server/auth');
        const token = await getAuthToken();
        
        const apiUrl = process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com';
        const endpoint = '/pricing/v1/drugs/names';
        
        console.log(`Server: Using direct API endpoint: ${apiUrl}${endpoint}`);
        
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
            prefixText: normalizedQuery
          }),
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Server: API returned ${Array.isArray(data) ? data.length : 0} results`);
          
          if (Array.isArray(data) && data.length > 0) {
            // Format the results
            const formattedResults = data.map(drugName => {
              // Check if the drug name contains GSN information
              const gsnMatch = typeof drugName === 'string' && drugName.match(/\(GSN: (\d+)\)/i);
              const gsn = gsnMatch ? parseInt(gsnMatch[1], 10) : undefined;
              
              return {
                drugName: typeof drugName === 'string' 
                  ? drugName.replace(/\s*\(GSN: \d+\)/i, '') // Remove GSN from display name
                  : drugName,
                gsn
              };
            });
            
            console.log(`Server: Formatted ${formattedResults.length} results`);
            return formattedResults;
          }
        } else {
          const errorText = await response.text();
          console.error(`Server: API error (${response.status}):`, errorText);
        }
      } catch (directApiError) {
        console.error('Server: Error with direct API call:', directApiError);
        console.log('Server: Falling back to API route');
      }
    }
    
    // First try the direct autocomplete endpoint
    try {
      apiAttempts++;
      // Use the client-side API proxy to avoid CORS issues
      const autocompleteEndpoint = `${API_BASE_URL}/api/drugs/autocomplete/${encodeURIComponent(normalizedQuery)}`;
      console.log(`[Attempt ${apiAttempts}] Using autocomplete endpoint: ${autocompleteEndpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(autocompleteEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store' // Ensure we don't use cached responses
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Client: Received autocomplete results:`, data);
        
        if (Array.isArray(data) && data.length > 0) {
          // Convert from America's Pharmacy format to our format
          const results = data.map(item => {
            // Extract GSN from label if present
            const gsnMatch = item.label && typeof item.label === 'string' 
              ? item.label.match(/\(GSN: (\d+)\)/)
              : null;
            const gsn = gsnMatch ? parseInt(gsnMatch[1], 10) : undefined;
            
            return {
              drugName: item.value || (typeof item === 'string' ? item : ''),
              gsn
            };
          });
          
          console.log(`Client: Found ${results.length} autocomplete results for "${normalizedQuery}"`);
          apiSuccess = true;
          return results;
        } else {
          console.log(`Client: Autocomplete endpoint returned empty results for "${normalizedQuery}"`);
        }
      } else {
        const errorText = await response.text();
        console.error(`Client: Autocomplete endpoint error (${response.status}):`, errorText);
      }
      
      // If autocomplete fails or returns empty, fall back to the search endpoint
      console.log(`Autocomplete failed or returned empty, falling back to search endpoint`);
    } catch (autocompleteError: any) {
      if (autocompleteError.name === 'AbortError') {
        console.error('Autocomplete endpoint timed out after 3 seconds');
      } else {
        console.error('Error with autocomplete endpoint:', autocompleteError);
      }
      console.log('Falling back to search endpoint');
    }
    
    // Try the search endpoint with query parameter
    try {
      apiAttempts++;
      const searchEndpoint = `${API_BASE_URL}/api/drugs/search?q=${encodeURIComponent(normalizedQuery)}`;
      
      console.log(`[Attempt ${apiAttempts}] Using search endpoint: ${searchEndpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(searchEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store' // Ensure we don't use cached responses
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Client: Received search results:`, data);
        
        // Return the results array from the response
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          console.log(`Client: Found ${data.results.length} results for "${normalizedQuery}"`);
          apiSuccess = true;
          return data.results;
        } else if (Array.isArray(data) && data.length > 0) {
          // Handle case where the API returns an array directly
          const formattedResults = data.map(item => {
            if (typeof item === 'string') {
              return { drugName: item };
            } else if (typeof item === 'object') {
              return {
                drugName: item.drugName || item.name || item.value || '',
                gsn: item.gsn || undefined
              };
            }
            return { drugName: String(item) };
          });
          
          console.log(`Client: Found ${formattedResults.length} direct results for "${normalizedQuery}"`);
          apiSuccess = true;
          return formattedResults;
        } else {
          console.log(`Client: Search endpoint returned empty results for "${normalizedQuery}"`);
        }
      } else {
        const errorText = await response.text();
        console.error(`Client: Search endpoint error (${response.status}):`, errorText);
      }
    } catch (searchError: any) {
      if (searchError.name === 'AbortError') {
        console.error('Search endpoint timed out after 3 seconds');
      } else {
        console.error('Error with search endpoint:', searchError);
      }
    }
    
    // If all API calls fail, return mock data only if NEXT_PUBLIC_FALLBACK_TO_MOCK is true
    console.log(`All ${apiAttempts} API attempts failed for "${normalizedQuery}"`);
    
    if (process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK === 'true') {
      console.log('Falling back to mock data as configured');
      return getMockDrugResults(normalizedQuery);
    } else {
      console.log('Not using mock data as fallback is disabled');
      return [];
    }
  } catch (error) {
    console.error('Client: Error searching medications:', error);
    
    // Return mock data as a last resort only if configured to do so
    if (process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK === 'true') {
      console.log('Falling back to mock data due to error');
      return getMockDrugResults(query.toLowerCase().trim());
    } else {
      console.log('Not using mock data as fallback is disabled');
      return [];
    }
  }
}

/**
 * Generate mock drug results when all API calls fail
 * @param query The search query
 * @returns Mock drug results
 */
function getMockDrugResults(query: string): DrugSearchResponse[] {
  const mockDrugs = [
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
    { drugName: 'Tylenol', gsn: 7689 },
    { drugName: 'Advil', gsn: 8790 },
    { drugName: 'Lipitor', gsn: 62733 },
    { drugName: 'Trintellix', gsn: 39968 },
    { drugName: 'Adderall', gsn: 1695 },
    { drugName: 'Xanax', gsn: 6102 },
    { drugName: 'Zoloft', gsn: 8612 },
    { drugName: 'Prozac', gsn: 6996 },
    { drugName: 'Lexapro', gsn: 58827 },
    { drugName: 'Cymbalta', gsn: 72872 },
    { drugName: 'Wellbutrin', gsn: 6989 }
  ];
  
  // Filter the mock drugs based on the query
  return mockDrugs.filter(drug => 
    drug.drugName.toLowerCase().includes(query)
  );
}

/**
 * Get prices for a medication at nearby pharmacies
 * @param criteria The search criteria
 * @returns Price information for the medication
 */
export async function getDrugPrices(criteria: DrugPriceRequest): Promise<DrugPriceResponse> {
  try {
    console.log('Client: Getting drug prices with criteria:', criteria);
    
    // Create a copy of the criteria to avoid modifying the original
    const requestCriteria = { ...criteria };
    
    // Determine which endpoint to use based on the provided criteria
    let endpoint = '';
    
    if (requestCriteria.gsn) {
      console.log(`Client: Using GSN ${requestCriteria.gsn} for drug price lookup`);
      endpoint = `${API_BASE_URL}/api/drugs/prices/byGSN`;
    } else if (requestCriteria.drugName) {
      console.log(`Client: Using drug name "${requestCriteria.drugName}" for drug price lookup`);
      endpoint = `${API_BASE_URL}/api/drugs/prices/byName`;
    } else if (requestCriteria.ndcCode) {
      console.log(`Client: Using NDC code ${requestCriteria.ndcCode} for drug price lookup`);
      endpoint = `${API_BASE_URL}/api/drugs/prices/byNdcCode`;
    } else {
      throw new Error('Either drugName, gsn, or ndcCode must be provided');
    }
    
    console.log(`Client: Using endpoint ${endpoint}`);
    
    // Make the API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestCriteria),
      cache: 'no-store' // Ensure we don't use cached responses
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Client: Drug prices API error: ${response.status}`, errorText);
      
      // If we get a 404 Not Found, try a fallback approach
      if (response.status === 404) {
        console.log('API endpoint not found, trying fallback approach');
        return await getFallbackDrugPrices(requestCriteria);
      }
      
      throw new Error(`Failed to get drug prices: ${response.status} - ${errorText || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log(`Client: Received drug prices:`, data);
    
    return data;
  } catch (error) {
    console.error('Client: Error getting drug prices:', error);
    
    // Try fallback approach if there's an error
    try {
      console.log('Error in primary approach, trying fallback');
      return await getFallbackDrugPrices(criteria);
    } catch (fallbackError) {
      console.error('Fallback approach also failed:', fallbackError);
      throw error; // Throw the original error
    }
  }
}

/**
 * Fallback function to get drug prices using the legacy API endpoint
 * @param criteria The search criteria
 * @returns Price information for the medication
 */
async function getFallbackDrugPrices(criteria: DrugPriceRequest): Promise<DrugPriceResponse> {
  console.log('Using fallback approach for drug prices');
  
  // If we have a drug name, use the direct byName endpoint
  if (criteria.drugName) {
    console.log(`Fallback: Using direct byName endpoint for drug "${criteria.drugName}"`);
    return getDrugPricesByName(
      criteria.drugName,
      criteria.latitude,
      criteria.longitude,
      criteria.radius,
      criteria.quantity
    );
  }
  
  // If we have a GSN, use the direct byGSN endpoint
  if (criteria.gsn) {
    console.log(`Fallback: Using direct byGSN endpoint for GSN ${criteria.gsn}`);
    
    // Make the API request to the legacy endpoint
    const response = await fetch(`${API_BASE_URL}/drugs/prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criteria),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Fallback API error: ${response.status}`, errorText);
      throw new Error(`Fallback API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  }
  
 throw new Error('No valid criteria for fallback approach');
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
 * @param languageCode Optional language code for localized information
 * @returns Detailed information about the medication
 */
export async function getDetailedDrugInfo(gsn: number, languageCode?: string): Promise<any> {
  try {
    console.log(`Client: Getting detailed drug info for GSN: ${gsn}`);
    
    // Build the URL with optional language code
    let url = `/api/drugs/info/gsn?gsn=${gsn}`;
    
    if (languageCode) {
      url += `&languageCode=${encodeURIComponent(languageCode)}`;
    }
    
    // Make the API request to our Next.js API route
    const response = await fetch(url, {
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
    
    console.log(`Client: Using API endpoint: ${url}`);
    
    // Try to get real data from API
    try {
      const response = await fetch(url, {
        // Add cache: 'no-store' to prevent caching of failed responses
        cache: 'no-store',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          
          // If we got mock data with an error, log it but don't throw
          if (errorData.usingMockData) {
            console.warn(`Client: Using mock data for "${normalizedDrugName}" due to API error:`, errorMessage);
            return errorData;
          }
        } catch (e) {
          // If we can't parse the error as JSON, use the status code
          console.error('Client: Could not parse error response as JSON:', e);
        }
        
        console.error(`Client: API error when getting info for "${normalizedDrugName}":`, errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Check if we got mock data
      if (data.usingMockData) {
        console.warn(`Client: Using mock data for "${normalizedDrugName}"`);
      } else {
        console.log(`Client: Received real drug info for "${normalizedDrugName}"`);
      }
      
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
    } catch (fetchError) {
      console.error(`Client: Fetch error for "${normalizedDrugName}":`, fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Client: Error fetching drug info:', error);
    
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
    
    // For other errors, provide a generic message
    throw new Error(`Error loading information for ${drugName}. ${errorMessage}`);
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

/**
 * Get detailed drug information by GSN
 * This is maintained for backward compatibility
 * @param gsn The GSN (Generic Sequence Number) of the medication
 * @param languageCode Optional language code for localized information
 * @returns Detailed information about the medication
 */
export async function getDrugDetailsByGsn(gsn: number, languageCode?: string): Promise<DrugDetails> {
  try {
    console.log(`Client: Getting drug details by GSN: ${gsn}`);
    
    // Use the new getDetailedDrugInfo function
    const detailedInfo = await getDetailedDrugInfo(gsn, languageCode);
    
    // Format the response to match the expected interface
    const formattedData: DrugDetails = {
      brandName: detailedInfo.brandName || `Medication (GSN: ${gsn})`,
      genericName: detailedInfo.genericName || `Medication (GSN: ${gsn})`,
      description: detailedInfo.description || `This medication (GSN: ${gsn}) is used to treat various conditions. Please consult with your healthcare provider for specific information.`,
      sideEffects: detailedInfo.sideEffects || "Side effects may vary. Please consult with your healthcare provider for detailed information.",
      dosage: detailedInfo.dosage || "Various strengths available",
      storage: detailedInfo.storage || "Store according to package instructions.",
      contraindications: detailedInfo.contraindications || "Please consult with your healthcare provider for contraindication information.",
      admin: detailedInfo.admin,
      disclaimer: detailedInfo.disclaimer,
      interaction: detailedInfo.interaction,
      missedD: detailedInfo.missedD,
      monitor: detailedInfo.monitor
    };
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching drug details:', error);
    throw error;
  }
}

/**
 * Get prices for a medication by name directly using the byName endpoint
 * @param drugName The name of the medication
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param radius Search radius in miles (optional)
 * @param quantity Medication quantity (optional)
 * @returns Price information for the medication
 */
export async function getDrugPricesByName(
  drugName: string,
  latitude: number,
  longitude: number,
  radius?: number,
  quantity?: number
): Promise<DrugPriceResponse> {
  try {
    console.log(`Client: Getting drug prices by name for "${drugName}"`);
    
    // Format the drug name - replace hyphens with spaces for API compatibility
    const formattedDrugName = drugName.replace(/-/g, ' ').trim();
    console.log(`Client: Formatted drug name: "${formattedDrugName}"`);
    
    // Create the request body according to the API documentation and Postman collection
    const requestBody = {
      hqMappingName: "walkerrx", // Required by America's Pharmacy API
      drugName: formattedDrugName,
      latitude,
      longitude,
      radius: radius || 50,
      ...(quantity ? {
        customizedQuantity: true,
        quantity
      } : {})
    };
    
    console.log('Client: Request body for drug prices:', requestBody);
    
    // First try the direct API endpoint (for server-side calls)
    if (typeof window === 'undefined') {
      try {
        // Get authentication token (server-side only)
        const { getAuthToken } = await import('@/lib/server/auth');
        const token = await getAuthToken();
        
        const apiUrl = process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com';
        const endpoint = '/pricing/v1/drugprices/byName';
        
        console.log(`Server: Using direct API endpoint: ${apiUrl}${endpoint}`);
        
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Server: Successfully retrieved drug prices from API');
          return data;
        } else {
          const errorText = await response.text();
          console.error(`Server: API error (${response.status}):`, errorText);
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }
      } catch (directApiError) {
        console.error('Server: Error with direct API call:', directApiError);
        console.log('Server: Falling back to API route');
      }
    }
    
    // For client-side or if direct API call failed, use our Next.js API route
    console.log(`Client: Using API route: ${API_BASE_URL}/api/drugs/prices/byName`);
    
    const response = await fetch(`${API_BASE_URL}/api/drugs/prices/byName`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorStatus = response.status;
      let errorMessage = `Failed to fetch drug prices by name: ${errorStatus}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error as JSON, use the status code
        console.error('Could not parse error response as JSON:', e);
      }
      
      console.error(`Client: API error when fetching drug prices by name:`, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Client: Error fetching drug prices by name:', error);
    throw error;
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