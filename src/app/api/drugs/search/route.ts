import { NextResponse } from 'next/server'
import { searchDrugs } from '@/lib/server/medicationService'

interface APIError extends Error {
  status?: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    console.log('Search query:', query)

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const data = await searchDrugs(query);
    console.log('API Success Response:', data)
    
    return NextResponse.json(data)

  } catch (error: unknown) {
    const apiError = error as APIError;
    console.error('Server Error:', apiError)
    return NextResponse.json(
      { error: apiError.message || 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
} 