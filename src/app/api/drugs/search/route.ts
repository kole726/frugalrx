import { NextResponse } from 'next/server'
import { searchDrugs } from '@/lib/server/medicationService'
import { findGsnByDrugName } from '@/lib/drug-gsn-mapping'
import { getMockDrugSearchResults } from '@/lib/mockData'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    // Get the search query from the URL
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    
    if (!query) {
      console.error('API: Missing search query');
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
      console.error('API: Search query too short:', query);
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    console.log(`API: Searching for drugs with query: "${query}"`);
    
    try {
      // Get drug results from the API
      const results = await searchDrugs(query);
      
      // Enhance results with GSN mapping for drugs that don't have a GSN
      const enhancedResults = results.map(drug => {
        if (!drug.gsn) {
          const gsn = findGsnByDrugName(drug.drugName);
          if (gsn) {
            console.log(`API: Enhanced ${drug.drugName} with GSN ${gsn} from local mapping`);
            return { ...drug, gsn };
          }
        }
        return drug;
      });
      
      console.log(`API: Found ${enhancedResults.length} results for "${query}"`);
      
      return NextResponse.json(
        { results: enhancedResults },
        { headers: corsHeaders }
      );
    } catch (apiError) {
      console.error('API: Error searching drugs, falling back to mock data:', apiError);
      
      // Fall back to mock data if API fails
      const mockResults = getMockDrugSearchResults(query);
      
      console.log(`API: Returning ${mockResults.length} mock results for "${query}"`);
      return NextResponse.json(
        { 
          results: mockResults,
          error: apiError instanceof Error ? apiError.message : 'Unknown error',
          usingMockData: true
        },
        { headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Error in drug search API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 