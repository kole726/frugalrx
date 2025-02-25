import { NextResponse } from 'next/server'
import { APIError } from '@/types/api'

export async function GET(
  request: Request,
  { params }: { params: { gsn: string } }
) {
  try {
    const apiUrl = `${process.env.AMERICAS_PHARMACY_API_URL}/drugs/info/${params.gsn}`;
    console.log('Fetching drug info from:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.AMERICAS_PHARMACY_API_TOKEN}`,
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