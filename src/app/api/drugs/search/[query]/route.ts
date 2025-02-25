import { NextResponse } from 'next/server'
import { getAccessToken } from '@/services/authService'

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
  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
} 