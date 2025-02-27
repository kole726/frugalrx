import { NextResponse } from 'next/server'
import { searchDrugs } from '@/lib/server/medicationService'
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
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    console.log('Search query:', query)

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' }, 
        { status: 400, headers: corsHeaders }
      )
    }

    // Get drugs from the medication service
    const drugs = await searchDrugs(query);
    
    // Log the response for debugging
    console.log(`Found ${drugs.length} drugs matching "${query}"`);
    
    // Return the response with CORS headers
    return NextResponse.json(drugs, { headers: corsHeaders });
  } catch (error) {
    console.error('Server error in drug search API:', error);
    return NextResponse.json(
      { error: `Failed to search drugs: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500, headers: corsHeaders }
    );
  }
} 