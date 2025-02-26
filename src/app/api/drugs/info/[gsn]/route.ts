import { NextResponse } from 'next/server'
import { getAuthToken } from '@/utils/auth'

interface APIError extends Error {
  status?: number;
}

export async function GET(
  request: Request,
  { params }: { params: { gsn: string } }
) {
  try {
    // Get a fresh token
    const token = await getAuthToken();

    // Using the correct endpoint for drug info
    const apiUrl = `https://api.americaspharmacy.com/pricing/v1/druginfo/${params.gsn}`;
    console.log('Fetching drug info from:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Drug Info Response:', data);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const apiError = error as APIError;
    console.error('Server Error:', apiError);
    return NextResponse.json(
      { error: apiError.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 