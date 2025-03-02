# Setting Up Environment Variables in Vercel

This guide will help you set up the necessary environment variables in Vercel for your production deployment of FrugalRx.

## Required API Variables

The following variables are required for the Americas Pharmacy API to work correctly in production:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `AMERICAS_PHARMACY_API_URL` | `https://api.americaspharmacy.com/pricing` | Base URL for the API |
| `AMERICAS_PHARMACY_AUTH_URL` | `https://medimpact.okta.com/oauth2/aus107c5yrHDu55K8297/v1/token` | Authentication URL |
| `AMERICAS_PHARMACY_CLIENT_ID` | `0oatgei47wp1CfkaQ297` | Client ID for API authentication |
| `AMERICAS_PHARMACY_CLIENT_SECRET` | `pMQW2VhwqCiCcG2sWtEEsTW5b3rbMkMHaI5oChXjJDa2f3e5jzkjzKIV-IgJmObc` | Client secret for API authentication |
| `AMERICAS_PHARMACY_HQ_MAPPING` | `walkerrx` | HQ mapping name for the API |

## Mock Data Configuration

These variables control whether to use mock data or the real API:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_USE_MOCK_DATA` | `false` | Set to `false` to use the real API in production |
| `NEXT_PUBLIC_USE_REAL_API` | `true` | Set to `true` to force using the real API |
| `NEXT_PUBLIC_FALLBACK_TO_MOCK` | `true` | Set to `true` to fall back to mock data if the API fails |

## Feature-specific Mock Data Settings

These variables allow fine-grained control over which features use mock data:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_USE_MOCK_DRUG_SEARCH` | `false` | Set to `false` to use the real API for drug search |
| `NEXT_PUBLIC_USE_MOCK_DRUG_INFO` | `false` | Set to `false` to use the real API for drug info |
| `NEXT_PUBLIC_USE_MOCK_PHARMACY_PRICES` | `false` | Set to `false` to use the real API for pharmacy prices |

## Debugging

These variables control debugging features:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_API_LOGGING` | `false` | Set to `true` to enable API logging (use only for troubleshooting) |
| `NEXT_PUBLIC_SHOW_DEBUG` | `false` | Set to `true` to show the debug panel (use only for troubleshooting) |

## Other Settings

These variables control other features of the application:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `/api` | Base URL for client-side API requests |
| `NEXT_PUBLIC_ENABLE_DRUG_ALTERNATIVES` | `true` | Set to `true` to enable drug alternatives feature |
| `NEXT_PUBLIC_ENABLE_PHARMACY_MAP` | `true` | Set to `true` to enable pharmacy map feature |

## How to Set Up in Vercel

1. Go to your project in the Vercel dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each of the variables listed above with their corresponding values
4. Make sure to select the appropriate environments (Production, Preview, Development)
5. Click **Save** to apply the changes

## Verifying the Setup

After deploying with these environment variables:

1. Visit your production site
2. Check that the drug search, drug info, and pharmacy prices features are working
3. If you've enabled the debug panel (`NEXT_PUBLIC_SHOW_DEBUG=true`), you can use it to verify the environment configuration

## Troubleshooting

If you encounter API errors in production:

1. Temporarily enable logging with `NEXT_PUBLIC_API_LOGGING=true`
2. Check the browser console and server logs for error messages
3. Verify that the API credentials are correct
4. Ensure that the API endpoints are accessible from your Vercel deployment

Remember to disable logging in production once the issues are resolved. 