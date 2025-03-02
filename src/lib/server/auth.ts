'use server';

/**
 * Server-only authentication utilities for API requests
 * Enhanced with detailed logging for token expiration debugging
 */

import { API_CONFIG, USE_MOCK_DATA } from '@/config/environment';

interface AuthToken {
  token_type: string;
  expires_in: number;
  access_token: string;
}

// Token state tracking
let cachedToken: AuthToken | null = null;
let tokenExpiryTime: number | null = null;
let tokenRequestCount = 0;
let tokenRefreshCount = 0;
let lastTokenError: Error | null = null;
let tokenRefreshHistory: Array<{
  timestamp: string;
  action: string;
  success: boolean;
  expiryTime?: string;
  error?: string;
}> = [];

// Mock token for development - Updated with kid header
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImZydWdhbHJ4LWRldi1rZXktMjAyNCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZydWdhbFJ4IERldmVsb3BlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTE2MjM5MDIyLCJzY29wZSI6ImNjZHMucmVhZCJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Production token kid value
const PRODUCTION_KID = 'frugalrx-prod-key-2024';

/**
 * Format a timestamp for logging
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format a date for human-readable display
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Log token-related events with timestamps
 */
function logTokenEvent(action: string, success: boolean, details?: Record<string, any>, error?: Error): void {
  // Only log if logging is enabled
  if (!API_CONFIG.enableLogging) return;
  
  const timestamp = getTimestamp();
  
  // Add to history (limit to last 20 events)
  tokenRefreshHistory.unshift({
    timestamp,
    action,
    success,
    ...(details?.expiryTime ? { expiryTime: formatDate(details.expiryTime) } : {}),
    ...(error ? { error: error.message } : {})
  });
  
  if (tokenRefreshHistory.length > 20) {
    tokenRefreshHistory.pop();
  }
  
  // Log to console with timestamp
  if (success) {
    console.log(`[AUTH ${timestamp}] ${action}:`, details || '');
  } else {
    console.error(`[AUTH ${timestamp}] ${action} FAILED:`, error || '', details || '');
  }
}

// Function to add kid header to JWT token if missing
function ensureKidHeader(token: string): string {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[AUTH] Invalid token format, cannot add kid header');
      return token;
    }

    // Decode the header
    const headerBase64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    const headerJson = Buffer.from(headerBase64, 'base64').toString();
    let header;
    
    try {
      header = JSON.parse(headerJson);
    } catch (e) {
      console.error('[AUTH] Error parsing token header:', e);
      return token;
    }

    // If kid already exists and matches our expected value, return the original token
    if (header.kid === PRODUCTION_KID) {
      return token;
    }

    // Add or update kid in the header
    header.kid = PRODUCTION_KID;
    console.log('[AUTH] Adding/updating kid header to token');
    
    // Encode the modified header
    const modifiedHeader = Buffer.from(JSON.stringify(header))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Reconstruct the token
    return `${modifiedHeader}.${parts[1]}.${parts[2]}`;
  } catch (error) {
    console.error('[AUTH] Error adding kid header to token:', error);
    return token;
  }
}

/**
 * Get an authentication token for API calls
 * @returns A promise that resolves to an authentication token
 */
export async function getAuthToken(): Promise<string> {
  // Increment request counter
  tokenRequestCount++;
  
  // Check if we have a cached token that's still valid
  if (cachedToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
    logTokenEvent('Using cached token', true, { 
      expiryTime: tokenExpiryTime,
      expiresIn: Math.floor((tokenExpiryTime - Date.now()) / 1000) + ' seconds'
    });
    return cachedToken.access_token;
  }
  
  // If we should use mock data, return a mock token
  if (USE_MOCK_DATA) {
    // Log that we're using a mock token
    console.log('[AUTH] Using mock token for development environment');
    
    // Set token expiry to 1 hour from now
    tokenExpiryTime = Date.now() + 60 * 60 * 1000;
    
    cachedToken = {
      token_type: 'Bearer',
      expires_in: 3600,
      access_token: MOCK_TOKEN
    };
    
    // Log token event
    logTokenEvent('Generated mock token', true, { expiryTime: tokenExpiryTime });
    
    return MOCK_TOKEN;
  }
  
  try {
    // In production, we need to call the actual auth service
    const authUrl = API_CONFIG.authUrl;
    if (!authUrl) {
      const error = new Error('Missing auth URL in API configuration');
      logTokenEvent('Auth URL missing', false, {}, error);
      throw error;
    }
    
    console.log(`[AUTH] Requesting token from ${authUrl}`);
    
    // Ensure we have client credentials
    const clientId = API_CONFIG.clientId;
    const clientSecret = API_CONFIG.clientSecret;
    
    if (!clientId || !clientSecret) {
      const error = new Error('Missing client credentials in API configuration');
      logTokenEvent('Client credentials missing', false, {}, error);
      throw error;
    }
    
    // Create form data for the token request
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    formData.append('scope', 'ccds.read');
    
    // Log the request details (without sensitive information)
    console.log('[AUTH] Making token request with the following parameters:');
    console.log('- grant_type:', 'client_credentials');
    console.log('- client_id:', clientId);
    console.log('- scope:', 'ccds.read');
    
    // Make the token request
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString(),
      cache: 'no-store' // Ensure we don't use cached responses
    });
    
    // Log the response status
    console.log(`[AUTH] Token request response status: ${response.status}`);
    
    if (!response.ok) {
      // Try to get more detailed error information
      let errorDetails = '';
      try {
        const errorText = await response.text();
        errorDetails = errorText;
        console.error(`[AUTH] Token request error details: ${errorDetails}`);
      } catch (e) {
        errorDetails = `Status: ${response.status}`;
        console.error(`[AUTH] Could not parse error details: ${e}`);
      }
      
      const error = new Error(`Authentication failed: ${response.status} - ${errorDetails}`);
      logTokenEvent('Authentication request failed', false, { status: response.status }, error);
      throw error;
    }
    
    // Parse the response
    let data;
    try {
      data = await response.json();
      console.log('[AUTH] Successfully parsed token response');
    } catch (e) {
      const error = new Error(`Failed to parse token response: ${e}`);
      logTokenEvent('Failed to parse token response', false, {}, error);
      throw error;
    }
    
    // Validate the token response
    if (!data.access_token) {
      const error = new Error('Invalid token response: missing access_token');
      logTokenEvent('Invalid token response', false, { response: data }, error);
      throw error;
    }
    
    // Cache the token
    cachedToken = {
      token_type: data.token_type || 'Bearer',
      expires_in: data.expires_in || 3600,
      access_token: data.access_token
    };
    
    // Set expiry based on expires_in (seconds) from response, or default to 1 hour
    // Apply a 5-minute safety margin to avoid using tokens that are about to expire
    const safetyMarginMs = 5 * 60 * 1000; // 5 minutes in milliseconds
    tokenExpiryTime = Date.now() + ((data.expires_in || 3600) * 1000) - safetyMarginMs;
    
    // Log successful token retrieval
    logTokenEvent('Retrieved new token', true, { 
      expiryTime: tokenExpiryTime,
      tokenLength: data.access_token.length,
      expiresIn: data.expires_in
    });
    
    return data.access_token;
  } catch (error) {
    // Log the error
    lastTokenError = error instanceof Error ? error : new Error(String(error));
    logTokenEvent('Token retrieval failed', false, {}, lastTokenError);
    
    // Rethrow the error
    throw lastTokenError;
  }
}

/**
 * Force a refresh of the authentication token
 * @returns A promise that resolves to a new authentication token
 */
export async function refreshAuthToken(): Promise<string> {
  // Increment refresh counter
  tokenRefreshCount++;
  
  // Clear cached token
  cachedToken = null;
  tokenExpiryTime = null;
  
  // Log token refresh
  logTokenEvent('Forcing token refresh', true);
  
  // Get a new token
  return getAuthToken();
}

/**
 * Get the status of the authentication token
 * @returns A record with token status information
 */
export async function getTokenStatus(): Promise<Record<string, any>> {
  return {
    hasCachedToken: !!cachedToken,
    isTokenValid: !!(cachedToken && tokenExpiryTime && Date.now() < tokenExpiryTime),
    tokenExpiryTime: tokenExpiryTime ? formatDate(tokenExpiryTime) : null,
    timeUntilExpiry: tokenExpiryTime ? Math.floor((tokenExpiryTime - Date.now()) / 1000) + ' seconds' : null,
    tokenRequestCount,
    tokenRefreshCount,
    lastTokenError: lastTokenError?.message || null,
    tokenRefreshHistory
  };
} 