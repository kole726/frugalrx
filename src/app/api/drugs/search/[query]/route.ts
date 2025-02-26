import { NextResponse } from 'next/server'
import { getAccessToken } from '@/services/authService'
import { APIError } from '@/types/api'

export async function GET(
  request: Request,
  { params }: { params: { query: string } }
) {
  try {
    // Get a fresh token
    const token = await getAccessToken();

    const response = await fetch(`${process.env.AMERICAS_PHARMACY_API_URL}/drugs/names`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: 'walkerrx',
        prefixText: params.query
      })
    });

    console.log('API Response Status:', response.status); // Debug log

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Success Response:', data); // Debug log
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