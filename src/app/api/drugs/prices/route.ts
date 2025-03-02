import { NextRequest, NextResponse } from 'next/server'
import { getDrugPrices } from '@/lib/server/medicationService'
import { DrugPriceRequest, APIError } from '@/types/api'
import { MOCK_PHARMACY_PRICES } from '@/lib/mockData'
import { shouldFallbackToMock } from '@/config/environment'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // Validate drug name length if provided
    if (criteria.drugName && criteria.drugName.trim().length < 3) {
      return NextResponse.json(
        { error: 'Drug name must be at least 3 characters long' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    const priceRequest: DrugPriceRequest = {
      latitude: latitude,
      longitude: longitude,
      hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
    };
    
    // Add either drugName, gsn, or ndcCode
    if (criteria.drugName) {
      priceRequest.drugName = criteria.drugName.trim();
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
    
    // Add radius if provided
    if (criteria.radius) {
      priceRequest.radius = criteria.radius;
    }
    
    // Add maximum pharmacies if provided
    if (criteria.maximumPharmacies) {
      priceRequest.maximumPharmacies = criteria.maximumPharmacies;
    }
    
    try {
      const data = await getDrugPrices(priceRequest);
      return NextResponse.json(data, { headers: corsHeaders });
    } catch (apiError) {
      console.error('API error in drug prices:', apiError);
      
      // Check if we should fall back to mock data
      if (shouldFallbackToMock()) {
        console.log('Falling back to mock data for drug prices');
        return NextResponse.json({
          pharmacies: MOCK_PHARMACY_PRICES
        }, { headers: corsHeaders });
      }
      
      // If we shouldn't fall back to mock data, return the error
      return NextResponse.json(
        { 
          error: 'Failed to fetch drug prices',
          details: apiError instanceof Error ? apiError.message : String(apiError)
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }
  } catch (error) {
    console.error('Server error in drug prices API:', error);
    return NextResponse.json(
      { error: `Failed to fetch drug prices: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get the parameters from the URL query
    const url = new URL(request.url);
    const drugName = url.searchParams.get('drugName');
    const gsn = url.searchParams.get('gsn');
    const ndcCode = url.searchParams.get('ndcCode');
    const latStr = url.searchParams.get('latitude');
    const lngStr = url.searchParams.get('longitude');
    const radiusStr = url.searchParams.get('radius');
    const quantityStr = url.searchParams.get('quantity');
    
    // Validate required fields
    if (!drugName && !gsn && !ndcCode) {
      return NextResponse.json(
        { error: 'Missing required fields: either drugName, gsn, or ndcCode must be provided' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // Validate drug name length if provided
    if (drugName && drugName.trim().length < 3) {
      return NextResponse.json(
        { error: 'Drug name must be at least 3 characters long' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // Parse numeric values
    const latitude = latStr ? parseFloat(latStr) : DEFAULT_LATITUDE;
    const longitude = lngStr ? parseFloat(lngStr) : DEFAULT_LONGITUDE;
    const radius = radiusStr ? parseInt(radiusStr, 10) : undefined;
    const quantity = quantityStr ? parseInt(quantityStr, 10) : undefined;
    
    // Create the price request
    const priceRequest: DrugPriceRequest = {
      latitude,
      longitude,
      hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
    };
    
    // Add either drugName, gsn, or ndcCode
    if (drugName) {
      priceRequest.drugName = drugName.trim();
    } else if (gsn) {
      priceRequest.gsn = parseInt(gsn, 10);
    } else if (ndcCode) {
      priceRequest.ndcCode = ndcCode;
    }
    
    // Add optional fields if provided
    if (quantity) {
      priceRequest.customizedQuantity = true;
      priceRequest.quantity = quantity;
    }
    
    // Add radius if provided
    if (radius) {
      priceRequest.radius = radius;
    }
    
    try {
      const data = await getDrugPrices(priceRequest);
      return NextResponse.json(data, { headers: corsHeaders });
    } catch (apiError) {
      console.error('API error in drug prices (GET):', apiError);
      
      // Check if we should fall back to mock data
      if (shouldFallbackToMock()) {
        console.log('Falling back to mock data for drug prices (GET)');
        return NextResponse.json({
          pharmacies: MOCK_PHARMACY_PRICES
        }, { headers: corsHeaders });
      }
      
      // If we shouldn't fall back to mock data, return the error
      return NextResponse.json(
        { 
          error: 'Failed to fetch drug prices',
          details: apiError instanceof Error ? apiError.message : String(apiError)
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }
  } catch (error) {
    console.error('Error in drug prices API (GET):', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 