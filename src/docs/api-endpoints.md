# America's Pharmacy API Endpoints

This document outlines all the available API endpoints from America's Pharmacy and their implementation status in our application.

## Authentication

| Endpoint | Description | Status | Implementation |
|----------|-------------|--------|---------------|
| `POST /oauth2/aus107c5yrHDu55K8297/v1/token` | Get authentication token | ✅ Implemented | `src/lib/server/auth.ts` |

## Drug Search

| Endpoint | Description | Status | Implementation |
|----------|-------------|--------|---------------|
| `POST /v1/drugs/names` | Search for drugs by name prefix (min 3 chars) | ✅ Implemented | `src/lib/server/medicationService.ts:searchDrugs()` |
| `GET /v1/drugs/{prefixText}` | Search for drugs by name prefix (GET method) | ✅ Implemented | `src/lib/server/medicationService.ts:searchDrugsByPrefix()` |

## Drug Pricing

| Endpoint | Description | Status | Implementation |
|----------|-------------|--------|---------------|
| `POST /v1/drugprices/byName` | Get drug prices by name (min 3 chars) | ✅ Implemented | `src/lib/server/medicationService.ts:getDrugPrices()` |
| `POST /v1/drugprices/byGSN` | Get drug prices by GSN | ✅ Implemented | `src/lib/server/medicationService.ts:getDrugPrices()` |
| `POST /v1/drugprices/byNdcCode` | Get drug prices by NDC code | ✅ Implemented | `src/lib/server/medicationService.ts:getDrugPrices()` |
| `POST /v1/drugprices/groupdrugprices` | Get prices aggregated by pharmacy chain | ❌ Not Available | Endpoint returns 404 Not Found |

## Multi-Drug Pricing

| Endpoint | Description | Status | Implementation |
|----------|-------------|--------|---------------|
| `POST /v1/multidrugprices/byGSN` | Get prices for multiple drugs by GSN | ❓ Not Tested | - |
| `POST /v1/multidrugprices/byName` | Get prices for multiple drugs by name | ❓ Not Tested | - |
| `POST /v1/multidrugprices/byNdcCode` | Get prices for multiple drugs by NDC code | ❓ Not Tested | - |
| `POST /v1/multigroupdrugprices` | Get prices for multiple drugs by pharmacy chain | ❓ Not Tested | - |

## Drug Information

| Endpoint | Description | Status | Implementation |
|----------|-------------|--------|---------------|
| `GET /v1/druginfo/{gsn}` | Get detailed drug information by GSN | ✅ Implemented | `src/lib/server/medicationService.ts:getDetailedDrugInfo()` |

## Pharmacy Information

| Endpoint | Description | Status | Implementation |
|----------|-------------|--------|---------------|
| `GET /v1/pharmacies` | Get pharmacies near a location | ✅ Implemented | `src/lib/server/medicationService.ts:getPharmacies()` |

## Validation Requirements

All drug name searches require a minimum of 3 characters. This is enforced at multiple levels:

1. **API Level**: The America's Pharmacy API requires at least 3 characters for drug name searches
2. **Server Level**: Our server-side validation in `medicationService.ts` checks for minimum length
3. **API Route Level**: Our API routes validate query parameters before processing
4. **Client Level**: The UI prevents searches with fewer than 3 characters

Attempting to search with fewer than 3 characters will result in a 400 Bad Request error with an appropriate error message.

## API Test Results

Based on our test script (`src/scripts/test-api-connection.js`), we have confirmed the following:

1. ✅ Authentication is working correctly
2. ✅ Drug search (POST method) is working correctly
3. ✅ Drug search by prefix (GET method) is working correctly
4. ✅ Drug prices API is working correctly (returns empty results for some drugs)
5. ❌ Group drug prices API is not available (returns 404 Not Found)
6. ✅ Validation for short drug names is working correctly

## Implementation Priority

For the remaining untested endpoints, here's the priority order for implementation:

1. Multi-drug pricing endpoints - Useful for comparing multiple medications

## Testing

All implemented endpoints can be tested using:

1. The API test page at `/api-test`
2. The test script at `src/scripts/test-api-connection.js` 