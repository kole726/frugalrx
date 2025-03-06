import { NextResponse } from 'next/server';
import { getMockDrugSearchResults } from '@/lib/mockData';
import { getAuthToken } from '@/lib/server/auth';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: Request,
  { params }: { params: { query: string } }
) {
  try {
    // Extract the query from the params
    const query = params.query;
    
    console.log(`API Drugautocomplete: Received query "${query}"`);
    console.log('Environment variables check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- AMERICAS_PHARMACY_API_URL:', process.env.AMERICAS_PHARMACY_API_URL ? 'Set' : 'Not set');
    console.log('- AMERICAS_PHARMACY_HQ_MAPPING:', process.env.AMERICAS_PHARMACY_HQ_MAPPING ? 'Set' : 'Not set');
    console.log('- NEXT_PUBLIC_USE_REAL_API:', process.env.NEXT_PUBLIC_USE_REAL_API);
    console.log('- NEXT_PUBLIC_FALLBACK_TO_MOCK:', process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK);
    
    if (!query) {
      console.error('API Drugautocomplete: Missing search query');
      return NextResponse.json(
        { error: 'Search query is required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // Validate query length
    if (query.length < 2) {
      console.log('API Drugautocomplete: Query too short:', query);
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // In production, always try to get real data first
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldUseRealApi = isProduction || process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
    
    console.log('API mode check:');
    console.log('- Is production environment:', isProduction);
    console.log('- Should use real API:', shouldUseRealApi);
    
    // Try to get real data from America's Pharmacy API if in production or explicitly enabled
    if (shouldUseRealApi) {
      try {
        // Get authentication token
        console.log('Attempting to get auth token...');
        const token = await getAuthToken();
        
        if (!token) {
          console.error('Failed to obtain authentication token');
          throw new Error('Failed to obtain authentication token');
        }
        
        console.log('Successfully obtained authentication token:', token.substring(0, 10) + '...');
        
        // Use the documented API endpoint from the Postman collection
        const apiUrl = process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com';
        
        // Ensure the URL is properly formatted
        const baseUrl = apiUrl.replace(/\/+$/, '');
        
        // Use the drug-names endpoint from the Postman collection
        const endpoint = '/pricing/v1/drugs/names';
        
        console.log(`Using America's Pharmacy API: ${baseUrl}${endpoint}`);
        
        // Prepare the request body
        const requestBody = {
          hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
          prefixText: query
        };
        
        console.log('Request body:', JSON.stringify(requestBody));
        
        // Make the API request using POST method as specified in the Postman collection
        console.log('Making API request...');
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          cache: 'no-store'
        });
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error: ${response.status}`, errorText);
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`API returned ${Array.isArray(data) ? data.length : 0} results`);
        
        if (Array.isArray(data) && data.length > 0) {
          // Format the results to match America's Pharmacy's autocomplete format
          const formattedResults = data.map(drugName => {
            return {
              label: typeof drugName === 'string' ? drugName : drugName.toString(),
              value: typeof drugName === 'string' ? drugName.replace(/\s*\(.*?\)$/, '') : drugName.toString().replace(/\s*\(.*?\)$/, '')
            };
          });
          
          console.log(`API Drugautocomplete: Returning ${formattedResults.length} results`);
          return NextResponse.json(formattedResults, { headers: corsHeaders });
        } else {
          // If no results from the POST method, try the GET method (opFindDrugByName)
          console.log('No results from POST method, trying GET method (opFindDrugByName)');
          
          // Use the opFindDrugByName endpoint from the API documentation
          const getEndpoint = `/pricing/v1/drugs/${encodeURIComponent(query)}`;
          
          console.log(`Using America's Pharmacy API GET: ${baseUrl}${getEndpoint}`);
          
          // Create URL with query parameters
          const url = new URL(`${baseUrl}${getEndpoint}`);
          url.searchParams.append('count', '20'); // Optional: limit results to 20
          url.searchParams.append('hqAlias', process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx');
          
          console.log(`Full request URL: ${url.toString()}`);
          
          const getResponse = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            cache: 'no-store'
          });
          
          console.log('GET API response status:', getResponse.status);
          
          if (getResponse.ok) {
            const getData = await getResponse.json();
            console.log(`GET API returned ${Array.isArray(getData) ? getData.length : 0} results`);
            
            if (Array.isArray(getData) && getData.length > 0) {
              // Format the results to match America's Pharmacy's autocomplete format
              const formattedGetResults = getData.map(drugName => {
                return {
                  label: typeof drugName === 'string' ? drugName : drugName.toString(),
                  value: typeof drugName === 'string' ? drugName.replace(/\s*\(.*?\)$/, '') : drugName.toString().replace(/\s*\(.*?\)$/, '')
                };
              });
              
              console.log(`API Drugautocomplete: Returning ${formattedGetResults.length} results from GET`);
              return NextResponse.json(formattedGetResults, { headers: corsHeaders });
            }
          } else {
            const getErrorText = await getResponse.text();
            console.error(`GET API error: ${getResponse.status}`, getErrorText);
          }
        }
      } catch (apiError: any) {
        console.error('Error connecting to America\'s Pharmacy API:', apiError);
        console.error('Error stack:', apiError.stack);
        
        // TEMPORARY: Always fall back to mock data in production with a warning
        // This is a temporary fix until we resolve the API connectivity issues
        if (isProduction) {
          console.log('TEMPORARY FIX: Using mock data in production with warning message');
          
          // Get mock results
          const mockResults = getMockDrugSearchResults(query);
          
          // Format the results to match America's Pharmacy format
          const formattedMockResults = mockResults.map(drug => ({
            label: drug.drugName + ' (DEMO DATA)',
            value: drug.drugName.replace(/\s*\(.*?\)$/, '')
          }));
          
          console.log(`API Drugautocomplete: Returning ${formattedMockResults.length} mock results with warning for "${query}"`);
          
          // Return the formatted results with a 200 status but include a warning header
          return NextResponse.json(formattedMockResults, { 
            headers: {
              ...corsHeaders,
              'X-Data-Source': 'mock',
              'X-Warning': 'Using demo data due to API connectivity issues'
            }
          });
        }
      }
    } else {
      console.log('Using mock data based on environment configuration');
    }
    
    // If all API attempts fail or we're configured to use mock data
    console.log(`API Drugautocomplete: Using mock data for "${query}"`);
    const mockResults = getMockDrugSearchResults(query);
    
    // Format the results to match America's Pharmacy format
    const formattedMockResults = mockResults.map(drug => ({
      label: drug.drugName,
      value: drug.drugName.replace(/\s*\(.*?\)$/, '')
    }));
    
    console.log(`API Drugautocomplete: Returning ${formattedMockResults.length} mock results for "${query}"`);
    
    // Return the formatted results
    return NextResponse.json(formattedMockResults, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error in drug autocomplete API:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 