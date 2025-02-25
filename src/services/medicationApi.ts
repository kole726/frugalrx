interface SearchParams {
  medication: string;
  location: string;
}

interface PharmacyPrice {
  pharmacyName: string;
  address: string;
  price: number;
  distance: number;
}

export async function searchMedication({ medication, location }: SearchParams): Promise<PharmacyPrice[]> {
  // Replace with actual API endpoint and credentials
  const API_URL = process.env.NEXT_PUBLIC_AMERICAS_PHARMACY_API_URL
  const API_KEY = process.env.AMERICAS_PHARMACY_API_KEY

  try {
    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        drugName: medication,
        location: location
      })
    })

    if (!response.ok) {
      throw new Error('Failed to fetch medication prices')
    }

    return await response.json()
  } catch (error) {
    console.error('Error searching medication:', error)
    throw error
  }
} 