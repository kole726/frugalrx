import { NextResponse } from 'next/server'
import { searchDrugs } from '@/lib/server/medicationService'

interface APIError {
  message: string;
  status: number;
}

export async function GET(
  request: Request,
  { params }: { params: { query: string } }
) {
  console.log(`Searching for drugs: ${params.query}`);
  
  try {
    const drugs = await searchDrugs(params.query);
    return NextResponse.json(drugs);
  } catch (error) {
    console.error('Server error in drug search API:', error);
    return NextResponse.json(
      { error: `Failed to search drugs: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 