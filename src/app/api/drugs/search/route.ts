import { NextResponse } from 'next/server'
import { searchDrugs } from '@/lib/server/medicationService'

interface APIError {
  message: string;
  status: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    console.log('Search query:', query)

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const drugs = await searchDrugs(query);
    return NextResponse.json(drugs);
  } catch (error) {
    console.error('Server error in drug search API:', error);
    return NextResponse.json(
      { error: `Failed to search drugs: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 