import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server/auth';
import { testApiConnection } from '@/lib/server/medicationService';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    console.log('API: Testing connection and authentication');
    
    // Get environment variables (excluding secrets)
    const envInfo = {
      apiUrl: process.env.AMERICAS_PHARMACY_API_URL ? 'Set' : 'Not set',
      authUrl: process.env.AMERICAS_PHARMACY_AUTH_URL ? 'Set' : 'Not set',
      clientId: process.env.AMERICAS_PHARMACY_CLIENT_ID ? 'Set' : 'Not set',
      clientSecret: process.env.AMERICAS_PHARMACY_CLIENT_SECRET ? 'Set' : 'Not set',
      hqMapping: process.env.AMERICAS_PHARMACY_HQ_MAPPING,
      useMockDrugInfo: process.env.NEXT_PUBLIC_USE_MOCK_DRUG_INFO,
      useMockPharmacyPrices: process.env.NEXT_PUBLIC_USE_MOCK_PHARMACY_PRICES,
      useMockDrugSearch: process.env.NEXT_PUBLIC_USE_MOCK_DRUG_SEARCH,
      useRealApi: process.env.NEXT_PUBLIC_USE_REAL_API,
      fallbackToMock: process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK,
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('API: Environment variables:', envInfo);
    
    // Test authentication
    let authStatus = 'Not tested';
    let token = null;
    
    try {
      console.log('API: Testing authentication...');
      token = await getAuthToken();
      authStatus = token ? 'Success' : 'Failed (no token returned)';
      console.log('API: Authentication test result:', authStatus);
    } catch (authError) {
      authStatus = `Failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`;
      console.error('API: Authentication test error:', authError);
    }
    
    // Test API connection
    let apiConnectionStatus = 'Not tested';
    
    try {
      console.log('API: Testing API connection...');
      if (token) {
        const apiConnection = await testApiConnection();
        apiConnectionStatus = apiConnection ? 'Success' : 'Failed';
      } else {
        apiConnectionStatus = 'Skipped (authentication failed)';
      }
      console.log('API: API connection test result:', apiConnectionStatus);
    } catch (apiError) {
      apiConnectionStatus = `Failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`;
      console.error('API: API connection test error:', apiError);
    }
    
    // Return the results
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      tests: {
        authentication: authStatus,
        apiConnection: apiConnectionStatus
      }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in test-connection API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
} 