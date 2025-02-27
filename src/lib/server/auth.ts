'use server';

/**
 * Server-only authentication utilities for API requests
 * Enhanced with detailed logging for token expiration debugging
 */

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
 * Get an authentication token from the Okta API
 * Caches the token and returns the cached version if it's still valid
 * Enhanced with detailed logging for debugging token expiration issues
 */
export async function getAuthToken(): Promise<string> {
  const now = Date.now();
  tokenRequestCount++;
  
  // Log the token request
  logTokenEvent('Token request', true, {
    requestCount: tokenRequestCount,
    refreshCount: tokenRefreshCount,
    cachedTokenExists: !!cachedToken,
    tokenExpiryTime: tokenExpiryTime ? formatDate(tokenExpiryTime) : 'none',
    currentTime: formatDate(now),
    timeUntilExpiry: tokenExpiryTime ? `${((tokenExpiryTime - now) / 1000).toFixed(1)}s` : 'N/A',
    tokenExpired: tokenExpiryTime ? now >= tokenExpiryTime : true
  });
  
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiryTime && now < tokenExpiryTime) {
    const timeRemaining = (tokenExpiryTime - now) / 1000; // in seconds
    
    logTokenEvent('Using cached token', true, {
      tokenAge: `${((now - (tokenExpiryTime - cachedToken.expires_in * 1000)) / 1000).toFixed(1)}s`,
      timeRemaining: `${timeRemaining.toFixed(1)}s`,
      expiresAt: formatDate(tokenExpiryTime)
    });
    
    // If token is close to expiring (less than 60 seconds), log a warning
    if (timeRemaining < 60) {
      logTokenEvent('Token expiring soon', true, {
        timeRemaining: `${timeRemaining.toFixed(1)}s`,
        expiresAt: formatDate(tokenExpiryTime)
      });
    }
    
    return cachedToken.access_token;
  }

  // If token is expired, log the expiration details
  if (cachedToken && tokenExpiryTime && now >= tokenExpiryTime) {
    logTokenEvent('Token expired', true, {
      expiredAt: formatDate(tokenExpiryTime),
      currentTime: formatDate(now),
      expiredAgo: `${((now - tokenExpiryTime) / 1000).toFixed(1)}s`,
      originalExpiresIn: cachedToken.expires_in
    });
  }

  // If no valid token, request a new one
  try {
    tokenRefreshCount++;
    logTokenEvent('Requesting new token', true, {
      refreshCount: tokenRefreshCount
    });
    
    // Validate that environment variables are set
    const authUrl = process.env.AMERICAS_PHARMACY_AUTH_URL;
    const clientId = process.env.AMERICAS_PHARMACY_CLIENT_ID;
    const clientSecret = process.env.AMERICAS_PHARMACY_CLIENT_SECRET;
    
    if (!authUrl || !clientId || !clientSecret) {
      const missingVars = {
        hasAuthUrl: !!authUrl, 
        hasClientId: !!clientId, 
        hasClientSecret: !!clientSecret 
      };
      
      const error = new Error('Missing API credentials in environment variables');
      logTokenEvent('Missing credentials', false, missingVars, error);
      lastTokenError = error;
      throw error;
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'ccds.read');

    logTokenEvent('Sending token request', true, { 
      authUrl,
      requestTime: formatDate(now)
    });
    
    const requestStartTime = Date.now();
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      // Add cache control headers to prevent caching
      cache: 'no-store',
    });
    const requestDuration = Date.now() - requestStartTime;

    logTokenEvent('Token response received', true, {
      status: response.status,
      statusText: response.statusText,
      duration: `${requestDuration}ms`,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorText}`);
      
      logTokenEvent('Token request failed', false, {
        status: response.status,
        statusText: response.statusText,
        duration: `${requestDuration}ms`,
        responseText: errorText
      }, error);
      
      lastTokenError = error;
      throw error;
    }

    const data: AuthToken = await response.json();
    
    if (!data.access_token) {
      const error = new Error('Invalid authentication response from API: missing access_token');
      logTokenEvent('Invalid token response', false, { responseData: data }, error);
      lastTokenError = error;
      throw error;
    }
    
    // Cache the token with a safety margin (expire 5 minutes early)
    const safetyMarginMs = 5 * 60 * 1000; // 5 minutes in milliseconds
    const newExpiryTime = now + (data.expires_in * 1000) - safetyMarginMs;
    
    // Log detailed information about the token and its expiry
    logTokenEvent('Token obtained successfully', true, {
      tokenType: data.token_type,
      expiresIn: `${data.expires_in}s`,
      safetyMargin: `${safetyMarginMs / 1000}s`,
      requestDuration: `${requestDuration}ms`,
      tokenLength: data.access_token.length,
      tokenPrefix: `${data.access_token.substring(0, 10)}...`,
      tokenSuffix: `...${data.access_token.substring(data.access_token.length - 10)}`,
      rawExpiryTime: formatDate(now + (data.expires_in * 1000)),
      adjustedExpiryTime: formatDate(newExpiryTime),
      currentTime: formatDate(now)
    });
    
    // Update the cached token and expiry time
    cachedToken = data;
    tokenExpiryTime = newExpiryTime;
    lastTokenError = null;
    
    return data.access_token;
  } catch (error) {
    // Ensure we capture the error even if it's not an Error object
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    
    logTokenEvent('Error getting authentication token', false, {
      errorType: normalizedError.name,
      errorStack: normalizedError.stack
    }, normalizedError);
    
    lastTokenError = normalizedError;
    throw new Error(`Failed to authenticate with the medication API: ${normalizedError.message}`);
  }
}

/**
 * Force refresh the token regardless of its current state
 * Useful for testing or when a token is known to be invalid
 */
export async function forceTokenRefresh(): Promise<string> {
  logTokenEvent('Force token refresh', true, {
    previousTokenExists: !!cachedToken,
    previousExpiryTime: tokenExpiryTime ? formatDate(tokenExpiryTime) : 'none'
  });
  
  // Clear the cached token
  cachedToken = null;
  tokenExpiryTime = null;
  
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