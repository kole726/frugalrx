import { NextResponse } from 'next/server';
import { getAuthToken, getTokenStatus } from '@/lib/server/auth';
import { API_CONFIG } from '@/config/environment';
import https from 'https';

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

// Helper function to make a simple API request
async function makeApiRequest(url: string, token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

export async function GET() {
  try {
    // Get token status
    const tokenStatus = await getTokenStatus();
    
    // Try to get a token
    let token;
    let tokenError;
    try {
      token = await getAuthToken();
    } catch (error) {
      tokenError = error instanceof Error ? error.message : String(error);
    }
    
    // Check API configuration
    const apiConfig = {
      baseUrl: API_CONFIG.baseUrl,
      authUrl: API_CONFIG.authUrl,
      clientIdSet: !!API_CONFIG.clientId,
      clientSecretSet: !!API_CONFIG.clientSecret,
      hqMappingName: API_CONFIG.hqMappingName,
    };
    
    // Try a simple API request if we have a token
    let apiTestResult;
    if (token) {
      try {
        // Test the drug search endpoint
        const testUrl = `${API_CONFIG.baseUrl}/v1/drugs/lip`;
        apiTestResult = await makeApiRequest(testUrl, token);
      } catch (error) {
        apiTestResult = {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tokenStatus,
      tokenObtained: !!token,
      tokenError,
      apiConfig,
      apiTestResult,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error checking API:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: `Failed to check API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 