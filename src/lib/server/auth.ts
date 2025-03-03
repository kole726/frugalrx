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

// Mock token for development - DO NOT modify this token
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZydWdhbFJ4IERldmVsb3BlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTE2MjM5MDIyLCJzY29wZSI6ImNjZHMucmVhZCJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

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

/**
 * Get an authentication token for API calls
 * @returns A promise that resolves to an authentication token
 */
export async function getAuthToken(): Promise<string> {
  // Increment request counter
  tokenRequestCount++;
  
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
    
    if (!response.ok) {
      // Try to get more detailed error information
      let errorDetails = '';
      try {
        const errorText = await response.text();
        errorDetails = errorText;
      } catch (e) {
        errorDetails = `Status: ${response.status}`;
      }
      
      const error = new Error(`Authentication failed: ${response.status} - ${errorDetails}`);
      logTokenEvent('Authentication request failed', false, { status: response.status }, error);
      throw error;
    }
    
    const data = await response.json();
    
    // Validate the token response
    if (!data.access_token) {
      const error = new Error('Invalid token response: missing access_token');
      logTokenEvent('Invalid token response', false, { response: data }, error);
      throw error;
    }
    
    // Use the token exactly as provided by the auth service
    // DO NOT modify the token in any way
    
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
    // Log the error and rethrow
    lastTokenError = error as Error;
    logTokenEvent('Token retrieval failed', false, {}, error as Error);
    throw error;
  }
}

/**
 * Force refresh the authentication token
 * @returns A promise that resolves to a new authentication token
 */
export async function refreshAuthToken(): Promise<string> {
  // Clear the cache
  cachedToken = null;
  tokenExpiryTime = null;
  tokenRefreshCount++;
  
  // Get a new token
  return getAuthToken();
}

/**
 * Get the token status for debugging purposes
 * This can be exposed via an admin API endpoint for troubleshooting
 */
export async function getTokenStatus(): Promise<Record<string, any>> {
  const now = Date.now();
  
  return {
    hasToken: !!cachedToken,
    tokenType: cachedToken?.token_type,
    tokenExpiresIn: cachedToken?.expires_in,
    tokenExpiryTime: tokenExpiryTime ? formatDate(tokenExpiryTime) : null,
    currentTime: formatDate(now),
    isExpired: tokenExpiryTime ? now >= tokenExpiryTime : true,
    timeUntilExpiry: tokenExpiryTime ? `${((tokenExpiryTime - now) / 1000).toFixed(1)}s` : 'N/A',
    tokenRequestCount,
    tokenRefreshCount,
    lastError: lastTokenError?.message,
    refreshHistory: tokenRefreshHistory
  };
} 