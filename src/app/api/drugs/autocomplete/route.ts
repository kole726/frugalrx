import { NextResponse } from 'next/server';
import { getMockDrugSearchResults } from '@/lib/mockData';

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
    
    // Get mock drug results
    const mockResults = getMockDrugSearchResults(query);
    
    // Format the results to match America's Pharmacy format
    const formattedResults = mockResults.map(drug => ({
      label: `${drug.drugName.toUpperCase()}${drug.gsn ? ` (GSN: ${drug.gsn})` : ''}`,
      value: drug.drugName
    }));
    
    console.log(`Autocomplete API: Returning ${formattedResults.length} results for "${query}"`);
    
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