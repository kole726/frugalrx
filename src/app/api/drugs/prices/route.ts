import { NextResponse } from 'next/server'
import { getAccessToken } from '@/services/authService'

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
  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch drug prices' },
      { status: 500 }
    );
  }
} 