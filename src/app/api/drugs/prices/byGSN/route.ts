import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server/auth';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Define the request body interface
interface DrugPriceRequestBody {
  hqMappingName: string;
  gsn: number;
  latitude: number;
  longitude: number;
  radius?: number;
  maximumPharmacies?: number;
  customizedQuantity?: boolean;
  quantity?: number;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { gsn, latitude, longitude, quantity, customizedQuantity } = body;
    
    if (!gsn) {
      return NextResponse.json(
        { error: 'GSN is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`Drug Prices API: Fetching prices for GSN ${gsn} at location (${latitude}, ${longitude})`);
    
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
      
      // Construct the endpoint path carefully to avoid duplication
      const endpoint = baseUrlHasPath ? '/drugprices/byGSN' : '/pricing/v1/drugprices/byGSN';
      
      console.log(`Using America's Pharmacy API: ${baseUrl}${endpoint}`);
      console.log(`Full API URL: ${baseUrl}${endpoint}`);
      
      // Prepare the request body
      const requestBody: DrugPriceRequestBody = {
        hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
        gsn: parseInt(gsn.toString(), 10),
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        radius: body.radius || 50,
        maximumPharmacies: body.maximumPharmacies || 10
      };
      
      // Add optional parameters if provided
      if (customizedQuantity && quantity) {
        requestBody.customizedQuantity = true;
        requestBody.quantity = parseInt(quantity.toString(), 10);
      }
      
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
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      // Check if the response has content before parsing it as JSON
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.error('API returned empty response');
        return NextResponse.json(
          { error: 'API returned empty response', pharmacies: [] },
          { status: 200, headers: corsHeaders }
        );
      }
      
      try {
        // Parse the response text as JSON
        const data = JSON.parse(responseText);
        console.log(`API returned data for GSN ${gsn}`);
        
        // Return the data
        return NextResponse.json(data, { headers: corsHeaders });
      } catch (jsonError) {
        console.error('Error parsing API response as JSON:', jsonError);
        console.error('Response text:', responseText);
        return NextResponse.json(
          { error: 'Invalid JSON response from API', pharmacies: [] },
          { status: 200, headers: corsHeaders }
        );
      }
    } catch (apiError) {
      console.error('Error connecting to America\'s Pharmacy API:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Error in drug prices API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
} 