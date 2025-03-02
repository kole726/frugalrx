import { NextResponse } from 'next/server'
import { searchDrugs } from '@/lib/server/medicationService'
import { findGsnByDrugName } from '@/lib/drug-gsn-mapping'
import { APIError } from '@/types/api'
import { getAuthToken } from '@/lib/server/auth'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    
    if (!query || query.length < 2) {
      return NextResponse.json(
        { results: [] },
        { headers: corsHeaders }
      );
    }
    
    console.log(`API: Searching for drugs with query: "${query}"`);
    
    // Search for drugs using the API
    const results = await searchDrugs(query);
    
    // Enhance results with GSN from our mapping if not already present
    const enhancedResults = results.map(drug => {
      // If the drug already has a GSN, use it
      if (drug.gsn) {
        return drug;
      }
      
      // Try to find a GSN from our mapping
      const gsn = findGsnByDrugName(drug.drugName);
      if (gsn) {
        console.log(`API: Found GSN ${gsn} for ${drug.drugName} from local mapping`);
        return {
          ...drug,
          gsn
        };
      }
      
      return drug;
    });
    
    console.log(`API: Returning ${enhancedResults.length} drug results with GSN mapping`);
    return NextResponse.json(
      { results: enhancedResults },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('API: Error in drug search:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
} 