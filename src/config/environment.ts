/**
 * Environment configuration for the application
 * This file centralizes all environment-specific settings
 */

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Determine if we should use mock data
// Setting this to false to disable mock data completely
export const USE_MOCK_DATA = true;

// Log the actual value for debugging
if (isDevelopment) {
  console.log('[CONFIG] USE_MOCK_DATA:', USE_MOCK_DATA);
  console.log('[CONFIG] NEXT_PUBLIC_USE_REAL_API:', process.env.NEXT_PUBLIC_USE_REAL_API);
  console.log('[CONFIG] NEXT_PUBLIC_USE_MOCK_DATA:', process.env.NEXT_PUBLIC_USE_MOCK_DATA);
}

// API configuration
export const API_CONFIG = {
  // Base URL for the external API
  baseUrl: process.env.AMERICAS_PHARMACY_API_URL || 'https://api.americaspharmacy.com/pricing',
  
  // Authentication URL
  authUrl: process.env.AMERICAS_PHARMACY_AUTH_URL || 'https://medimpact.okta.com/oauth2/aus107c5yrHDu55K8297/v1/token',
  
  // Client credentials
  clientId: process.env.AMERICAS_PHARMACY_CLIENT_ID || '',
  clientSecret: process.env.AMERICAS_PHARMACY_CLIENT_SECRET || '',
  
  // HQ mapping name for the API
  hqMappingName: process.env.AMERICAS_PHARMACY_HQ_MAPPING || 'walkerrx',
  
  // Timeout for API requests in milliseconds
  timeout: 10000,
  
  // Whether to log API requests and responses
  enableLogging: isDevelopment || process.env.NEXT_PUBLIC_API_LOGGING === 'true'
};

// Feature flags
export const FEATURES = {
  // Whether to enable the drug search feature
  enableDrugSearch: true,
  
  // Whether to enable the drug comparison feature
  enableDrugComparison: true,
  
  // Whether to enable the pharmacy search feature
  enablePharmacySearch: true,
  
  // Whether to show debug information in the UI
  showDebugInfo: isDevelopment || process.env.NEXT_PUBLIC_SHOW_DEBUG === 'true'
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
  // Return the global USE_MOCK_DATA setting
  return USE_MOCK_DATA;
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
  useMockDataFor
}; 