/**
 * Geocoding utilities for converting between addresses and coordinates
 */
import { getGoogleMapsWithRefresh } from './mapsTokenManager';

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
 * Geocode a ZIP code to latitude and longitude using Google Maps Geocoding API
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
    console.log(`Fetching coordinates for ZIP code: ${zipCode} using Google Maps API`);
    
    // Use the Google Maps API for geocoding
    const google = await getGoogleMapsWithRefresh();
    const geocoder = new google.maps.Geocoder();
    
    // Create a promise to handle the geocoding request
    const result = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      geocoder.geocode({ address: zipCode, region: 'us' }, (results: any, status: any) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const location = results[0].geometry.location;
          resolve({
            latitude: location.lat(),
            longitude: location.lng()
          });
        } else {
          console.error(`Geocoding failed for ZIP code ${zipCode}: ${status}`);
          
          // Fall back to our pre-populated cache or regional approximation
          if (zipCodeCache[zipCode]) {
            resolve(zipCodeCache[zipCode]);
          } else {
            // Use our regional approximation as a fallback
            const fallbackCoordinates = getFallbackCoordinates(zipCode);
            resolve(fallbackCoordinates);
          }
        }
      });
    });
    
    // Store in cache
    zipCodeCache[zipCode] = {
      latitude: result.latitude,
      longitude: result.longitude
    };
    
    console.log(`Geocoded ZIP code ${zipCode} to: ${result.latitude}, ${result.longitude}`);
    
    return {
      ...result,
      zipCode
    };
  } catch (error) {
    console.error('Error geocoding ZIP code:', error);
    
    // Try to use our fallback method if the Google API fails
    try {
      console.log(`Falling back to regional approximation for ZIP code: ${zipCode}`);
      const fallbackCoordinates = getFallbackCoordinates(zipCode);
      
      // Store in cache
      zipCodeCache[zipCode] = fallbackCoordinates;
      
      return {
        ...fallbackCoordinates,
        zipCode
      };
    } catch (fallbackError) {
      console.error('Fallback geocoding also failed:', fallbackError);
      throw new Error(`Failed to geocode ZIP code: ${zipCode}`);
    }
  }
}

/**
 * Get fallback coordinates based on ZIP code region
 * @param zipCode The ZIP code to approximate
 * @returns Approximate coordinates for the ZIP code
 */
function getFallbackCoordinates(zipCode: string): { latitude: number; longitude: number } {
  // First digit of ZIP code corresponds to a region of the US
  const firstDigit = parseInt(zipCode.charAt(0), 10);
  
  // Base coordinates by region
  let latitude, longitude;
  
  switch(firstDigit) {
    case 0: // Northeast (CT, MA, ME, NH, NJ, RI, VT, Puerto Rico)
      latitude = 42.3601; // Boston area
      longitude = -71.0589;
      break;
    case 1: // Northeast (DE, NY, PA)
      latitude = 40.7128; // New York area
      longitude = -74.0060;
      break;
    case 2: // Mid-Atlantic (DC, MD, NC, SC, VA, WV)
      latitude = 38.9072; // Washington DC area
      longitude = -77.0369;
      break;
    case 3: // Southeast (AL, FL, GA, MS, TN)
      latitude = 33.7490; // Atlanta area
      longitude = -84.3880;
      break;
    case 4: // Southeast (KY, OH)
      latitude = 39.9612; // Columbus, OH area
      longitude = -82.9988;
      break;
    case 5: // Midwest (IA, MN, MT, ND, SD, WI)
      latitude = 44.9778; // Minneapolis area
      longitude = -93.2650;
      break;
    case 6: // Midwest (IL, IN, KS, MO, NE)
      latitude = 41.8781; // Chicago area
      longitude = -87.6298;
      break;
    case 7: // South Central (AR, LA, OK, TX)
      latitude = 32.7767; // Dallas area
      longitude = -96.7970;
      break;
    case 8: // Mountain (AZ, CO, ID, NM, NV, UT, WY)
      latitude = 39.7392; // Denver area
      longitude = -104.9903;
      break;
    case 9: // West Coast (AK, CA, HI, OR, WA)
      latitude = 37.7749; // San Francisco area
      longitude = -122.4194;
      break;
    default: // Default to central US
      latitude = 39.8283; // Kansas City area
      longitude = -98.5795;
  }
  
  // Use the second and third digits to refine the location within the region
  const secondDigit = parseInt(zipCode.charAt(1), 10);
  const thirdDigit = parseInt(zipCode.charAt(2), 10);
  
  // Adjust latitude and longitude based on second and third digits
  latitude += (secondDigit - 5) * 0.4; // Adjust north/south within region
  longitude += (thirdDigit - 5) * 0.4; // Adjust east/west within region
  
  // Add minor variations based on the last two digits for more uniqueness
  const fourthDigit = parseInt(zipCode.charAt(3), 10);
  const fifthDigit = parseInt(zipCode.charAt(4), 10);
  latitude += (fourthDigit * 0.01);
  longitude += (fifthDigit * 0.01);
  
  // Round to 4 decimal places for consistency
  latitude = Math.round(latitude * 10000) / 10000;
  longitude = Math.round(longitude * 10000) / 10000;
  
  return { latitude, longitude };
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