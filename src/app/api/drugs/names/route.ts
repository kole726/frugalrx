import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/server/auth'
import { MOCK_DRUG_DATA } from '@/lib/mockData'

// Define a type for mock drug search results
interface MockDrugSearchResult {
  brandName: string;
  genericName: string;
  gsn: number;
}

// Create mock drug search results from the MOCK_DRUG_DATA
const MOCK_DRUG_SEARCH_RESULTS: MockDrugSearchResult[] = Object.entries(MOCK_DRUG_DATA).map(([key, drug]) => ({
  brandName: drug.brandName,
  genericName: drug.genericName,
  gsn: Math.floor(Math.random() * 10000) // Generate a random GSN for mock data
}));

// Add some additional common medications
const ADDITIONAL_MOCK_DRUGS: MockDrugSearchResult[] = [
  { brandName: 'Metformin', genericName: 'Metformin', gsn: 4567 },
  { brandName: 'Levothyroxine', genericName: 'Levothyroxine', gsn: 5678 },
  { brandName: 'Amlodipine', genericName: 'Amlodipine', gsn: 6789 },
  { brandName: 'Metoprolol', genericName: 'Metoprolol', gsn: 7890 },
  { brandName: 'Albuterol', genericName: 'Albuterol', gsn: 8901 },
  { brandName: 'Omeprazole', genericName: 'Omeprazole', gsn: 9012 },
  { brandName: 'Losartan', genericName: 'Losartan', gsn: 1023 },
  { brandName: 'Gabapentin', genericName: 'Gabapentin', gsn: 2134 },
  { brandName: 'Hydrochlorothiazide', genericName: 'Hydrochlorothiazide', gsn: 3245 },
  { brandName: 'Sertraline', genericName: 'Sertraline', gsn: 4356 },
  { brandName: 'Simvastatin', genericName: 'Simvastatin', gsn: 5467 },
  { brandName: 'Vyvanse', genericName: 'Lisdexamfetamine', gsn: 6578 },
];

// Combine all mock drugs
const ALL_MOCK_DRUGS = [...MOCK_DRUG_SEARCH_RESULTS, ...ADDITIONAL_MOCK_DRUGS];

// Configuration to bypass Vercel authentication for this API route
export const runtime = 'edge'
export const preferredRegion = ['iad1']

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Helper function to capitalize the first letter of each word
function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log(`API: Received request body:`, body);
    
    const { prefix = '', hqMappingName = 'americaspharmacy' } = body;
    console.log(`API: Extracted prefix from request: "${prefix}"`);
    
    if (!prefix || prefix.length < 2) {
      console.log(`API: Prefix too short (${prefix.length}), returning empty results`);
      return NextResponse.json({ results: [] }, { headers: corsHeaders });
    }
    
    // Check if we should use mock data
    const useMockData = process.env.USE_MOCK_DATA === 'true';
    console.log('API: USE_MOCK_DATA environment variable is set to:', useMockData);
    
    if (!useMockData) {
      try {
        // Get authentication token
        console.log('API: Attempting to get auth token...');
        const token = await getAuthToken();
        console.log('API: Successfully obtained new auth token');
        
        // Make API request to the external service
        const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
        console.log('API: Using API URL:', apiUrl);
        
        if (!apiUrl) {
          throw new Error('API URL not configured');
        }
        
        // Ensure the URL is properly formatted by removing trailing slashes
        const baseUrl = apiUrl.replace(/\/+$/, '');
        
        // Use the correct endpoint for drug search based on API documentation
        // GET /v1/drugs/{prefixText}
        const endpoint = `/drugs/${encodeURIComponent(prefix)}`;
        
        // Check if baseUrl already includes the pricing/v1 path
        const fullEndpoint = baseUrl.includes('/pricing/v1') ? endpoint : `/pricing/v1${endpoint}`;
        
        const url = `${baseUrl}${fullEndpoint}`;
        
        console.log(`API: Making API request to ${url}`);
        
        // Create URL with optional query parameters
        const requestUrl = new URL(url);
        requestUrl.searchParams.append('count', '20'); // Optional: limit results to 20
        requestUrl.searchParams.append('hqAlias', hqMappingName); // Use the provided hqMappingName
        
        // Make API request using GET method as specified in the documentation
        const response = await fetch(requestUrl.toString(), {
          method: 'GET', // Using GET as specified in the API docs
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store' // Ensure we don't use cached responses
        });
        
        console.log(`API: Response status:`, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API: Error from America's Pharmacy API: ${response.status}`, errorText);
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`API: Received raw response from America's Pharmacy API:`, JSON.stringify(data));
        
        // Process the response - according to the API docs, the response is an array of strings
        if (Array.isArray(data)) {
          const results = data.map(drugName => ({
            drugName: typeof drugName === 'string' 
              ? drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase()
              : drugName,
            gsn: 0 // We don't get GSN from this endpoint
          }));
          
          console.log(`API: Processed ${results.length} drug results`);
          return NextResponse.json({ results }, { headers: corsHeaders });
        } else {
          console.log(`API: Unexpected response format:`, JSON.stringify(data));
          throw new Error('Unexpected API response format');
        }
      } catch (apiError) {
        console.error('API: Error fetching drug names, falling back to mock data:', apiError);
        // Continue to mock data fallback
      }
    }
    
    // If we get here, either useMockData is true or the API calls failed
    console.log('API: Using mock data for drug names');
    
    // Filter mock data based on the prefix
    const filteredResults = ALL_MOCK_DRUGS
      .filter((drug: MockDrugSearchResult) => {
        const brandMatch = drug.brandName.toLowerCase().includes(prefix.toLowerCase());
        const genericMatch = drug.genericName.toLowerCase().includes(prefix.toLowerCase());
        return brandMatch || genericMatch;
      })
      .map((drug: MockDrugSearchResult) => ({
        drugName: drug.brandName,
        gsn: drug.gsn
      }));
    
    console.log(`API: Returning ${filteredResults.length} mock drug names`);
    return NextResponse.json({ results: filteredResults }, { headers: corsHeaders });
  } catch (error) {
    console.error('API: Error in drug names API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
} 