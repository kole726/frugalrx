# FrugalRx

Save up to 80% on prescription medications with FrugalRx's digital savings card.

## Features

- Medication price comparison
- Digital savings card
- Pharmacy locator
- Health savings blog

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Built With

- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
- TypeScript

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# frugal-v2

# FrugalRx Pharmacy Map Feature

This project implements a pharmacy map feature for the FrugalRx application, allowing users to find nearby pharmacies with the best prices for their medications.

## Features

- Interactive map displaying nearby pharmacies
- Filtering by ZIP code and radius
- Detailed pharmacy information including:
  - Pharmacy name and address
  - Distance from user location
  - Price for the selected medication
  - Special features (24-hour service, drive-up window, handicap access)
- Coupon generation for selected pharmacies
- Mobile-friendly responsive design

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_URL=http://localhost:3000
   AMERICAS_PHARMACY_API_URL=https://api.americaspharmacy.com
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
   NODE_ENV=development
   ```
4. Replace `YOUR_GOOGLE_MAPS_API_KEY` with a valid Google Maps API key
5. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

The application uses the following API endpoints:

- `/api/pricing/v1/drugprices/byName` - Get pharmacy prices for a specific drug
  - Parameters:
    - `drugName`: Name of the medication
    - `latitude`: User's latitude
    - `longitude`: User's longitude
    - `zipCode`: User's ZIP code (alternative to lat/lng)
    - `radius`: Search radius in miles (default: 50)

## Components

### PharmacyMap

The main component for displaying the map and pharmacy markers.

```tsx
<PharmacyMap 
  pharmacies={pharmacies}
  zipCode={userLocation.zipCode}
  centerLat={userLocation.latitude}
  centerLng={userLocation.longitude}
  searchRadius={searchRadius}
  onMarkerClick={(pharmacy) => handleGetCoupon(pharmacy)}
  onZipCodeChange={handleZipCodeChange}
  onRadiusChange={handleRadiusChange}
/>
```

### CouponModal

Modal component for displaying and generating coupons for selected pharmacies.

```tsx
<CouponModal
  isOpen={isCouponModalOpen}
  onClose={() => setIsCouponModalOpen(false)}
  drugName={drugInfo?.brandName || drugInfo?.genericName || 'Medication'}
  pharmacy={selectedPharmacy}
  price={selectedPharmacy.price ? selectedPharmacy.price.toFixed(2) : undefined}
/>
```

## Utilities

- `geocoding.ts` - Utilities for converting ZIP codes to coordinates
- `mapMarkers.ts` - Custom marker definitions for the map
- `mapsTokenManager.ts` - Google Maps API token management

## Development Notes

- The application uses mock data in development mode
- Authentication is simulated in development with a mock token
- For production, you'll need to configure the proper API endpoints and authentication

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
