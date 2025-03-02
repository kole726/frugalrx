import { NextRequest, NextResponse } from 'next/server'
import { getGroupDrugPrices } from '@/lib/server/medicationService'
import { DrugPriceRequest, APIError } from '@/types/api'
import { shouldFallbackToMock } from '@/config/environment'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Default coordinates for Austin, TX
const DEFAULT_LATITUDE = 30.4014;
const DEFAULT_LONGITUDE = -97.7525;

// Map of zip codes to default coordinates
const zipCodeCoordinates: Record<string, { latitude: number; longitude: number }> = {
  '78759': { latitude: 30.4014, longitude: -97.7525 }, // Austin, TX
  // Add more zip codes as needed
};

export async function POST(request: Request) {
  try {
    const criteria = await request.json();
    console.log('Fetching group drug prices with criteria:', criteria);
    
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
    
    const priceRequest: DrugPriceRequest = {
      latitude: latitude,
      longitude: longitude,
      hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
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
    
    // Add radius if provided
    if (criteria.radius) {
      priceRequest.radius = criteria.radius;
    }
    
    // Add maximum pharmacies if provided
    if (criteria.maximumPharmacies) {
      priceRequest.maximumPharmacies = criteria.maximumPharmacies;
    }
    
    try {
      const data = await getGroupDrugPrices(priceRequest);
      return NextResponse.json(data, { headers: corsHeaders });
    } catch (apiError) {
      console.error('API error in group drug prices:', apiError);
      
      // Check if we should fall back to mock data
      if (shouldFallbackToMock()) {
        console.log('Falling back to mock data for group drug prices');
        return NextResponse.json({
          pharmacies: [],
          drugInfo: null
        }, { headers: corsHeaders });
      }
      
      // If we shouldn't fall back to mock data, return the error
      return NextResponse.json(
        { 
          error: 'Failed to get group drug prices',
          details: apiError instanceof Error ? apiError.message : String(apiError)
        },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }
  } catch (error) {
    console.error('Server error in group drug prices API:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 