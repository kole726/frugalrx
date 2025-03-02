import { NextResponse } from 'next/server';
import { getDrugInfoByName } from '@/lib/server/medicationService';
import { DrugDetails, APIError } from '@/types/api';
import { getMockDrugInfo } from '@/lib/mockData';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get the drug name from the URL query parameter
    const url = new URL(request.url);
    const drugName = url.searchParams.get('name');
    
    if (!drugName) {
      console.error('API: Missing drug name parameter');
      return NextResponse.json(
        { error: 'Drug name is required' },
        { status: 400 }
      );
    }
    
    // Validate drug name length
    if (drugName.trim().length < 3) {
      console.error(`API: Drug name too short: "${drugName}"`);
      return NextResponse.json(
        { error: 'Drug name must be at least 3 characters long' },
        { status: 400 }
      );
    }
    
    try {
      // Try to get real data from the API
      console.log(`API: Getting drug info for: "${drugName}"`);
      const drugInfo = await getDrugInfoByName(drugName);
      
      // Log the drug info we're returning
      console.log(`API: Returning drug info for "${drugName}":`, drugInfo);
      
      return NextResponse.json(drugInfo);
    } catch (apiError) {
      console.error('API: Error fetching drug info, falling back to mock data:', apiError);
      
      // Fall back to mock data if API fails
      const mockDrug = getMockDrugInfo(drugName);
      
      console.log(`API: Returning mock drug info for "${drugName}":`, mockDrug);
      return NextResponse.json(mockDrug);
    }
  } catch (error) {
    console.error('Error in drug info API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 