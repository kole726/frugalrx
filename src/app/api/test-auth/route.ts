import { NextResponse } from 'next/server';
import { getAuthToken, getTokenStatus } from '@/lib/server/auth';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

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

/**
 * Test endpoint for verifying authentication token functionality
 * This endpoint makes a simple API request using the auth token
 */
export async function GET() {
  try {
    // Get authentication token
    const token = await getAuthToken();
    
    // Get token status for debugging
    const tokenStatus = await getTokenStatus();
    
    // Test the token with a simple API call
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      throw new Error('Missing AMERICAS_PHARMACY_API_URL environment variable');
    }
    
    // Ensure the URL is properly formatted
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const endpoint = `/pricing/v1/drugs/names`;
    
    // Make a test API call
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
        prefixText: 'adv'
      }),
      cache: 'no-store'
    });
    
    let apiTestResult;
    
    if (response.ok) {
      const data = await response.json();
      apiTestResult = {
        success: true,
        status: response.status,
        resultCount: Array.isArray(data) ? data.length : 0,
        sampleResults: Array.isArray(data) ? data.slice(0, 3) : data
      };
    } else {
      const errorText = await response.text();
      apiTestResult = {
        success: false,
        status: response.status,
        error: errorText
      };
    }
    
    // Return the token and test results
    return NextResponse.json({
      message: 'Authentication test',
      tokenStatus,
      apiTest: apiTestResult,
      environment: {
        apiUrl: process.env.AMERICAS_PHARMACY_API_URL,
        hqMapping: process.env.AMERICAS_PHARMACY_HQ_MAPPING,
        authUrl: process.env.AMERICAS_PHARMACY_AUTH_URL,
        clientId: process.env.AMERICAS_PHARMACY_CLIENT_ID ? '✓ Set' : '✗ Missing',
        clientSecret: process.env.AMERICAS_PHARMACY_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
        mockSettings: {
          useMockDrugSearch: process.env.NEXT_PUBLIC_USE_MOCK_DRUG_SEARCH,
          useMockDrugInfo: process.env.NEXT_PUBLIC_USE_MOCK_DRUG_INFO,
          useMockPharmacyPrices: process.env.NEXT_PUBLIC_USE_MOCK_PHARMACY_PRICES,
          fallbackToMock: process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK,
          useRealApi: process.env.NEXT_PUBLIC_USE_REAL_API
        }
      }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in auth test API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 