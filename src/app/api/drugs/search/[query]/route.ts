import { NextResponse } from 'next/server'
import { searchDrugs } from '@/lib/server/medicationService'

interface APIError extends Error {
  status?: number;
}

export async function GET(
  request: Request,
  { params }: { params: { query: string } }
) {
  try {
    console.log('Searching for drugs with query:', params.query);
    
    const data = await searchDrugs(params.query);
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