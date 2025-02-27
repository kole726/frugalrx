import { NextResponse } from 'next/server'
import { getDrugDetailsByGsn } from '@/lib/server/medicationService'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

interface APIError {
  message: string;
  status: number;
}

export async function GET(
  request: Request,
  { params }: { params: { gsn: string } }
) {
  console.log(`Fetching drug info for GSN: ${params.gsn}`);
  
  // Parse the GSN parameter
  const gsn = parseInt(params.gsn, 10);
  
  if (isNaN(gsn)) {
    return NextResponse.json(
      { error: 'Invalid GSN parameter' },
      { status: 400 }
    );
  }
  
  try {
    const drugDetails = await getDrugDetailsByGsn(gsn);
    return NextResponse.json(drugDetails);
  } catch (error) {
    console.error('Server error in drug info API:', error);
    return NextResponse.json(
      { error: `Failed to fetch drug info: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 