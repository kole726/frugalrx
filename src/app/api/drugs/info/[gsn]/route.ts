import { NextResponse } from 'next/server'
import { getDrugDetailsByGsn } from '@/lib/server/medicationService'

interface APIError extends Error {
  status?: number;
}

export async function GET(
  request: Request,
  { params }: { params: { gsn: string } }
) {
  try {
    console.log('Fetching drug info for GSN:', params.gsn);
    
    const gsn = parseInt(params.gsn, 10);
    if (isNaN(gsn)) {
      return NextResponse.json(
        { error: 'Invalid GSN parameter' },
        { status: 400 }
      );
    }
    
    const data = await getDrugDetailsByGsn(gsn);
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