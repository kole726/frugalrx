import { NextRequest, NextResponse } from 'next/server'
import { getDrugPrices } from '@/lib/server/medicationService'
import { DrugPriceRequest, APIError } from '@/types/api'
import { MOCK_PHARMACY_PRICES } from '@/lib/mockData'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Check if mock data should be used
const USE_MOCK_PHARMACY_PRICES = process.env.NEXT_PUBLIC_USE_MOCK_PHARMACY_PRICES === 'true';
const FALLBACK_TO_MOCK = process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK === 'true';

// Map of zip codes to default coordinates
const zipCodeCoordinates: Record<string, { latitude: number; longitude: number }> = {
  '78759': { latitude: 30.4014, longitude: -97.7525 }, // Austin, TX
  // Add more zip codes as needed
};

// Default coordinates for Austin, TX
const DEFAULT_LATITUDE = 30.4014;
const DEFAULT_LONGITUDE = -97.7525;

export async function POST(request: Request) {
  try {
    const criteria = await request.json();
    console.log('Fetching drug prices with criteria:', criteria);
    
    let latitude = criteria.latitude;
    let longitude = criteria.longitude;
    
    // If latitude and longitude are not provided, try to get them from zipCode
    if ((!latitude || !longitude) && criteria.zipCode) {
      const coordinates = zipCodeCoordinates[criteria.zipCode] || 
                         { latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE };
      latitude = coordinates.latitude;
      longitude = coordinates.longitude;
      console.log(`Using coordinates for zip code ${criteria.zipCode}:`, coordinates);
    }
    
    // Validate required fields
    if ((!criteria.drugName && !criteria.gsn && !criteria.ndcCode)) {
      return NextResponse.json(
        { error: 'Missing required fields: either drugName, gsn, or ndcCode must be provided' },
        { status: 400 }
      );
    }
    
    // If mock data is explicitly requested, return mock results
    if (USE_MOCK_PHARMACY_PRICES) {
      console.log(`API: Using mock data for pharmacy prices as specified by NEXT_PUBLIC_USE_MOCK_PHARMACY_PRICES`);
      return NextResponse.json({
        pharmacies: MOCK_PHARMACY_PRICES,
        usingMockData: true
      });
    }
    
    const priceRequest: DrugPriceRequest = {
      latitude: latitude,
      longitude: longitude,
      hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
      radius: criteria.radius || 10,
      maximumPharmacies: criteria.maximumPharmacies || 50
    };
    
    // Add either drugName, gsn, or ndcCode
    if (criteria.drugName) {
      priceRequest.drugName = criteria.drugName;
    } else if (criteria.gsn) {
      priceRequest.gsn = criteria.gsn;
    } else if (criteria.ndcCode) {
      priceRequest.ndcCode = criteria.ndcCode;
    }
    
    // Add optional fields if provided
    if (criteria.customizedQuantity) {
      priceRequest.customizedQuantity = criteria.customizedQuantity;
      priceRequest.quantity = criteria.quantity;
    }
    
    try {
      const data = await getDrugPrices(priceRequest);
      console.log(`Found ${data.pharmacies?.length || 0} pharmacies with prices`);
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching drug prices:', error);
      
      // Fall back to mock data only if FALLBACK_TO_MOCK is true
      if (FALLBACK_TO_MOCK) {
        console.log('API: Falling back to mock data as specified by NEXT_PUBLIC_FALLBACK_TO_MOCK');
        return NextResponse.json({
          pharmacies: MOCK_PHARMACY_PRICES,
          error: error instanceof Error ? error.message : 'Unknown error',
          usingMockData: true
        });
      } else {
        // Return error without mock data
        console.log('API: Not falling back to mock data as specified by NEXT_PUBLIC_FALLBACK_TO_MOCK');
        return NextResponse.json(
          { 
            error: `Failed to fetch drug prices: ${error instanceof Error ? error.message : 'Unknown error'}`
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Server error in drug prices API:', error);
    return NextResponse.json(
      { error: `Failed to fetch drug prices: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get the parameters from the URL query
    const url = new URL(request.url);
    const drugName = url.searchParams.get('drugName');
    const gsnParam = url.searchParams.get('gsn');
    const ndcCode = url.searchParams.get('ndcCode');
    
    if (!drugName && !gsnParam && !ndcCode) {
      return NextResponse.json(
        { error: 'Either drugName, gsn, or ndcCode is required' },
        { status: 400 }
      );
    }
    
    // If mock data is explicitly requested, return mock results
    if (USE_MOCK_PHARMACY_PRICES) {
      console.log(`API: Using mock data for pharmacy prices as specified by NEXT_PUBLIC_USE_MOCK_PHARMACY_PRICES`);
      return NextResponse.json({
        pharmacies: MOCK_PHARMACY_PRICES,
        usingMockData: true
      });
    }
    
    // Convert GSN to number if provided
    const gsn = gsnParam ? parseInt(gsnParam, 10) : undefined;
    
    // Get coordinates from query parameters or use defaults
    const latitude = parseFloat(url.searchParams.get('latitude') || `${DEFAULT_LATITUDE}`);
    const longitude = parseFloat(url.searchParams.get('longitude') || `${DEFAULT_LONGITUDE}`);
    const radius = parseInt(url.searchParams.get('radius') || '10', 10);
    
    const priceRequest: DrugPriceRequest = {
      latitude,
      longitude,
      radius,
      hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
    };
    
    // Add either drugName, gsn, or ndcCode
    if (drugName) {
      priceRequest.drugName = drugName;
    } else if (gsn) {
      priceRequest.gsn = gsn;
    } else if (ndcCode) {
      priceRequest.ndcCode = ndcCode;
    }
    
    try {
      const data = await getDrugPrices(priceRequest);
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching drug prices:', error);
      
      // Fall back to mock data only if FALLBACK_TO_MOCK is true
      if (FALLBACK_TO_MOCK) {
        console.log('API: Falling back to mock data as specified by NEXT_PUBLIC_FALLBACK_TO_MOCK');
        return NextResponse.json({
          pharmacies: MOCK_PHARMACY_PRICES,
          error: error instanceof Error ? error.message : 'Unknown error',
          usingMockData: true
        });
      } else {
        // Return error without mock data
        console.log('API: Not falling back to mock data as specified by NEXT_PUBLIC_FALLBACK_TO_MOCK');
        return NextResponse.json(
          { 
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error in drug prices API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 