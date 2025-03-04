import { NextResponse } from 'next/server';
import { getDrugInfoByName } from '@/lib/server/medicationService';
import { DrugDetails, APIError } from '@/types/api';
import { getMockDrugInfo } from '@/lib/mockData';
import { USE_MOCK_DATA } from '@/config/environment';

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
    
    // Check if we should use mock data
    const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DRUG_INFO === 'true' || USE_MOCK_DATA;
    
    console.log(`API: Drug info request for "${drugName}" with language: ${languageCode}`);
    console.log(`API: Using mock data: ${useMockData}`);
    
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
    
    // If mock data is explicitly requested, return it immediately
    if (useMockData) {
      console.log(`API: Explicitly using mock data for "${drugName}"`);
      const mockDrug = getMockDrugInfo(drugName);
      
      return NextResponse.json(
        {
          ...mockDrug,
          usingMockData: true
        },
        { headers: corsHeaders }
      );
    }
    
    try {
      // Try to get real data from the API
      console.log(`API: Getting drug info for: "${drugName}" with language: ${languageCode}`);
      
      // Pass the language code parameter to the service function
      const drugInfo = await getDrugInfoByName(drugName, languageCode);
      
      // Check if we got valid data
      if (!drugInfo || Object.keys(drugInfo).length === 0) {
        throw new Error('No data returned from API');
      }
      
      // Log the drug info we're returning
      console.log(`API: Successfully retrieved drug info for "${drugName}"`);
      
      return NextResponse.json(drugInfo, { headers: corsHeaders });
    } catch (apiError) {
      console.error('API: Error fetching drug info, falling back to mock data:', apiError);
      
      // Fall back to mock data if API fails
      const mockDrug = getMockDrugInfo(drugName);
      
      console.log(`API: Returning mock drug info for "${drugName}"`);
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
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        usingMockData: true,
        ...getMockDrugInfo('generic')  // Return generic mock data as a fallback
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 