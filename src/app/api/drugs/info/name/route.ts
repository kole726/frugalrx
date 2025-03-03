import { NextResponse } from 'next/server';
import { getDrugInfoByName } from '@/lib/server/medicationService';
import { DrugDetails, APIError } from '@/types/api';
import { getMockDrugInfo } from '@/lib/mockData';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

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
    // Get the drug name from the URL query parameter
    const url = new URL(request.url);
    const drugName = url.searchParams.get('name');
    const languageCode = url.searchParams.get('languageCode') || 'en';
    
    if (!drugName) {
      console.error('API: Missing drug name parameter');
      return NextResponse.json(
        { error: 'Drug name is required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    try {
      // Try to get real data from the API
      console.log(`API: Getting drug info for: "${drugName}" with language: ${languageCode}`);
      // Check if the function accepts a languageCode parameter
      const drugInfo = await getDrugInfoByName(drugName);
      
      // Log the drug info we're returning
      console.log(`API: Returning drug info for "${drugName}":`, drugInfo);
      
      return NextResponse.json(drugInfo, { headers: corsHeaders });
    } catch (apiError) {
      console.error('API: Error fetching drug info, falling back to mock data:', apiError);
      
      // Fall back to mock data if API fails
      const mockDrug = getMockDrugInfo(drugName);
      
      console.log(`API: Returning mock drug info for "${drugName}":`, mockDrug);
      return NextResponse.json(
        {
          ...mockDrug,
          error: apiError instanceof Error ? apiError.message : 'Unknown error',
          usingMockData: true
        },
        { headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Error in drug info API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 