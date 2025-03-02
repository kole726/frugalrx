import { NextResponse } from 'next/server';
import { getDetailedDrugInfo } from '@/lib/server/medicationService';
import { DrugDetails, APIError } from '@/types/api';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get the GSN from the URL query parameter
    const url = new URL(request.url);
    const gsnParam = url.searchParams.get('gsn');
    
    if (!gsnParam) {
      console.error('API: Missing GSN parameter');
      return NextResponse.json(
        { error: 'GSN is required' },
        { status: 400 }
      );
    }
    
    const gsn = parseInt(gsnParam, 10);
    
    if (isNaN(gsn)) {
      console.error('API: Invalid GSN parameter:', gsnParam);
      return NextResponse.json(
        { error: 'Invalid GSN parameter' },
        { status: 400 }
      );
    }
    
    // Get real data from the API
    console.log(`API: Getting detailed drug info for GSN: ${gsn}`);
    const drugInfo = await getDetailedDrugInfo(gsn);
    
    // Log the drug info we're returning
    console.log(`API: Returning detailed drug info for GSN ${gsn}:`, drugInfo);
    
    return NextResponse.json(drugInfo);
  } catch (error) {
    console.error('Error in detailed drug info API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 