import { NextResponse } from 'next/server'
import { getAccessToken } from '@/services/authService'
import { APIError } from '@/types/api'

export async function POST(request: Request) {
  try {
    const token = await getAccessToken();
    const criteria = await request.json();

    const response = await fetch(`${process.env.AMERICAS_PHARMACY_API_URL}/drugprices/byName`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...criteria,
        hqMappingName: 'walkerrx'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const apiError = error as APIError;
    console.error('Server Error:', apiError);
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch prices' },
      { status: 500 }
    );
  }
} 