import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getDetailedDrugInfo } from '@/lib/server/medicationService';
import { DrugDetails, APIError } from '@/types/api';
import { getMockDrugInfo } from '@/lib/mockData';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gsn = searchParams.get('gsn');
    const languageCode = searchParams.get('languageCode') || 'en';

    if (!gsn) {
      return NextResponse.json(
        { error: 'GSN parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const gsnNumber = parseInt(gsn, 10);
    if (isNaN(gsnNumber)) {
      return NextResponse.json(
        { error: 'GSN must be a valid number' },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      // Get real data from the API
      console.log(`API: Getting detailed drug info for GSN: ${gsnNumber}`);
      const drugInfo = await getDetailedDrugInfo(gsnNumber, languageCode);
      
      // Log the drug info we're returning
      console.log(`API: Returning detailed drug info for GSN ${gsnNumber}:`, drugInfo);
      
      return NextResponse.json(drugInfo, { headers: corsHeaders });
    } catch (error) {
      console.error('API: Error fetching detailed drug info, falling back to mock data:', error);
      
      // Fall back to mock data if API fails
      const mockDrug = getMockDrugInfo(`GSN:${gsnNumber}`);
      
      console.log(`API: Returning mock drug info for GSN ${gsnNumber}:`, mockDrug);
      return NextResponse.json({
        ...mockDrug,
        error: error instanceof Error ? error.message : 'Unknown error',
        usingMockData: true
      }, { headers: corsHeaders });
    }
  } catch (error) {
    console.error('Error fetching drug info by GSN:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 