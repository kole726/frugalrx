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

export async function GET(request: Request) {
  try {
    // Extract the query from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const query = pathParts[pathParts.length - 1];
    
    console.log(`Autocomplete API: Received query "${query}"`);
    
    if (!query || query === 'autocomplete') {
      console.error('Autocomplete API: Missing search query');
      return NextResponse.json(
        { error: 'Search query is required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // Try to get real data from America's Pharmacy API
    try {
      // First try the direct approach like America's Pharmacy website uses
      console.log(`Trying direct America's Pharmacy autocomplete endpoint for "${query}"`);
      
      // This is the endpoint used by the America's Pharmacy website as seen in the HAR file
      const directResponse = await fetch(`https://www.americaspharmacy.com/drugautocomplete/${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log(`Direct autocomplete returned ${Array.isArray(data) ? data.length : 0} results`);
        
        if (Array.isArray(data) && data.length > 0) {
          // Return the data directly as it's already in the format we want
          return NextResponse.json(data, { headers: corsHeaders });
        }
      } else {
        console.log(`Direct autocomplete failed with status ${directResponse.status}`);
      }
      
      // If direct approach fails, try the API with authentication
      console.log(`Trying authenticated API for "${query}"`);
      
      // Get authentication token
      const token = await getAuthToken();
      
      // Try the API endpoint from the documentation
      const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
      if (!apiUrl) {
        throw new Error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      }
      
      // Ensure the URL is properly formatted
      const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const endpoint = `/pricing/v1/drugs/names`;
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
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
      
      if (response.ok) {
        const apiData = await response.json();
        console.log(`API returned ${Array.isArray(apiData) ? apiData.length : 0} results`);
        
        if (Array.isArray(apiData) && apiData.length > 0) {
          // Format the results to match America's Pharmacy website format
          const formattedResults = apiData.map(drugName => ({
            label: `${drugName}`,
            value: drugName
          }));
          
          return NextResponse.json(formattedResults, { headers: corsHeaders });
        }
      } else {
        const errorText = await response.text();
        console.error(`API error: ${response.status}`, errorText);
      }
    } catch (apiError) {
      console.error('Error connecting to America\'s Pharmacy API:', apiError);
    }
    
    // If all API attempts fail, fall back to mock data
    console.log(`All API attempts failed, falling back to mock data for "${query}"`);
    const mockResults = getMockDrugSearchResults(query);
    
    // Format the results to match America's Pharmacy format
    const formattedResults = mockResults.map(drug => ({
      label: `${drug.drugName}${drug.gsn ? ` (GSN: ${drug.gsn})` : ''}`,
      value: drug.drugName
    }));
    
    console.log(`Autocomplete API: Returning ${formattedResults.length} mock results for "${query}"`);
    
    // Return the formatted results
    return NextResponse.json(formattedResults, { headers: corsHeaders });
  } catch (error) {
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