# FrugalRx - Prescription Savings App

FrugalRx is a white-labeled version of America's Pharmacy, helping users save up to 80% on prescription medications. The application allows users to search for medications, compare prices at different pharmacies, and get digital discount cards.

## Features

- Medication search with autocomplete
- Pharmacy price comparison
- Digital discount card
- Pharmacy locator with map integration
- Medication information and alternatives

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- America's Pharmacy API integration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- America's Pharmacy API credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/frugal-v2.git
   cd frugal-v2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

4. Update the `.env.local` file with your API credentials:
   ```
   # Medication API Authentication (server-side only)
   AMERICAS_PHARMACY_AUTH_URL=https://medimpact.okta.com/oauth2/aus107c5yrHDu55K8297/v1/token
   AMERICAS_PHARMACY_CLIENT_ID=0oatgei47wp1CfkaQ297
   AMERICAS_PHARMACY_CLIENT_SECRET=pMQW2VhwqCiCcG2sWtEEsTW5b3rbMkMHaI5oChXjJDa2f3e5jzkjzKIV-IgJmObc
   AMERICAS_PHARMACY_HQ_MAPPING=walkerrx

   # Medication API URLs (server-side only)
   AMERICAS_PHARMACY_API_URL=https://api.americaspharmacy.com/pricing

   # Client-side API base URL - Using relative URL for API calls
   NEXT_PUBLIC_API_BASE_URL=/api

   # Google Maps API Key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # Feature flags
   NEXT_PUBLIC_USE_REAL_API=true
   NEXT_PUBLIC_FALLBACK_TO_MOCK=true
   NEXT_PUBLIC_ENABLE_PHARMACY_MAP=true
   NEXT_PUBLIC_ENABLE_DRUG_ALTERNATIVE=true
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Configuration

FrugalRx integrates with the America's Pharmacy API to provide real-time medication pricing and pharmacy information. The following API endpoints are used:

### API Endpoints

#### Drug Search
- **POST /api/drugs/search** - Search for medications by name (minimum 3 characters required)
- **GET /api/drugs/prefix/:prefix** - Search for medications by prefix (minimum 3 characters required)

#### Drug Pricing
- **POST /api/drugs/prices** - Get prices for a medication at nearby pharmacies
- **GET /api/drugs/prices** - Get prices for a medication (query parameters: drugName, gsn, or ndcCode required)

#### Drug Information
- **GET /api/drugs/info/name** - Get detailed information about a medication by name (minimum 3 characters required)
- **GET /api/drugs/info/gsn/:gsn** - Get detailed information about a medication by GSN

#### Pharmacy Information
- **GET /api/pharmacies/nearby** - Find pharmacies near a location

### Validation Requirements

- All drug name searches require a minimum of 3 characters
- API requests with drug names shorter than 3 characters will return a 400 Bad Request error
- The America's Pharmacy API enforces this minimum character requirement for all drug searches

### Testing the API Connection

A test script is available to verify the API connection:

```bash
node src/scripts/test-api-connection.js
```

This script tests authentication, drug search, drug pricing, and other API endpoints. Note that some endpoints like group drug prices are not available in the current API version.

For more details, see the [API Endpoints Documentation](src/docs/api-endpoints.md) or visit the [API test page](/api-test) in the application.

## Deployment on Vercel

The application is configured for deployment on Vercel. You need to set the following environment variables in your Vercel project:

- `AMERICAS_PHARMACY_AUTH_URL`
- `AMERICAS_PHARMACY_CLIENT_ID`
- `AMERICAS_PHARMACY_CLIENT_SECRET`
- `AMERICAS_PHARMACY_HQ_MAPPING`
- `AMERICAS_PHARMACY_API_URL`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_USE_REAL_API`
- `NEXT_PUBLIC_FALLBACK_TO_MOCK`
- `NEXT_PUBLIC_ENABLE_PHARMACY_MAP`
- `NEXT_PUBLIC_ENABLE_DRUG_ALTERNATIVE`

## Environment Configuration

The application uses environment variables to control its behavior in different environments (development, production, etc.).

### Mock Data vs. Real API

The application can operate in two modes:

1. **Mock Data Mode**: Uses locally stored mock data for development and testing
2. **Real API Mode**: Connects to the Americas Pharmacy API for real data

You can control this behavior with environment variables:

```
# Global setting - true for mock data, false for real API
NEXT_PUBLIC_USE_MOCK_DATA=true

# Feature-specific overrides
NEXT_PUBLIC_USE_MOCK_DRUG_SEARCH=true
NEXT_PUBLIC_USE_MOCK_DRUG_INFO=true
NEXT_PUBLIC_USE_MOCK_PHARMACY_PRICES=true

# Force real API in development
NEXT_PUBLIC_USE_REAL_API=false

# Fall back to mock data if API fails
NEXT_PUBLIC_FALLBACK_TO_MOCK=true
```

### Debugging

To enable API logging and debug information, set the following environment variables:

```
NEXT_PUBLIC_API_LOGGING=true
NEXT_PUBLIC_SHOW_DEBUG=true
```

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Acknowledgements

- [America's Pharmacy](https://www.americaspharmacy.com/) for the API and inspiration
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for the styling
- [Vercel](https://vercel.com/) for hosting

## Vercel Deployment

### Environment Variables

To ensure the API works correctly on Vercel, you need to set the following environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following environment variables:

#### API Configuration (Required)
```
AMERICAS_PHARMACY_API_URL=https://api.americaspharmacy.com/pricing
AMERICAS_PHARMACY_AUTH_URL=https://medimpact.okta.com/oauth2/aus107c5yrHDu55K8297/v1/token
AMERICAS_PHARMACY_CLIENT_ID=0oatgei47wp1CfkaQ297
AMERICAS_PHARMACY_CLIENT_SECRET=pMQW2VhwqCiCcG2sWtEEsTW5b3rbMkMHaI5oChXjJDa2f3e5jzkjzKIV-IgJmObc
AMERICAS_PHARMACY_HQ_MAPPING=walkerrx
```

#### Feature Configuration (Required)
```
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_FALLBACK_TO_MOCK=true
```

#### Debugging (Optional)
```
NEXT_PUBLIC_API_LOGGING=true
NEXT_PUBLIC_SHOW_DEBUG=true
```

#### Feature Flags (Optional)
```
NEXT_PUBLIC_ENABLE_DRUG_ALTERNATIVES=true
NEXT_PUBLIC_ENABLE_PHARMACY_MAP=true
```

### Troubleshooting Vercel Deployment

If you encounter issues with the API on Vercel:

1. Visit the `/debug` page on your deployed site to check environment variables and API status
2. Check the Vercel logs for any errors
3. Ensure all required environment variables are set correctly
4. Try redeploying the application after updating environment variables

### Debugging Tools

The application includes several debugging tools:

- `/debug` - Shows environment variables and API status
- `/api-test` - Test API endpoints directly
- `/api/debug/env` - JSON endpoint showing environment variables
- `/api/debug/api` - JSON endpoint showing API status
- `/api/test-connection` - Test API connection
