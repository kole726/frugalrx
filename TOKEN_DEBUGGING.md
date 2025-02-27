# Token Debugging Guide

This document provides instructions for debugging token expiration issues in the FrugalRx application.

## Overview

The application uses OAuth 2.0 client credentials flow to authenticate with the Americas Pharmacy API. The token is cached and reused until it expires, at which point a new token is requested. The token expiration is tracked with a safety margin to prevent using tokens that are about to expire.

## Enhanced Logging

The authentication module (`src/lib/server/auth.ts`) has been enhanced with detailed logging to help debug token expiration issues. The logging includes:

- Timestamps for all token-related events
- Detailed information about token requests, refreshes, and expirations
- Token expiry calculations and safety margins
- Error details for failed token requests
- History of token events for troubleshooting

## Debugging Endpoints

Two API endpoints have been added to help debug token issues:

### 1. Token Status Endpoint

```
GET /api/debug/token-status?key=YOUR_DEBUG_API_KEY
```

This endpoint returns detailed information about the current token status, including:

- Whether a token exists
- Token type and expiration time
- Time until expiry
- Token request and refresh counts
- Last error message (if any)
- History of token events

### 2. Force Token Refresh Endpoint

```
POST /api/debug/token-status?key=YOUR_DEBUG_API_KEY
```

This endpoint forces a token refresh regardless of the current token's expiration status. It returns the same information as the token status endpoint, plus confirmation that the token was refreshed.

### 3. Test Auth Endpoint

```
GET /api/test-auth
```

This endpoint tests the authentication flow by:

1. Getting an authentication token
2. Making a simple API request to the Americas Pharmacy API
3. Returning timing information and request results

## How to Debug Token Expiration Issues

1. **Check the server logs**: Look for log entries with the `[AUTH]` prefix to see detailed information about token requests and refreshes.

2. **Check the token status**: Use the token status endpoint to get detailed information about the current token.

3. **Force a token refresh**: If you suspect the token is invalid or expired, use the force token refresh endpoint to get a new token.

4. **Test the authentication flow**: Use the test auth endpoint to verify that the authentication flow is working correctly.

5. **Monitor token expiration**: Look for log entries with "Token expiring soon" or "Token expired" to see when tokens are about to expire or have expired.

## Common Issues and Solutions

### Token Expires Too Quickly

If tokens are expiring before their expected lifetime, check:

- The `expires_in` value returned by the authentication server
- The safety margin applied to the token expiry (default: 5 minutes)
- Clock synchronization between your server and the authentication server

### Token Refresh Fails

If token refresh requests are failing, check:

- API credentials in environment variables
- Network connectivity to the authentication server
- Rate limiting or IP restrictions on the authentication server

### Multiple Token Requests in Short Succession

If multiple token requests are being made in a short period, check:

- Concurrent requests that might be bypassing the token cache
- Server restarts that might be clearing the token cache
- Memory leaks that might be causing the token cache to be garbage collected

## Configuration

The token debugging features can be configured through environment variables:

- `API_DEBUG_KEY`: The API key required to access the debug endpoints (default: `debug-frugal-rx-token`)

## Security Considerations

The debug endpoints are protected with a simple API key check. In a production environment, consider:

- Using a more secure authentication method
- Restricting access to internal networks only
- Disabling the debug endpoints in production builds 