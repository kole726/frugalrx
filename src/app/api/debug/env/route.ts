import { NextResponse } from 'next/server';
import { API_CONFIG, USE_MOCK_DATA } from '@/config/environment';

export const dynamic = 'force-dynamic';

// Set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Get environment information
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA,
      NEXT_PUBLIC_USE_REAL_API: process.env.NEXT_PUBLIC_USE_REAL_API,
      NEXT_PUBLIC_FALLBACK_TO_MOCK: process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK,
      NEXT_PUBLIC_API_LOGGING: process.env.NEXT_PUBLIC_API_LOGGING,
      NEXT_PUBLIC_SHOW_DEBUG: process.env.NEXT_PUBLIC_SHOW_DEBUG,
      NEXT_PUBLIC_ENABLE_PHARMACY_MAP: process.env.NEXT_PUBLIC_ENABLE_PHARMACY_MAP,
      NEXT_PUBLIC_ENABLE_DRUG_ALTERNATIVE: process.env.NEXT_PUBLIC_ENABLE_DRUG_ALTERNATIVE,
    };
    
    // Get API configuration (without sensitive information)
    const apiConfig = {
      baseUrl: API_CONFIG.baseUrl ? 'Set' : 'Not set',
      authUrl: API_CONFIG.authUrl ? 'Set' : 'Not set',
      clientId: API_CONFIG.clientId ? 'Set' : 'Not set',
      clientSecret: API_CONFIG.clientSecret ? 'Set (value hidden)' : 'Not set',
      hqMappingName: API_CONFIG.hqMappingName,
      enableLogging: API_CONFIG.enableLogging,
    };
    
    // Check if server-side environment variables are set
    const serverEnvVars = {
      AMERICAS_PHARMACY_API_URL: process.env.AMERICAS_PHARMACY_API_URL ? 'Set' : 'Not set',
      AMERICAS_PHARMACY_AUTH_URL: process.env.AMERICAS_PHARMACY_AUTH_URL ? 'Set' : 'Not set',
      AMERICAS_PHARMACY_CLIENT_ID: process.env.AMERICAS_PHARMACY_CLIENT_ID ? 'Set' : 'Not set',
      AMERICAS_PHARMACY_CLIENT_SECRET: process.env.AMERICAS_PHARMACY_CLIENT_SECRET ? 'Set (value hidden)' : 'Not set',
      AMERICAS_PHARMACY_HQ_MAPPING: process.env.AMERICAS_PHARMACY_HQ_MAPPING,
    };
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      useMockData: USE_MOCK_DATA,
      envInfo,
      apiConfig,
      serverEnvVars,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error checking environment:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: `Failed to check environment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 