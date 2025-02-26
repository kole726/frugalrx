/**
 * Authentication utilities for API requests
 */

interface AuthToken {
  token_type: string;
  expires_in: number;
  access_token: string;
}

let cachedToken: AuthToken | null = null;
let tokenExpiryTime: number | null = null;

/**
 * Get an authentication token from the Okta API
 * Caches the token and returns the cached version if it's still valid
 */
export async function getAuthToken(): Promise<string> {
  // Check if we have a valid cached token
  const now = Date.now();
  if (cachedToken && tokenExpiryTime && now < tokenExpiryTime) {
    return cachedToken.access_token;
  }

  // If no valid token, request a new one
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.AMERICAS_PHARMACY_CLIENT_ID || '0oatgei47wp1CfkaQ297');
    params.append('client_secret', process.env.AMERICAS_PHARMACY_CLIENT_SECRET || 'pMQW2VhwqCiCcG2sWtEEsTW5b3rbMkMHaI5oChXjJDa2f3e5jzkjzKIV-IgJmObc');

    const response = await fetch(process.env.AMERICAS_PHARMACY_AUTH_URL || 'https://medimpact.okta.com/oauth2/aus107c5yrHDu55K8297/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data: AuthToken = await response.json();
    
    // Cache the token with a safety margin (expire 5 minutes early)
    cachedToken = data;
    tokenExpiryTime = now + (data.expires_in * 1000) - (5 * 60 * 1000);
    
    return data.access_token;
  } catch (error) {
    console.error('Error getting authentication token:', error);
    throw new Error('Failed to authenticate with the medication API');
  }
} 