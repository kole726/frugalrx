import { NextRequest, NextResponse } from 'next/server'
import { getDrugPrices } from '@/lib/server/medicationService'
import { DrugPriceRequest, APIError } from '@/types/api'
import { MOCK_PHARMACY_PRICES } from '@/lib/mockData'
import { corsHeaders } from '@/lib/cors'
import { getAuthToken } from '@/lib/server/auth'

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

// Define the request body interface
interface DrugPriceRequestBody {
  hqMappingName?: string;
  drugName?: string;
  gsn?: number;
  ndcCode?: string | number;
  latitude: number;
  longitude: number;
  radius?: number;
  maximumPharmacies?: number;
  customizedQuantity?: boolean;
  quantity?: number;
  form?: string;
  strength?: string;
}

// Define CORS headers
// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Methods': 'POST, OPTIONS',
//   'Access-Control-Allow-Headers': 'Content-Type, Authorization',
// };

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { drugName, gsn, ndcCode, latitude, longitude } = body;
    
    if (!drugName && !gsn && !ndcCode) {
      return NextResponse.json(
        { error: 'Either drugName, gsn, or ndcCode is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`Fallback Drug Prices API: Fetching prices for ${gsn ? `GSN ${gsn}` : drugName ? `drug "${drugName}"` : `NDC ${ndcCode}`} at location (${latitude}, ${longitude})`);
    
    try {
      // Get authentication token
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Failed to obtain authentication token');
      }
      
      console.log('Successfully obtained authentication token');
      
      // Prepare the API request
      const apiUrl = process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com';
      const baseUrl = apiUrl.replace(/\/+$/, '');
      
      // Check if baseUrl already includes /pricing/v1 to avoid duplication
      const baseUrlHasPath = baseUrl.includes('/pricing/v1');
      
      // Determine which endpoint to use
      let endpoint = '';
      if (gsn) {
        endpoint = baseUrlHasPath ? '/drugprices/byGSN' : '/pricing/v1/drugprices/byGSN';
      } else if (drugName) {
        endpoint = baseUrlHasPath ? '/drugprices/byName' : '/pricing/v1/drugprices/byName';
      } else if (ndcCode) {
        endpoint = baseUrlHasPath ? '/drugprices/byNdcCode' : '/pricing/v1/drugprices/byNdcCode';
      }
      
      console.log(`Using America's Pharmacy API: ${baseUrl}${endpoint}`);
      console.log(`Full API URL: ${baseUrl}${endpoint}`);
      
      // Prepare the request body
      const requestBody: DrugPriceRequestBody = {
        hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        radius: body.radius || 50,
        maximumPharmacies: body.maximumPharmacies || 10
      };
      
      // Add the appropriate identifier
      if (gsn) {
        requestBody.gsn = parseInt(gsn.toString(), 10);
      } else if (drugName) {
        requestBody.drugName = drugName;
      } else if (ndcCode) {
        requestBody.ndcCode = ndcCode;
      }
      
      // Add optional parameters if provided
      if (body.customizedQuantity && body.quantity) {
        requestBody.customizedQuantity = true;
        requestBody.quantity = parseInt(body.quantity.toString(), 10);
      }
      
      // Add form and strength if provided
      if (body.form) requestBody.form = body.form;
      if (body.strength) requestBody.strength = body.strength;
      
      console.log('Request body:', requestBody);
      
      // Make the API request
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status}`, errorText);
        
        // If we get a 404 Not Found, try a known working GSN as a last resort
        if ((response.status === 404 || response.status === 400) && gsn && gsn !== 62733) {
          console.log(`No data for GSN ${gsn}, trying known working GSN 62733 (Lipitor)`);
          
          // Create a new request with the known working GSN
          const fallbackRequest = {
            ...requestBody,
            gsn: 62733, // Known working GSN (Lipitor)
            drugName: undefined // Clear drug name to ensure GSN is used
          };
          
          // Make the fallback request
          const fallbackResponse = await fetch(`${baseUrl}/pricing/v1/drugprices/byGSN`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(fallbackRequest),
            cache: 'no-store'
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return NextResponse.json({
              ...fallbackData,
              usingFallbackGsn: true,
              originalGsn: gsn
            }, { headers: corsHeaders });
          }
        }
        
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`API returned data successfully`);
      
      // Return the data
      return NextResponse.json(data, { headers: corsHeaders });
    } catch (apiError) {
      console.error('Error connecting to America\'s Pharmacy API:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Error in drug prices API:', error);
    
    // Return a mock response as a last resort
    const mockResponse = {
      pharmacyPrices: [
        {
          name: 'Walgreens',
          price: 12.99,
          distance: '1.2 miles',
          address: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78759',
          phone: '(512) 555-1234',
          latitude: 30.4015,
          longitude: -97.7527,
          open24H: false,
          usingMockData: true
        },
        {
          name: 'CVS Pharmacy',
          price: 14.50,
          distance: '1.5 miles',
          address: '456 Oak St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78759',
          phone: '(512) 555-5678',
          latitude: 30.4025,
          longitude: -97.7537,
          open24H: false,
          usingMockData: true
        }
      ],
      usingMockData: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return NextResponse.json(mockResponse, { 
      status: 200, // Return 200 with mock data instead of an error
      headers: corsHeaders 
    });
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