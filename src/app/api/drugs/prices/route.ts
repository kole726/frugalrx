import { NextResponse } from 'next/server'
import { getAuthToken } from '@/utils/auth'

interface APIError extends Error {
  status?: number;
}

export async function POST(request: Request) {
  try {
    // Get a fresh token
    const token = await getAuthToken();
    const criteria = await request.json();

    // Using the correct endpoint for drug prices
    const response = await fetch(`https://api.americaspharmacy.com/pricing/v1/drugprices/byName`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hqMappingName: "walkerrx",
        drugName: criteria.drugName,
        latitude: criteria.latitude,
        longitude: criteria.longitude,
        radius: criteria.radius || 10
      })
    });

    console.log('API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Drug Prices Response:', data);
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