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
    
    console.log(`Autocomplete API: Received query "${query}"`);
    
    if (!query) {
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
      // Get authentication token
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Failed to obtain authentication token');
      }
      
      console.log('Successfully obtained authentication token');
      
      // Try the API endpoint from the documentation
      const apiUrl = process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com';
      
      // Ensure the URL is properly formatted
      const baseUrl = apiUrl.replace(/\/+$/, '');
      const endpoint = '/pricing/v1/drugs/names';
      
      console.log(`Using America's Pharmacy API: ${baseUrl}${endpoint}`);
      
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
          // Format the results to match the expected format
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
              value
            };
          });
          
          return NextResponse.json(formattedResults, { headers: corsHeaders });
        }
      } else {
        const errorText = await response.text();
        console.error(`API error: ${response.status}`, errorText);
        
        // Try the direct approach as a fallback
        console.log(`API call failed, trying direct America's Pharmacy autocomplete endpoint for "${query}"`);
        
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