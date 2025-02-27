import { NextResponse } from 'next/server';
import { getAuthToken, getTokenStatus } from '@/lib/server/auth';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

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
    // Check for debug key to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const debugKey = searchParams.get('key');
    
    if (debugKey !== process.env.API_DEBUG_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }
    
    // Get token status
    const status = await getTokenStatus();
    
    // Try to get a fresh token
    let token = '';
    let tokenError = null;
    
    try {
      token = await getAuthToken();
    } catch (error) {
      tokenError = error instanceof Error ? error.message : String(error);
    }
    
    // Return debug information
    return NextResponse.json({
      status,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        authUrl: process.env.AMERICAS_PHARMACY_AUTH_URL ? '[SET]' : '[MISSING]',
        apiUrl: process.env.AMERICAS_PHARMACY_API_URL ? '[SET]' : '[MISSING]',
        clientId: process.env.AMERICAS_PHARMACY_CLIENT_ID ? '[SET]' : '[MISSING]',
        clientSecret: process.env.AMERICAS_PHARMACY_CLIENT_SECRET ? '[SET]' : '[MISSING]',
        useMockData: process.env.USE_MOCK_DATA || 'false',
      },
      freshToken: {
        success: !!token && !tokenError,
        error: tokenError,
        tokenLength: token ? token.length : 0,
      },
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in auth debug endpoint:', error);
    return NextResponse.json(
      { error: `Debug error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500, headers: corsHeaders }
    );
  }
} 