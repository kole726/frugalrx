const API_BASE_URL = process.env.AMERICAS_PHARMACY_API_URL;
const API_TOKEN = process.env.AMERICAS_PHARMACY_API_TOKEN;

interface DrugSearchResponse {
  drugName: string;
  gsn: number;
  ndcCode: number;
  brandGenericFlag: string;
}

interface PharmacyPrice {
  pharmacy: {
    name: string;
    chainCode: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    distance: number;
    latitude: number;
    longitude: number;
  };
  price: {
    price: number;
    awpPrice: number;
    macPrice: number;
    ucPrice: number;
    priceBasis: string;
  };
}

interface PricingSearchCriteria {
  drugName?: string;
  gsn?: number;
  latitude: number;
  longitude: number;
  radius: number;
  quantity?: number;
  brandGenericFlag?: 'B' | 'G';
  maximumPharmacies?: number;
}

interface DrugPriceRequest {
  drugName: string;
  latitude: number;
  longitude: number;
  radius: number;
  hqMappingName: string;
}

export async function searchMedications(query: string): Promise<DrugSearchResponse[]> {
  try {
    const response = await fetch(`/api/drugs/search/${encodeURIComponent(query)}?count=10`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch medications: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching medications:', error);
    throw error;
  }
}

export async function getDrugPrices(criteria: DrugPriceRequest) {
  try {
    const response = await fetch('/api/drugs/prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criteria),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch drug info: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching drug info:', error);
    throw error;
  }
}

export async function getDrugInfo(drugName: string) {
  try {
    // First search for the drug to get its GSN
    const searchResults = await searchMedications(drugName);
    if (!searchResults || searchResults.length === 0) {
      throw new Error('Drug not found');
    }

    // Get the first matching drug's GSN
    const drug = searchResults[0];
    if (!drug.gsn) {
      throw new Error('Drug GSN not available');
    }

    // Now fetch the drug info using the GSN
    const response = await fetch(`/api/drugs/info/${drug.gsn}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch drug info: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching drug info:', error);
    throw error;
  }
}

// Let's add a test function to verify the API connection
export async function testApiConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/drugs/search?q=test`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Connection Test:', data);
    return true;
  } catch (error) {
    console.error('API Connection Test Failed:', error);
    return false;
  }
} 