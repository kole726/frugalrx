import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server/auth';

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

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { prefix = 'trin', hqMappingName = 'walkerrx' } = body;
    
    console.log(`Testing API with prefix: "${prefix}" and hqMappingName: "${hqMappingName}"`);
    
    // Get authentication token
    const token = await getAuthToken();
    console.log('Successfully obtained auth token for test');
    
    // Get the API URL from environment variables
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      throw new Error('API URL not configured');
    }
    
    // Ensure the URL is properly formatted
    const baseUrl = apiUrl.replace(/\/+$/, '');
    
    // Test endpoint - using the drugs/names endpoint with the provided parameters
    const endpoint = `${baseUrl}/pricing/v1/drugs/names`;
    
    console.log(`Testing API connection to ${endpoint}`);
    
    // Make a test request with the provided parameters
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        "hqMappingName": hqMappingName, 
        "prefixText": prefix 
      })
    });
    
    console.log(`API test response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API test failed: ${response.status}`, errorText);
      return NextResponse.json({
        status: 'error',
        message: `API test failed: ${response.status}`,
        error: errorText
      }, { status: response.status, headers: corsHeaders });
    }
    
    const data = await response.json();
    console.log(`API test response data:`, data);
    
    return NextResponse.json({
      status: 'success',
      message: 'API test successful',
      parameters: {
        prefix,
        hqMappingName
      },
      results: data
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in API test endpoint:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error testing API'
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 