'use server';

/**
 * Server-only authentication utilities for API requests
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
    // Validate that environment variables are set
    const authUrl = process.env.AMERICAS_PHARMACY_AUTH_URL;
    const clientId = process.env.AMERICAS_PHARMACY_CLIENT_ID;
    const clientSecret = process.env.AMERICAS_PHARMACY_CLIENT_SECRET;
    
    if (!authUrl || !clientId || !clientSecret) {
      console.error('Missing required environment variables for authentication:',
        { 
          hasAuthUrl: !!authUrl, 
          hasClientId: !!clientId, 
          hasClientSecret: !!clientSecret 
        }
      );
      throw new Error('Missing API credentials in environment variables');
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'ccds.read');

    console.log(`Requesting auth token from: ${authUrl}`);
    
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Authentication failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data: AuthToken = await response.json();
    
    if (!data.access_token) {
      console.error('Invalid token response:', data);
      throw new Error('Invalid authentication response from API');
    }
    
    console.log('Successfully obtained auth token');
    
    // Cache the token with a safety margin (expire 5 minutes early)
    cachedToken = data;
    tokenExpiryTime = now + (data.expires_in * 1000) - (5 * 60 * 1000);
    
    return data.access_token;
  } catch (error) {
    console.error('Error getting authentication token:', error);
    throw new Error('Failed to authenticate with the medication API');
  }
} 