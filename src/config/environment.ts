/**
 * Environment configuration for the application
 * This file centralizes all environment-specific settings
 */

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Log environment variables for debugging
if (isDevelopment || process.env.NEXT_PUBLIC_API_LOGGING === 'true') {
  console.log('[CONFIG] Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- NEXT_PUBLIC_USE_MOCK_DATA:', process.env.NEXT_PUBLIC_USE_MOCK_DATA);
  console.log('- NEXT_PUBLIC_USE_REAL_API:', process.env.NEXT_PUBLIC_USE_REAL_API);
  console.log('- AMERICAS_PHARMACY_API_URL:', process.env.AMERICAS_PHARMACY_API_URL ? 'Set' : 'Not set');
  console.log('- AMERICAS_PHARMACY_AUTH_URL:', process.env.AMERICAS_PHARMACY_AUTH_URL ? 'Set' : 'Not set');
  console.log('- AMERICAS_PHARMACY_CLIENT_ID:', process.env.AMERICAS_PHARMACY_CLIENT_ID ? 'Set' : 'Not set');
  console.log('- AMERICAS_PHARMACY_CLIENT_SECRET:', process.env.AMERICAS_PHARMACY_CLIENT_SECRET ? 'Set' : 'Not set');
  console.log('- AMERICAS_PHARMACY_HQ_MAPPING:', process.env.AMERICAS_PHARMACY_HQ_MAPPING);
}

// Determine if we should use mock data based on environment variables
// In production, we want to use the real API
export const USE_MOCK_DATA = 
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' && 
  process.env.NEXT_PUBLIC_USE_REAL_API !== 'true';

// Log the actual value for debugging
if (isDevelopment || process.env.NEXT_PUBLIC_API_LOGGING === 'true') {
  console.log('[CONFIG] USE_MOCK_DATA:', USE_MOCK_DATA);
}

// API configuration
export const API_CONFIG = {
  // Base URL for the external API
  baseUrl: process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com/pricing',
  
  // Authentication URL
  authUrl: process.env.AMERICAS_PHARMACY_AUTH_URL || 'https://medimpact.okta.com/oauth2/aus107c5yrHDu55K8297/v1/token',
  
  // Client credentials
  clientId: process.env.AMERICAS_PHARMACY_CLIENT_ID || '0oatgei47wp1CfkaQ297',
  clientSecret: process.env.AMERICAS_PHARMACY_CLIENT_SECRET || 'pMQW2VhwqCiCcG2sWtEEsTW5b3rbMkMHaI5oChXjJDa2f3e5jzkjzKIV-IgJmObc',
  
  // HQ mapping name for the API
  hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
  
  // Timeout for API requests in milliseconds
  timeout: 10000,
  
  // Whether to log API requests and responses
  enableLogging: isDevelopment || process.env.NEXT_PUBLIC_API_LOGGING === 'true'
};

// Log API configuration for debugging
if (isDevelopment || process.env.NEXT_PUBLIC_API_LOGGING === 'true') {
  console.log('[CONFIG] API Configuration:');
  console.log('- Base URL:', API_CONFIG.baseUrl);
  console.log('- Auth URL:', API_CONFIG.authUrl);
  console.log('- Client ID:', API_CONFIG.clientId ? 'Set' : 'Not set');
  console.log('- Client Secret:', API_CONFIG.clientSecret ? 'Set' : 'Not set');
  console.log('- HQ Mapping:', API_CONFIG.hqMappingName);
  console.log('- Logging Enabled:', API_CONFIG.enableLogging);
}

// Feature flags
export const FEATURES = {
  // Whether to enable the drug search feature
  enableDrugSearch: true,
  
  // Whether to enable the drug comparison feature
  enableDrugComparison: true,
  
  // Whether to enable the pharmacy search feature
  enablePharmacySearch: true,
  
  // Whether to show debug information in the UI
  showDebugInfo: isDevelopment || process.env.NEXT_PUBLIC_SHOW_DEBUG === 'true',
  
  // Whether to enable the pharmacy map
  enablePharmacyMap: process.env.NEXT_PUBLIC_ENABLE_PHARMACY_MAP === 'true',
  
  // Whether to enable drug alternatives
  enableDrugAlternatives: process.env.NEXT_PUBLIC_ENABLE_DRUG_ALTERNATIVE === 'true'
};

// Logging configuration
export const LOGGING = {
  // Log level (debug, info, warn, error)
  level: isDevelopment ? 'debug' : 'error',
  
  // Whether to log to the console
  console: true,
  
  // Whether to log API requests and responses
  api: API_CONFIG.enableLogging
};

/**
 * Helper function to determine if we should use mock data for a specific feature
 * @param feature The feature to check
 * @returns Whether to use mock data for the feature
 */
export function useMockDataFor(feature: string): boolean {
  // If we're using real API, don't use mock data
  if (process.env.NEXT_PUBLIC_USE_REAL_API === 'true') {
    return false;
  }
  
  // Check feature-specific mock data settings
  switch (feature) {
    case 'drugSearch':
      return process.env.NEXT_PUBLIC_USE_MOCK_DRUG_SEARCH === 'true';
    case 'drugInfo':
      return process.env.NEXT_PUBLIC_USE_MOCK_DRUG_INFO === 'true';
    case 'pharmacyPrices':
      return process.env.NEXT_PUBLIC_USE_MOCK_PHARMACY_PRICES === 'true';
    default:
      // Fall back to global mock data setting
      return USE_MOCK_DATA;
  }
}

/**
 * Helper function to determine if we should fall back to mock data if API fails
 * @returns Whether to fall back to mock data
 */
export function shouldFallbackToMock(): boolean {
  return process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK === 'true';
}

/**
 * Log environment configuration for debugging
 */
if (isDevelopment) {
  console.log('Environment Configuration:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- USE_MOCK_DATA:', USE_MOCK_DATA);
  console.log('- API Logging:', API_CONFIG.enableLogging);
  console.log('- Show Debug Info:', FEATURES.showDebugInfo);
}

export default {
  USE_MOCK_DATA,
  API_CONFIG,
  FEATURES,
  LOGGING,
  useMockDataFor,
  shouldFallbackToMock
}; 