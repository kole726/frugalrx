import { NextResponse } from 'next/server'
import { searchDrugs } from '@/lib/server/medicationService'

interface APIError {
  message: string;
  status: number;
}

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
    
    // Test the auth token first
    try {
      const { getAuthToken } = await import('@/lib/server/auth');
      const token = await getAuthToken();
      console.log('Got auth token:', token.substring(0, 15) + '...' + token.substring(token.length - 10));
    } catch (authError) {
      console.error('Auth token error:', authError);
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
    
    return NextResponse.json(
      { error: `Failed to search drugs: ${errorMessage}` },
      { status: statusCode }
    );
  }
} 