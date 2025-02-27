import { NextResponse } from 'next/server'
import { getPharmacies } from '@/lib/server/medicationService'

// Default coordinates for Austin, TX
const DEFAULT_LATITUDE = 30.4014;
const DEFAULT_LONGITUDE = -97.7525;

// Map of zip codes to coordinates (can be expanded)
const zipCodeCoordinates: Record<string, { latitude: number; longitude: number }> = {
  '78759': { latitude: 30.4014, longitude: -97.7525 }, // Austin, TX
  '90210': { latitude: 34.0901, longitude: -118.4065 }, // Beverly Hills, CA
  '10001': { latitude: 40.7501, longitude: -73.9996 }, // New York, NY
  '60601': { latitude: 41.8855, longitude: -87.6217 }, // Chicago, IL
  '33101': { latitude: 25.7751, longitude: -80.2105 }, // Miami, FL
  '98101': { latitude: 47.6101, longitude: -122.3344 }, // Seattle, WA
  '02108': { latitude: 42.3588, longitude: -71.0707 }, // Boston, MA
  '75201': { latitude: 32.7864, longitude: -96.7970 }, // Dallas, TX
  '94102': { latitude: 37.7790, longitude: -122.4194 }, // San Francisco, CA
  // Add more zip codes as needed
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zipCode');
    let latitude = parseFloat(searchParams.get('latitude') || '0');
    let longitude = parseFloat(searchParams.get('longitude') || '0');
    const count = parseInt(searchParams.get('count') || '10');
    
    // If we have a zip code but no coordinates, try to get coordinates from the zip code
    if (zipCode && (!latitude || !longitude)) {
      const coordinates = zipCodeCoordinates[zipCode];
      if (coordinates) {
        latitude = coordinates.latitude;
        longitude = coordinates.longitude;
        console.log(`Using coordinates for ZIP code ${zipCode}: ${latitude}, ${longitude}`);
      } else {
        // If we don't have coordinates for this zip code, use default coordinates
        latitude = DEFAULT_LATITUDE;
        longitude = DEFAULT_LONGITUDE;
        console.log(`No coordinates found for ZIP code ${zipCode}, using default: ${latitude}, ${longitude}`);
      }
    }
    
    // Validate that we have coordinates
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required parameters: either zipCode or latitude and longitude' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching pharmacies near: ${latitude}, ${longitude}`);
    const pharmacies = await getPharmacies(latitude, longitude, count);
    
    // Add latitude and longitude to each pharmacy for mapping
    const enhancedPharmacies = pharmacies.map((pharmacy: any, index: number) => {
      // If the pharmacy already has coordinates, use those
      if (pharmacy.latitude && pharmacy.longitude) {
        return pharmacy;
      }
      
      // Otherwise, generate coordinates based on the search location with a small offset
      // This is a simplified approach - in a real app, you'd geocode the address
      const offset = 0.005; // Approximately 500 meters
      const randomLat = (Math.random() * offset * 2) - offset;
      const randomLng = (Math.random() * offset * 2) - offset;
      
      return {
        ...pharmacy,
        latitude: latitude + randomLat,
        longitude: longitude + randomLng
      };
    });
    
    return NextResponse.json(enhancedPharmacies);
  } catch (error) {
    console.error('Server error in pharmacies API:', error);
    return NextResponse.json(
      { error: `Failed to fetch pharmacies: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 