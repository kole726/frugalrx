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
  '80246': { latitude: 39.7084, longitude: -104.9338 }, // Denver, CO
  '98101': { latitude: 47.6062, longitude: -122.3321 }, // Seattle, WA
  '02108': { latitude: 42.3601, longitude: -71.0589 }, // Boston, MA
  '75201': { latitude: 32.7767, longitude: -96.7970 }, // Dallas, TX
  '30303': { latitude: 33.7490, longitude: -84.3880 }, // Atlanta, GA
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
    
    // Generate more realistic coordinates based on ZIP code
    // This is just for demonstration purposes
    let latitude, longitude;
    
    // First digit of ZIP code roughly corresponds to a region of the US
    const firstDigit = parseInt(zipCode.charAt(0), 10);
    
    // Base coordinates by region
    switch(firstDigit) {
      case 0: // Northeast
        latitude = 42.0 + (Math.random() * 2);
        longitude = -72.0 - (Math.random() * 3);
        break;
      case 1: // Northeast
        latitude = 40.5 + (Math.random() * 2);
        longitude = -74.0 - (Math.random() * 2);
        break;
      case 2: // Mid-Atlantic
        latitude = 38.0 + (Math.random() * 3);
        longitude = -77.0 - (Math.random() * 3);
        break;
      case 3: // Southeast
        latitude = 33.0 + (Math.random() * 5);
        longitude = -84.0 - (Math.random() * 4);
        break;
      case 4: // Southeast
        latitude = 31.0 + (Math.random() * 5);
        longitude = -86.0 - (Math.random() * 4);
        break;
      case 5: // Midwest
        latitude = 40.0 + (Math.random() * 4);
        longitude = -88.0 - (Math.random() * 4);
        break;
      case 6: // Midwest
        latitude = 38.0 + (Math.random() * 4);
        longitude = -90.0 - (Math.random() * 4);
        break;
      case 7: // South Central
        latitude = 32.0 + (Math.random() * 4);
        longitude = -96.0 - (Math.random() * 4);
        break;
      case 8: // Mountain
        latitude = 40.0 + (Math.random() * 5);
        longitude = -105.0 - (Math.random() * 5);
        break;
      case 9: // West Coast
        latitude = 36.0 + (Math.random() * 8);
        longitude = -118.0 - (Math.random() * 4);
        break;
      default: // Default to central US
        latitude = 39.0 + (Math.random() * 2);
        longitude = -98.0 - (Math.random() * 2);
    }
    
    // Add some variation based on the rest of the ZIP code
    const zipSum = zipCode.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    latitude += (zipSum % 10) * 0.01;
    longitude -= (zipSum % 10) * 0.01;
    
    // Round to 4 decimal places for consistency
    latitude = Math.round(latitude * 10000) / 10000;
    longitude = Math.round(longitude * 10000) / 10000;
    
    // Store in cache
    zipCodeCache[zipCode] = {
      latitude,
      longitude
    };
    
    console.log(`Generated coordinates for ZIP code ${zipCode}: ${latitude}, ${longitude}`);
    
    return {
      latitude,
      longitude,
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