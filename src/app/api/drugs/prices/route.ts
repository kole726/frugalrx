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
    // Add CORS headers
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Parse the request body
    const requestData: DrugPriceRequest = await request.json();
    console.log('API: Received drug prices request:', requestData);

    // Validate required fields
    if (!requestData.latitude || !requestData.longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate that either drugName, gsn, or ndcCode is provided
    if (!requestData.drugName && !requestData.gsn && !requestData.ndcCode) {
      return NextResponse.json(
        { error: 'Either drugName, gsn, or ndcCode must be provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Call the medication service to get drug prices
    const drugPrices = await getDrugPrices(requestData);
    console.log('API: Drug prices retrieved successfully');

    // Return the response
    return NextResponse.json(drugPrices, { headers: corsHeaders });
  } catch (error) {
    console.error('API: Error getting drug prices:', error);
    
    // Check if it's an API error with status code
    if (error instanceof Error && 'status' in error) {
      const apiError = error as any;
      return NextResponse.json(
        { error: apiError.message || 'Error getting drug prices' },
        { status: apiError.status || 500, headers: corsHeaders }
      );
    }
    
    // Generic error
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error getting drug prices' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
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
    
    // Get form and strength from query parameters if provided
    const form = url.searchParams.get('form');
    const strength = url.searchParams.get('strength');
    
    if (form) {
      priceRequest.form = form;
    }
    
    if (strength) {
      priceRequest.strength = strength;
    }
    
    // Check for quantity parameters
    const quantityParam = url.searchParams.get('quantity');
    if (quantityParam) {
      const quantity = parseInt(quantityParam, 10);
      if (!isNaN(quantity)) {
        priceRequest.customizedQuantity = true;
        priceRequest.quantity = quantity;
      }
    }
    
    try {
      const data = await getDrugPrices(priceRequest);
      
      // Ensure we have pharmacies in the response
      if (!data.pharmacies || data.pharmacies.length === 0) {
        console.log('No pharmacies found in API response, adding mock pharmacies');
        
        // Add mock pharmacies if none are found
        data.pharmacies = MOCK_PHARMACY_PRICES;
      }
      
      // Ensure we have brand variations in the response
      if (!data.brandVariations || !Array.isArray(data.brandVariations) || data.brandVariations.length === 0) {
        console.log('No brand variations found in API response, adding default ones');
        
        // Add default brand variations if not present
        data.brandVariations = [
          {
            name: `${drugName} (brand)`,
            type: 'brand',
            gsn: data.brandVariations?.[0]?.gsn || 1790
          },
          {
            name: `${drugName} (generic)`,
            type: 'generic',
            gsn: data.brandVariations?.[0]?.gsn ? data.brandVariations[0].gsn + 1 : 1791
          }
        ];
      }
      
      // Ensure we have forms in the response
      if (!data.forms || !Array.isArray(data.forms) || data.forms.length === 0) {
        console.log('No forms found in API response, adding default ones');
        
        // Add default forms if not present
        data.forms = [
          { form: 'TABLET', gsn: 1790 },
          { form: 'CAPSULE', gsn: 1791 },
          { form: 'LIQUID', gsn: 1792 }
        ];
      }
      
      // Ensure we have strengths in the response
      if (!data.strengths || !Array.isArray(data.strengths) || data.strengths.length === 0) {
        console.log('No strengths found in API response, adding default ones');
        
        // Add default strengths if not present
        data.strengths = [
          { strength: '500 mg', gsn: 1790 },
          { strength: '250 mg', gsn: 1791 },
          { strength: '125 mg', gsn: 1792 }
        ];
      }
      
      // Ensure we have quantities in the response
      if (!data.quantities || !Array.isArray(data.quantities) || data.quantities.length === 0) {
        console.log('No quantities found in API response, adding default ones');
        
        // Add default quantities if not present
        data.quantities = [
          { quantity: 30, uom: 'TABLET' },
          { quantity: 60, uom: 'TABLET' },
          { quantity: 90, uom: 'TABLET' }
        ];
      }
      
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching drug prices, falling back to mock data:', error);
      
      // Fall back to mock data if API fails
      return NextResponse.json({
        pharmacies: MOCK_PHARMACY_PRICES,
        brandVariations: [
          {
            name: `${drugName} (brand)`,
            type: 'brand',
            gsn: 1790
          },
          {
            name: `${drugName} (generic)`,
            type: 'generic',
            gsn: 1791
          }
        ],
        forms: [
          { form: 'TABLET', gsn: 1790 },
          { form: 'CAPSULE', gsn: 1791 },
          { form: 'LIQUID', gsn: 1792 }
        ],
        strengths: [
          { strength: '500 mg', gsn: 1790 },
          { strength: '250 mg', gsn: 1791 },
          { strength: '125 mg', gsn: 1792 }
        ],
        quantities: [
          { quantity: 30, uom: 'TABLET' },
          { quantity: 60, uom: 'TABLET' },
          { quantity: 90, uom: 'TABLET' }
        ],
        error: error instanceof Error ? error.message : 'Unknown error',
        usingMockData: true
      });
    }
  } catch (error) {
    console.error('Error in drug prices API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 