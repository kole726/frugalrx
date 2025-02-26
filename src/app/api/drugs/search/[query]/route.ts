import { NextResponse } from 'next/server'
import { getAuthToken } from '@/utils/auth'

interface APIError extends Error {
  status?: number;
}

export async function GET(
  request: Request,
  { params }: { params: { query: string } }
) {
  try {
    // Get a fresh token
    const token = await getAuthToken();

    // Using the correct endpoint for medication autocomplete
    const apiUrl = `https://api.americaspharmacy.com/pricing/v1/drugs/${encodeURIComponent(params.query)}`;
    console.log('Calling API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Success Response:', data);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const apiError = error as APIError;
    console.error('Server Error:', apiError);
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
} 