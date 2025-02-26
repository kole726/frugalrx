import { NextResponse } from 'next/server'
import { getAuthToken } from '@/utils/auth'

const API_BASE_URL = process.env.AMERICAS_PHARMACY_API_URL

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    console.log('Search query:', query)

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    // Get a fresh authentication token
    const token = await getAuthToken()

    const apiUrl = `${API_BASE_URL}/drugs/search?q=${encodeURIComponent(query)}`
    console.log('Calling API:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    console.log('API Response Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', errorText)
      return NextResponse.json(
        { error: `API Error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('API Success Response:', data)
    return NextResponse.json(data)

  } catch (error: unknown) {
    console.error('Server Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    )
  }
} 