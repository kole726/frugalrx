import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { searchDrugs } from '@/lib/server/medicationService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const countParam = searchParams.get('count');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const count = countParam ? parseInt(countParam, 10) : 10;
    
    const results = await searchDrugs(query);
    
    // Limit results if count parameter is provided
    const limitedResults = count ? results.slice(0, count) : results;
    
    return NextResponse.json(limitedResults, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in drug autocomplete API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 