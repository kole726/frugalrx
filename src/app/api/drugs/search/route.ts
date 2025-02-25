import { NextResponse } from 'next/server'

const API_BASE_URL = 'https://api.medimpact.com/prod/v1'
const API_TOKEN = 'eyJraWQiOiJBSXIyWm9fdVBtaGFzbW9JcWM0RV9DckZ2dzFYeC1JUnA0LXQ0eGlLY21vIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULlJDc3llcDhvMm0zbEx1RDdZMXlDZU5adGRVNUFzb3pVWVNHb3dhSDZkYjQiLCJpc3MiOiJodHRwczovL21lZGltcGFjdC5va3RhLmNvbS9vYXV0aDIvYXVzMTA3YzV5ckhEdTU1SzgyOTciLCJhdWQiOiJhcGk6Ly9tZWRpbXBhY3QiLCJpYXQiOjE3NDA1MTk5MTcsImV4cCI6MTc0MDUzMDcxNywiY2lkIjoiMG9hdGdlaTQ3d3AxQ2ZrYVEyOTciLCJzY3AiOlsiY2Nkcy5yZWFkIl0sInN1YiI6IjBvYXRnZWk0N3dwMUNma2FRMjk3In0.IrNI3AFPNPmiaK2ZBhEgnBDlegXQjP8an0XGMWHTSpFmO5Ix9ISv4H0Zt2A8VklHvG1hqGqJeINRyedeO_Ek9IJ2DMV-F3P0KNxIAtmx2HFXjRZgXWu79NY52KMI1Xgy2a2xaSk9Mr7mwVgfjei3RI-vKj5OLSvfpLKoET-7K3qdPdarhWHGKu0hAGbsn9M4Ao5MruG5ziVZitvEpP1Ujhj0RuHGBEoqMmCVJ7x4qdEa_o4aqCmULz6T8cB6CTplEYu-lx4UcYxNAUtcOhLyctdMRKSWBXzlUmWQwHCma_tKsuxqK5rnr-5gQUXecSmauWwnEPHvgaKEON6B-a8C6w'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    console.log('Search query:', query)

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const apiUrl = `${API_BASE_URL}/drugs/search?q=${encodeURIComponent(query)}`
    console.log('Calling API:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
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

  } catch (error) {
    console.error('Server Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    )
  }
} 