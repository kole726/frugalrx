import { NextRequest, NextResponse } from 'next/server'
import { searchDrugsByPrefix } from '@/lib/server/medicationService'
import { findGsnByDrugName } from '@/lib/drug-gsn-mapping'
import { shouldFallbackToMock } from '@/config/environment'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Set CORS headers
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
  request: NextRequest,
  { params }: { params: { prefix: string } }
) {
  try {
    // Get the prefix from the URL params
    const prefix = params.prefix;
    
    if (!prefix) {
      console.error('API: Missing prefix parameter');
      return NextResponse.json(
        { error: 'Prefix parameter is required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // Validate prefix length - API requires at least 3 characters
    if (prefix.length < 3) {
      console.error('API: Prefix too short:', prefix);
      return NextResponse.json(
        { error: 'Prefix must be at least 3 characters' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // Get optional query parameters
    const searchParams = request.nextUrl.searchParams;
    const count = searchParams.get('count') ? parseInt(searchParams.get('count') as string, 10) : 10;
    const hqAlias = searchParams.get('hqAlias') || undefined;
    
    console.log(`API: Searching for drugs with prefix: "${prefix}", count: ${count}, hqAlias: ${hqAlias || 'default'}`);
    
    try {
      // Get drug results from the API
      const results = await searchDrugsByPrefix(prefix, count, hqAlias);
      
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
      
      console.log(`API: Found ${enhancedResults.length} results for prefix "${prefix}"`);
      
      return NextResponse.json(
        { results: enhancedResults },
        { headers: corsHeaders }
      );
    } catch (apiError) {
      console.error('API: Error searching drugs by prefix:', apiError);
      
      // If we should fall back to mock data, return an empty array
      if (shouldFallbackToMock()) {
        console.log('API: Falling back to mock data due to API error');
        return NextResponse.json(
          { results: [] },
          { headers: corsHeaders }
        );
      }
      
      // If we shouldn't fall back to mock data, return the error
      return NextResponse.json(
        { 
          error: 'Failed to search for medications by prefix',
          details: apiError instanceof Error ? apiError.message : String(apiError)
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }
  } catch (error) {
    console.error('Error in drug search by prefix API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 