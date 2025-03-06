import { NextResponse } from 'next/server'
import { searchDrugs } from '@/lib/server/medicationService'
import { APIError } from '@/types/api'
import { getMockDrugSearchResults } from '@/lib/mockData'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Mock data for development
const MOCK_DRUGS = [
  { drugName: 'Amoxicillin', gsn: 1234 },
  { drugName: 'Lisinopril', gsn: 2345 },
  { drugName: 'Atorvastatin', gsn: 3456 },
  { drugName: 'Metformin', gsn: 4567 },
  { drugName: 'Levothyroxine', gsn: 5678 },
  { drugName: 'Amlodipine', gsn: 6789 },
  { drugName: 'Metoprolol', gsn: 7890 },
  { drugName: 'Albuterol', gsn: 8901 },
  { drugName: 'Omeprazole', gsn: 9012 },
  { drugName: 'Losartan', gsn: 1023 },
  { drugName: 'Gabapentin', gsn: 2134 },
  { drugName: 'Hydrochlorothiazide', gsn: 3245 },
  { drugName: 'Sertraline', gsn: 4356 },
  { drugName: 'Simvastatin', gsn: 5467 },
  { drugName: 'Vyvanse', gsn: 6578 }
];

export async function GET(
  request: Request,
  { params }: { params: { query: string } }
) {
  console.log(`Dynamic Search API: Searching for drugs with query: ${params.query}`);
  
  try {
    // Validate query parameter
    if (!params.query || params.query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Normalize the query to lowercase
    const normalizedQuery = params.query.toLowerCase();
    
    try {
      // Perform the search
      console.log('Attempting to search drugs with query:', normalizedQuery);
      const drugs = await searchDrugs(normalizedQuery);
      console.log('Search results:', drugs);
      
      // Return the results
      return NextResponse.json(drugs, { headers: corsHeaders });
    } catch (apiError) {
      console.error('API error in drug search:', apiError);
      
      // Fall back to mock data
      console.log('Using mock drug data due to API error');
      const mockResults = getMockDrugSearchResults(normalizedQuery);
      
      return NextResponse.json(mockResults, { 
        headers: corsHeaders 
      });
    }
  } catch (error) {
    console.error('Server error in drug search API:', error);
    
    // Fall back to mock data
    console.log('Using mock drug data due to server error');
    const mockResults = getMockDrugSearchResults(params.query.toLowerCase());
    
    return NextResponse.json(mockResults, { 
      headers: corsHeaders 
    });
  }
} 