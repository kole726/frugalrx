import { NextResponse } from 'next/server';
import { getTokenStatus, forceTokenRefresh } from '@/lib/server/auth';

// Simple API key check for protection
// In a production environment, use a more secure authentication method
const API_DEBUG_KEY = process.env.API_DEBUG_KEY || 'debug-frugal-rx-token';

export async function GET(request: Request) {
  try {
    // Get the API key from the request headers
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('key');
    
    // Check if the API key is valid
    if (!apiKey || apiKey !== API_DEBUG_KEY) {
      console.warn(`[AUTH DEBUG] Unauthorized token status request from ${request.headers.get('user-agent')}`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the token status
    const status = await getTokenStatus();
    
    // Log the request
    console.log(`[AUTH DEBUG] Token status requested at ${new Date().toISOString()}`);
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('[AUTH DEBUG] Error getting token status:', error);
    return NextResponse.json(
      { error: 'Failed to get token status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the API key from the request headers
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('key');
    
    // Check if the API key is valid
    if (!apiKey || apiKey !== API_DEBUG_KEY) {
      console.warn(`[AUTH DEBUG] Unauthorized token refresh request from ${request.headers.get('user-agent')}`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Force refresh the token
    const token = await forceTokenRefresh();
    
    // Get the updated token status
    const status = await getTokenStatus();
    
    // Log the request
    console.log(`[AUTH DEBUG] Token force refreshed at ${new Date().toISOString()}`);
    
    return NextResponse.json({
      message: 'Token refreshed successfully',
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 10) + '...',
      ...status
    });
  } catch (error) {
    console.error('[AUTH DEBUG] Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
} 