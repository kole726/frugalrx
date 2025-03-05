import { NextRequest, NextResponse } from 'next/server'
import { getDrugPrices } from '@/lib/server/medicationService'
import { DrugPriceRequest, APIError } from '@/types/api'
import { MOCK_PHARMACY_PRICES } from '@/lib/mockData'
import { corsHeaders } from '@/lib/cors'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Map of zip codes to default coordinates
const zipCodeCoordinates: Record<string, { latitude: number; longitude: number }> = {
  '78759': { latitude: 30.4014, longitude: -97.7525 }, // Austin, TX
  // Add more zip codes as needed
};

// Default coordinates for Austin, TX
const DEFAULT_LATITUDE = 30.4014;
const DEFAULT_LONGITUDE = -97.7525;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the incoming request for debugging
    console.log('API: Received drug prices request:', JSON.stringify(body));
    
    // Validate required fields
    if (!body.latitude || !body.longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate that at least one drug identifier is provided
    if (!body.gsn && !body.drugName && !body.ndcCode) {
      return NextResponse.json(
        { error: 'At least one of gsn, drugName, or ndcCode must be provided' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Convert string numbers to actual numbers if needed
    const requestData = {
      ...body,
      latitude: typeof body.latitude === 'string' ? parseFloat(body.latitude) : body.latitude,
      longitude: typeof body.longitude === 'string' ? parseFloat(body.longitude) : body.longitude,
      radius: body.radius ? (typeof body.radius === 'string' ? parseFloat(body.radius) : body.radius) : 50,
      quantity: body.quantity ? (typeof body.quantity === 'string' ? parseInt(body.quantity, 10) : body.quantity) : 30,
      gsn: body.gsn ? (typeof body.gsn === 'string' ? parseInt(body.gsn, 10) : body.gsn) : undefined,
      customizedQuantity: true // Set to true as in the Postman collection
    };
    
    console.log('API: Processed request data:', JSON.stringify(requestData));
    
    const result = await getDrugPrices(requestData);
    
    // Log the result summary
    console.log(`API: Drug prices result - Found ${result.prices?.length || 0} prices and ${result.pharmacies?.length || 0} pharmacies`);
    
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in drug prices API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  return NextResponse.json(
    { error: 'This endpoint only accepts POST requests' },
    { status: 405, headers: corsHeaders }
  );
} 