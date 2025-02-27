import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server/auth';

/**
 * Test endpoint for verifying authentication token functionality
 * This endpoint makes a simple API request using the auth token
 */
export async function GET(request: Request) {
  try {
    console.log('[TEST AUTH] Testing authentication token...');
    
    // Get the authentication token
    const startTime = Date.now();
    const token = await getAuthToken();
    const tokenTime = Date.now() - startTime;
    
    console.log(`[TEST AUTH] Token obtained in ${tokenTime}ms`);
    
    // Make a simple API request to test the token
    // We'll use the drugs/names endpoint with a simple query
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      throw new Error('API URL not configured');
    }
    
    console.log(`[TEST AUTH] Making test API request to ${apiUrl}/drugs/names`);
    
    const requestStartTime = Date.now();
    const response = await fetch(`${apiUrl}/drugs/names`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: 'walkerrx',
        prefixText: 'a'  // Simple prefix to test
      }),
      cache: 'no-store' // Ensure we don't use cached responses
    });
    const requestTime = Date.now() - requestStartTime;
    
    console.log(`[TEST AUTH] API request completed in ${requestTime}ms with status ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TEST AUTH] API request failed: ${response.status}`, errorText);
      
      return NextResponse.json({
        success: false,
        message: 'API request failed',
        status: response.status,
        error: errorText,
        timing: {
          tokenTime,
          requestTime,
          totalTime: tokenTime + requestTime
        }
      });
    }
    
    // Get the response data
    const data = await response.json();
    const resultCount = Array.isArray(data) ? data.length : 0;
    
    console.log(`[TEST AUTH] API request successful, received ${resultCount} results`);
    
    return NextResponse.json({
      success: true,
      message: 'Authentication test successful',
      resultCount,
      timing: {
        tokenTime,
        requestTime,
        totalTime: tokenTime + requestTime
      },
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 10) + '...'
    });
  } catch (error) {
    console.error('[TEST AUTH] Error testing authentication:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Authentication test failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 