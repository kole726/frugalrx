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
    
    console.log(`Drugautocomplete API: Received query "${query}"`);
    
    if (!query) {
      console.error('Drugautocomplete API: Missing search query');
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
      console.log('Drugautocomplete API: Query too short:', query);
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // Try to get real data from America's Pharmacy API
    try {
      // Get authentication token
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Failed to obtain authentication token');
      }
      
      console.log('Successfully obtained authentication token');
      
      // Use the endpoint from the sequence diagram (opFindDrugByName)
      const apiUrl = process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com';
      
      // Ensure the URL is properly formatted
      const baseUrl = apiUrl.replace(/\/+$/, '');
      
      // Use the opFindDrugByName endpoint from the sequence diagram
      const endpoint = `/pricing/v1/drugs/${encodeURIComponent(query)}`;
      
      console.log(`Using America's Pharmacy API: ${baseUrl}${endpoint}`);
      
      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        // Create URL with query parameters
        const url = new URL(`${baseUrl}${endpoint}`);
        url.searchParams.append('count', '20'); // Optional: limit results to 20
        url.searchParams.append('hqAlias', process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx');
        
        console.log(`Full request URL: ${url.toString()}`);
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const apiData = await response.json();
          console.log(`API returned ${Array.isArray(apiData) ? apiData.length : 0} results`);
          
          if (Array.isArray(apiData) && apiData.length > 0) {
            // Format the results to match America's Pharmacy's autocomplete format
            const formattedResults = apiData.map(drugName => {
              // Check if the drug name contains GSN information
              const gsnMatch = typeof drugName === 'string' && drugName.match(/\(GSN: (\d+)\)/i);
              const gsn = gsnMatch ? parseInt(gsnMatch[1], 10) : undefined;
              
              // Format the label and value
              const value = typeof drugName === 'string' ? drugName : drugName.value || drugName.drugName;
              const label = typeof drugName === 'string' 
                ? drugName 
                : drugName.label || `${drugName.value || drugName.drugName}${gsn ? ` (GSN: ${gsn})` : ''}`;
              
              return {
                label,
                value,
                gsn
              };
            });
            
            console.log(`Drugautocomplete API: Returning ${formattedResults.length} results from America's Pharmacy API`);
            return NextResponse.json(formattedResults, { headers: corsHeaders });
          }
        } else {
          const errorText = await response.text();
          console.error(`API error: ${response.status}`, errorText);
          
          // Try the POST method as a fallback
          throw new Error(`GET API Error ${response.status}: ${errorText}`);
        }
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.error('America\'s Pharmacy API request timed out after 5 seconds');
        } else {
          console.error('Error fetching from America\'s Pharmacy API with GET:', fetchError);
        }
        clearTimeout(timeoutId);
        
        // Try the POST method as a fallback
        console.log('Trying POST method as fallback');
        
        // Use the drugs/names endpoint from the Postman collection
        const postEndpoint = '/pricing/v1/drugs/names';
        
        const postResponse = await fetch(`${baseUrl}${postEndpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
            prefixText: query
          }),
          cache: 'no-store'
        });
        
        if (postResponse.ok) {
          const postData = await postResponse.json();
          console.log(`POST API returned ${Array.isArray(postData) ? postData.length : 0} results`);
          
          if (Array.isArray(postData) && postData.length > 0) {
            // Format the results to match America's Pharmacy's autocomplete format
            const formattedResults = postData.map(drugName => {
              // Check if the drug name contains GSN information
              const gsnMatch = typeof drugName === 'string' && drugName.match(/\(GSN: (\d+)\)/i);
              const gsn = gsnMatch ? parseInt(gsnMatch[1], 10) : undefined;
              
              // Format the label and value
              const value = typeof drugName === 'string' ? drugName : drugName.value || drugName.drugName;
              const label = typeof drugName === 'string' 
                ? drugName 
                : drugName.label || `${drugName.value || drugName.drugName}${gsn ? ` (GSN: ${gsn})` : ''}`;
              
              return {
                label,
                value,
                gsn
              };
            });
            
            console.log(`Drugautocomplete API: Returning ${formattedResults.length} results from POST fallback`);
            return NextResponse.json(formattedResults, { headers: corsHeaders });
          }
        } else {
          const postErrorText = await postResponse.text();
          console.error(`POST API error: ${postResponse.status}`, postErrorText);
          throw new Error(`POST API Error ${postResponse.status}: ${postErrorText}`);
        }
      }
    } catch (apiError: any) {
      console.error('Error connecting to America\'s Pharmacy API:', apiError);
      
      // Only fall back to mock data if configured to do so
      if (process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK === 'true') {
        console.log(`Drugautocomplete API: API attempt failed, falling back to mock data for "${query}"`);
        const mockResults = getMockDrugSearchResults(query);
        
        // Format the results to match America's Pharmacy format
        const formattedResults = mockResults.map(drug => ({
          label: `${drug.drugName}${drug.gsn ? ` (GSN: ${drug.gsn})` : ''}`,
          value: drug.drugName,
          gsn: drug.gsn
        }));
        
        console.log(`Drugautocomplete API: Returning ${formattedResults.length} mock results for "${query}"`);
        
        // Return the formatted results
        return NextResponse.json(formattedResults, { headers: corsHeaders });
      } else {
        // Return empty results if not configured to use mock data
        console.log('Not using mock data as fallback is disabled');
        return NextResponse.json([], { headers: corsHeaders });
      }
    }
    
    // If we get here, the API didn't return any results
    console.log(`Drugautocomplete API: No results found for "${query}"`);
    return NextResponse.json([], { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error in drug autocomplete API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 