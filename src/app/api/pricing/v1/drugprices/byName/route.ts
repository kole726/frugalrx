import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/server/auth'
import { geocodeZipCode, getDistanceBetweenCoordinates } from '@/utils/geocoding'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Default coordinates for Austin, TX
const DEFAULT_LATITUDE = 30.4014;
const DEFAULT_LONGITUDE = -97.7525;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Fetching drug prices by name with criteria:', body);
    
    // Validate required fields
    if (!body.drugName) {
      return NextResponse.json(
        { error: 'Missing required field: drugName must be provided' },
        { status: 400 }
      );
    }
    
    // Handle ZIP code if provided instead of coordinates
    let latitude = body.latitude;
    let longitude = body.longitude;
    
    if (body.zipCode && (!latitude || !longitude)) {
      try {
        const location = await geocodeZipCode(body.zipCode);
        latitude = location.latitude;
        longitude = location.longitude;
      } catch (error) {
        console.error('Error geocoding ZIP code:', error);
        // Fall back to default coordinates
        latitude = DEFAULT_LATITUDE;
        longitude = DEFAULT_LONGITUDE;
      }
    }
    
    // Ensure we have latitude and longitude
    latitude = latitude || DEFAULT_LATITUDE;
    longitude = longitude || DEFAULT_LONGITUDE;
    const radius = body.radius || 50;
    const hqMappingName = body.hqMappingName || process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx';
    
    // Get authentication token
    let token;
    try {
      token = await getAuthToken();
      console.log('Successfully obtained auth token for drug prices by name');
    } catch (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: `Authentication failed: ${authError instanceof Error ? authError.message : 'Unknown error'}` },
        { status: 401 }
      );
    }
    
    // Make API request to the external service
    const apiUrl = process.env.AMERICAS_PHARMACY_API_URL;
    if (!apiUrl) {
      console.error('Missing AMERICAS_PHARMACY_API_URL environment variable');
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }
    
    // Ensure the URL is properly formatted by removing trailing slashes
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Make sure we're using the correct path according to the API documentation
    const endpoint = baseUrl.includes('/pricing/v1') 
      ? '/drugprices/byName' 
      : '/pricing/v1/drugprices/byName';
    
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log(`Making API request to ${fullUrl}`);
    
    const requestBody = {
      hqMappingName: hqMappingName,
      drugName: body.drugName.toUpperCase().trim(),
      latitude: latitude,
      longitude: longitude,
      radius: radius,
      useUsualAndCustomary: true,
      quantity: body.quantity || 30,
      customizedQuantity: body.quantity ? true : false
    };
    
    console.log('Request body:', JSON.stringify(requestBody));
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store' // Ensure we don't use cached responses
    });

    // Handle response
    if (!response.ok) {
      const errorStatus = response.status;
      let errorText = '';
      
      try {
        errorText = await response.text();
        console.error(`Drug prices API error (${errorStatus}):`, errorText);
      } catch (e) {
        console.error(`Could not read error response: ${e}`);
      }
      
      // If we're in development, return mock data instead of an error
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK === 'true') {
        console.log('Falling back to mock data due to API error');
        return NextResponse.json({
          pharmacies: generateMockPharmacies(latitude, longitude, body.drugName, radius),
          usingMockData: true,
          apiError: errorText
        });
      }
      
      // In production, return the actual error
      return NextResponse.json(
        { error: errorText || `API returned status ${errorStatus}` },
        { status: errorStatus }
      );
    }

    // Parse and return the successful response
    try {
      const data = await response.json();
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse API response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Server error in drug prices by name API:', error);
    
    // Return mock data in case of error for development
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK === 'true') {
      return NextResponse.json({
        pharmacies: generateMockPharmacies(DEFAULT_LATITUDE, DEFAULT_LONGITUDE, 'Unknown Drug', 50),
        usingMockData: true,
        serverError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({});
}

// Return a clear error for GET requests
export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint only accepts POST requests' },
    { status: 405 }
  );
}

// Function to generate mock pharmacy data for development
function generateMockPharmacies(latitude: number, longitude: number, drugName: string, radius: number = 50) {
  const pharmacyNames = [
    'CVS Pharmacy', 'Walgreens', 'Rite Aid', 'Walmart Pharmacy', 
    'Target Pharmacy', 'Kroger Pharmacy', 'Costco Pharmacy', 
    'Publix Pharmacy', 'Safeway Pharmacy', 'HEB Pharmacy',
    'Albertsons Pharmacy', 'Sam\'s Club Pharmacy', 'Meijer Pharmacy',
    'Wegmans Pharmacy', 'Duane Reade', 'Shoppers Drug Mart',
    'Rexall', 'London Drugs', 'Shopko Pharmacy', 'Winn-Dixie Pharmacy'
  ];
  
  // Generate a random number of pharmacies between 5 and 20
  const numPharmacies = Math.floor(Math.random() * 15) + 5;
  
  return pharmacyNames.slice(0, numPharmacies).map((name, index) => {
    // Generate a random price between $10 and $100
    const price = Math.round((10 + Math.random() * 90) * 100) / 100;
    
    // Generate a random distance between 0.1 and radius miles
    const distance = Math.min(Math.round((0.1 + Math.random() * radius) * 10) / 10, radius);
    
    // Generate slight variations in coordinates based on distance
    // This ensures that pharmacies with smaller distances are closer on the map
    const angle = Math.random() * 2 * Math.PI; // Random angle in radians
    const latOffset = Math.sin(angle) * distance * 0.01; // Convert distance to approximate lat/lng offset
    const lngOffset = Math.cos(angle) * distance * 0.01;
    
    const pharmacyLat = latitude + latOffset;
    const pharmacyLng = longitude + lngOffset;
    
    return {
      name: name,
      address: `${100 + index} Main Street`,
      city: 'Austin',
      state: 'TX',
      zipCode: '78759',
      phone: `555-${100 + index}-${1000 + index}`,
      distance: distance + ' miles',
      price: price,
      latitude: pharmacyLat,
      longitude: pharmacyLng,
      open24H: index % 3 === 0,
      driveUpWindow: index % 2 === 0,
      handicapAccess: true
    };
  });
} 