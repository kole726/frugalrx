import { NextResponse } from 'next/server'
import { searchDrugs } from '@/lib/server/medicationService'
import { APIError } from '@/types/api'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

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
  console.log(`Searching for drugs: ${params.query}`);
  
  try {
    // Validate query parameter
    if (!params.query || params.query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    // In development mode, use mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock drug data in development mode');
      const normalizedQuery = params.query.toLowerCase();
      const filteredDrugs = MOCK_DRUGS.filter(drug => 
        drug.drugName.toLowerCase().includes(normalizedQuery)
      );
      console.log(`Found ${filteredDrugs.length} mock drugs matching "${normalizedQuery}"`);
      return NextResponse.json(filteredDrugs);
    }
    
    // Test the auth token first
    try {
      const { getAuthToken } = await import('@/lib/server/auth');
      const token = await getAuthToken();
      console.log('Got auth token:', token.substring(0, 15) + '...' + token.substring(token.length - 10));
    } catch (authError) {
      console.error('Auth token error:', authError);
      
      // In development, return mock data on auth error
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock drug data due to auth error');
        const normalizedQuery = params.query.toLowerCase();
        const filteredDrugs = MOCK_DRUGS.filter(drug => 
          drug.drugName.toLowerCase().includes(normalizedQuery)
        );
        return NextResponse.json(filteredDrugs);
      }
      
      return NextResponse.json(
        { error: `Authentication error: ${authError instanceof Error ? authError.message : 'Unknown error'}` },
        { status: 401 }
      );
    }
    
    // Normalize the query to lowercase
    const normalizedQuery = params.query.toLowerCase();
    
    // Perform the search
    console.log('Attempting to search drugs with query:', normalizedQuery);
    const drugs = await searchDrugs(normalizedQuery);
    console.log('Search results:', drugs);
    
    // Return the results
    return NextResponse.json(drugs);
  } catch (error) {
    console.error('Server error in drug search API:', error);
    
    // Determine appropriate status code
    let statusCode = 500;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for specific error types
    if (errorMessage.includes('401') || errorMessage.includes('Authentication failed')) {
      statusCode = 401;
      console.error('Authentication error detected. Status code:', statusCode);
    } else if (errorMessage.includes('404')) {
      statusCode = 404;
      console.error('Not found error detected. Status code:', statusCode);
    }
    
    // Log detailed error information
    console.error(`Drug search API error details:
      - Query: ${params.query}
      - Status code: ${statusCode}
      - Error message: ${errorMessage}
    `);
    
    // In development, return mock data on error
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock drug data due to API error');
      const normalizedQuery = params.query.toLowerCase();
      const filteredDrugs = MOCK_DRUGS.filter(drug => 
        drug.drugName.toLowerCase().includes(normalizedQuery)
      );
      return NextResponse.json(filteredDrugs);
    }
    
    return NextResponse.json(
      { error: `Failed to search drugs: ${errorMessage}` },
      { status: statusCode }
    );
  }
} 