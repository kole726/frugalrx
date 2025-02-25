interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export async function getAccessToken() {
  try {
    const response = await fetch(process.env.AMERICAS_PHARMACY_AUTH_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMERICAS_PHARMACY_CLIENT_ID!,
        client_secret: process.env.AMERICAS_PHARMACY_CLIENT_SECRET!,
        scope: 'ccds.read'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data: TokenResponse = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
} 