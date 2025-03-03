/**
 * Geocoding utilities for converting between addresses and coordinates
 */

// Cache for geocoded ZIP codes
const zipCodeCache: Record<string, { latitude: number; longitude: number }> = {
  // Pre-populate with some common ZIP codes
  '78759': { latitude: 30.4015, longitude: -97.7527 }, // Austin, TX
  '10001': { latitude: 40.7501, longitude: -73.9996 }, // New York, NY
  '90210': { latitude: 34.1030, longitude: -118.4105 }, // Beverly Hills, CA
  '60601': { latitude: 41.8855, longitude: -87.6221 }, // Chicago, IL
  '33101': { latitude: 25.7751, longitude: -80.1947 }, // Miami, FL
};

/**
 * Geocode a ZIP code to latitude and longitude
 * @param zipCode The ZIP code to geocode
 * @returns A promise that resolves to the latitude and longitude
 */
export async function geocodeZipCode(zipCode: string): Promise<{ latitude: number; longitude: number; zipCode: string }> {
  console.log(`Geocoding ZIP code: ${zipCode}`);
  
  // Validate ZIP code format
  if (!zipCode || !/^\d{5}$/.test(zipCode)) {
    console.error(`Invalid ZIP code format: ${zipCode}`);
    throw new Error('Please enter a valid 5-digit ZIP code');
  }
  
  // Check if we have this ZIP code in our cache
  if (zipCodeCache[zipCode]) {
    console.log(`Using cached coordinates for ZIP code: ${zipCode}`);
    return {
      ...zipCodeCache[zipCode],
      zipCode
    };
  }

  try {
    console.log(`Fetching coordinates for ZIP code: ${zipCode}`);
    
    // In a real app, we would call a geocoding service here
    // For now, we'll simulate a geocoding service with a deterministic algorithm
    
    // Wait a bit to simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate consistent but random-looking coordinates based on ZIP code
    // This is just for demonstration purposes
    const zipSum = zipCode.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const latBase = 30 + (zipSum % 10) * 0.1;
    const lngBase = -97 - (zipSum % 10) * 0.1;
    
    // Store in cache
    zipCodeCache[zipCode] = {
      latitude: latBase,
      longitude: lngBase
    };
    
    console.log(`Generated coordinates for ZIP code ${zipCode}: ${latBase}, ${lngBase}`);
    
    return {
      latitude: latBase,
      longitude: lngBase,
      zipCode
    };
  } catch (error) {
    console.error('Error geocoding ZIP code:', error);
    throw new Error(`Failed to geocode ZIP code: ${zipCode}`);
  }
}

/**
 * Get the distance between two coordinates in miles
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns The distance in miles
 */
export function getDistanceBetweenCoordinates(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula to calculate distance between two points on Earth
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
} 