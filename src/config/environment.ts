/**
 * Environment configuration for the application
 * This file centralizes all environment-specific settings
 */

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Parse boolean environment variables
const parseBoolEnv = (value: string | undefined): boolean => {
  return value?.toLowerCase() === 'true';
};

// Determine if we should use mock data
export const USE_MOCK_DATA = parseBoolEnv(process.env.NEXT_PUBLIC_USE_MOCK_DATA) ?? false;

// Feature-specific mock data settings
export const USE_MOCK_DRUG_SEARCH = parseBoolEnv(process.env.NEXT_PUBLIC_USE_MOCK_DRUG_SEARCH) ?? USE_MOCK_DATA;
export const USE_MOCK_DRUG_INFO = parseBoolEnv(process.env.NEXT_PUBLIC_USE_MOCK_DRUG_INFO) ?? USE_MOCK_DATA;
export const USE_MOCK_PHARMACY_PRICES = parseBoolEnv(process.env.NEXT_PUBLIC_USE_MOCK_PHARMACY_PRICES) ?? USE_MOCK_DATA;

// Determine if we should fall back to mock data if API fails
export const FALLBACK_TO_MOCK = parseBoolEnv(process.env.NEXT_PUBLIC_FALLBACK_TO_MOCK) ?? false;

// Log the actual values for debugging
if (isDevelopment) {
  console.log('[CONFIG] USE_MOCK_DATA:', USE_MOCK_DATA);
  console.log('[CONFIG] USE_MOCK_DRUG_SEARCH:', USE_MOCK_DRUG_SEARCH);
  console.log('[CONFIG] USE_MOCK_DRUG_INFO:', USE_MOCK_DRUG_INFO);
  console.log('[CONFIG] USE_MOCK_PHARMACY_PRICES:', USE_MOCK_PHARMACY_PRICES);
  console.log('[CONFIG] FALLBACK_TO_MOCK:', FALLBACK_TO_MOCK);
  console.log('[CONFIG] NEXT_PUBLIC_USE_REAL_API:', process.env.NEXT_PUBLIC_USE_REAL_API);
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
  enableLogging: isDevelopment || parseBoolEnv(process.env.NEXT_PUBLIC_API_LOGGING)
};

// Feature flags
export const FEATURES = {
  // Whether to enable the drug search feature
  enableDrugSearch: true,
  
  // Whether to enable the drug comparison feature
  enableDrugComparison: true,
  
  // Whether to enable the pharmacy search feature
  enablePharmacySearch: true,
  
  // Whether to enable drug alternatives
  enableDrugAlternatives: parseBoolEnv(process.env.NEXT_PUBLIC_ENABLE_DRUG_ALTERNATIVES) ?? true,
  
  // Whether to enable pharmacy map
  enablePharmacyMap: parseBoolEnv(process.env.NEXT_PUBLIC_ENABLE_PHARMACY_MAP) ?? true,
  
  // Whether to show debug information in the UI
  showDebugInfo: isDevelopment || parseBoolEnv(process.env.NEXT_PUBLIC_SHOW_DEBUG)
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
  switch (feature) {
    case 'drugSearch':
      return USE_MOCK_DRUG_SEARCH;
    case 'drugInfo':
      return USE_MOCK_DRUG_INFO;
    case 'pharmacyPrices':
      return USE_MOCK_PHARMACY_PRICES;
    default:
      return USE_MOCK_DATA;
  }
}

/**
 * Log environment configuration for debugging
 */
if (isDevelopment) {
  console.log('Environment Configuration:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- USE_MOCK_DATA:', USE_MOCK_DATA);
  console.log('- USE_MOCK_DRUG_SEARCH:', USE_MOCK_DRUG_SEARCH);
  console.log('- USE_MOCK_DRUG_INFO:', USE_MOCK_DRUG_INFO);
  console.log('- USE_MOCK_PHARMACY_PRICES:', USE_MOCK_PHARMACY_PRICES);
  console.log('- FALLBACK_TO_MOCK:', FALLBACK_TO_MOCK);
  console.log('- API Logging:', API_CONFIG.enableLogging);
  console.log('- Show Debug Info:', FEATURES.showDebugInfo);
  console.log('- Enable Drug Alternatives:', FEATURES.enableDrugAlternatives);
  console.log('- Enable Pharmacy Map:', FEATURES.enablePharmacyMap);
}

export default {
  USE_MOCK_DATA,
  USE_MOCK_DRUG_SEARCH,
  USE_MOCK_DRUG_INFO,
  USE_MOCK_PHARMACY_PRICES,
  FALLBACK_TO_MOCK,
  API_CONFIG,
  FEATURES,
  LOGGING,
  useMockDataFor
}; 