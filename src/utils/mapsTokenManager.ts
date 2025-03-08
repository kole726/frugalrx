import { Loader } from '@googlemaps/js-api-loader';

// Token refresh settings
const TOKEN_REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes in milliseconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

interface TokenState {
  loader: Loader | null;
  lastRefreshed: number;
  isRefreshing: boolean;
  refreshPromise: Promise<any> | null;
  retryCount: number;
}

// Token state
const tokenState: TokenState = {
  loader: null,
  lastRefreshed: 0,
  isRefreshing: false,
  refreshPromise: null,
  retryCount: 0,
};

/**
 * Initialize the Google Maps loader with the API key
 */
export function initMapsLoader(): Loader {
  if (!tokenState.loader) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    
    // Check if API key is missing or using the placeholder value
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.warn('WARNING: Google Maps API key is missing or using the placeholder value. Maps functionality will be limited.');
    }
    
    tokenState.loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places'],
    });
    tokenState.lastRefreshed = Date.now();
  }
  return tokenState.loader;
}

/**
 * Get the Google Maps API with automatic token refresh
 * @returns A promise that resolves to the Google Maps API
 */
export async function getGoogleMapsWithRefresh(): Promise<any> {
  // Initialize the loader if it doesn't exist
  if (!tokenState.loader) {
    initMapsLoader();
  }

  // Check if we need to refresh the token
  const now = Date.now();
  const shouldRefresh = now - tokenState.lastRefreshed > TOKEN_REFRESH_INTERVAL;

  // If we're already refreshing, wait for that to complete
  if (tokenState.isRefreshing && tokenState.refreshPromise) {
    return tokenState.refreshPromise;
  }

  // If we need to refresh, do so
  if (shouldRefresh) {
    return refreshToken();
  }

  // Otherwise, just load the API
  try {
    return await tokenState.loader!.load();
  } catch (error) {
    console.error('Error loading Google Maps API:', error);
    
    // Check if the error is related to an invalid API key
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('API key') || errorMessage.includes('apiKey')) {
      throw new Error('Google Maps API key is invalid or missing. Please check your .env.local file and ensure you have a valid API key.');
    }
    
    return refreshToken();
  }
}

/**
 * Refresh the Google Maps API token
 * @returns A promise that resolves to the Google Maps API
 */
async function refreshToken(): Promise<any> {
  // If we're already refreshing, return the existing promise
  if (tokenState.isRefreshing && tokenState.refreshPromise) {
    return tokenState.refreshPromise;
  }

  // Set refreshing state
  tokenState.isRefreshing = true;
  
  // Get the API key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  // Check if API key is missing or using the placeholder value
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
    tokenState.isRefreshing = false;
    throw new Error('Google Maps API key is missing or using the placeholder value. Please update your .env.local file with a valid API key.');
  }
  
  // Create a new loader with the API key
  tokenState.loader = new Loader({
    apiKey: apiKey,
    version: 'weekly',
    libraries: ['places'],
  });

  // Create a promise for the refresh
  tokenState.refreshPromise = tokenState.loader.load()
    .then((google) => {
      // Reset state on success
      tokenState.lastRefreshed = Date.now();
      tokenState.isRefreshing = false;
      tokenState.retryCount = 0;
      tokenState.refreshPromise = null;
      return google;
    })
    .catch(async (error) => {
      console.error('Error refreshing Google Maps API token:', error);
      
      // Check if the error is related to an invalid API key
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('API key') || errorMessage.includes('apiKey')) {
        tokenState.isRefreshing = false;
        tokenState.refreshPromise = null;
        throw new Error('Google Maps API key is invalid. Please check your .env.local file and ensure you have a valid API key.');
      }
      
      // Retry logic
      if (tokenState.retryCount < MAX_RETRIES) {
        tokenState.retryCount++;
        tokenState.isRefreshing = false;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        // Try again
        return refreshToken();
      } else {
        // Reset state on failure
        tokenState.isRefreshing = false;
        tokenState.refreshPromise = null;
        tokenState.retryCount = 0;
        throw new Error('Failed to refresh Google Maps API token after multiple attempts');
      }
    });

  return tokenState.refreshPromise;
}

/**
 * Force a token refresh
 * @returns A promise that resolves when the token has been refreshed
 */
export async function forceTokenRefresh(): Promise<any> {
  tokenState.lastRefreshed = 0; // Set to 0 to force refresh
  return getGoogleMapsWithRefresh();
} 