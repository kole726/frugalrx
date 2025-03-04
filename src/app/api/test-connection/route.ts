import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server/auth';
import { testApiConnection } from '@/lib/server/medicationService';

export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  console.log('Testing connection and authentication...');
  
  // Get environment variables
  const apiUrl = process.env.API_URL || '';
  const apiKey = process.env.API_KEY || '';
  const apiSecret = process.env.API_SECRET || '';
  const apiVersion = process.env.API_VERSION || '';
  
  console.log('Environment variables:', { 
    apiUrl: apiUrl ? 'Set' : 'Not set',
    apiKey: apiKey ? 'Set' : 'Not set',
    apiSecret: apiSecret ? 'Set' : 'Not set',
    apiVersion: apiVersion ? 'Set' : 'Not set'
  });
  
  // Test authentication
  let authResult = {
    success: false,
    message: 'Authentication failed',
    token: ''
  };
  
  try {
    console.log('Testing authentication...');
    const token = await getAuthToken();
    
    if (token) {
      authResult = {
        success: true,
        message: 'Successfully authenticated with the API',
        token
      };
      console.log('Authentication successful');
    } else {
      authResult.message = 'Failed to obtain authentication token';
      console.log('Authentication failed: No token received');
    }
  } catch (error) {
    authResult.message = `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('Authentication error:', error);
  }
  
  // Test API connection
  let apiConnectionResult = {
    success: false,
    message: 'API connection failed',
    details: null as any
  };
  
  if (authResult.success) {
    try {
      console.log('Testing API connection...');
      const result = await testApiConnection();
      
      apiConnectionResult = {
        success: result,
        message: result ? 'Successfully connected to the API' : 'Failed to connect to the API',
        details: result ? { success: true } : null
      };
      console.log('API connection test result:', result ? 'successful' : 'failed');
    } catch (error) {
      apiConnectionResult.message = `API connection error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('API connection error:', error);
    }
  } else {
    apiConnectionResult.message = 'Skipped API connection test due to authentication failure';
    console.log('Skipping API connection test due to authentication failure');
  }
  
  // Return results
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    envVars: {
      apiUrl,
      apiKey: !!apiKey,
      apiSecret: !!apiSecret,
      apiVersion
    },
    tests: {
      authentication: {
        success: authResult.success,
        message: authResult.message,
        token: authResult.token
      },
      apiConnection: {
        success: apiConnectionResult.success,
        message: apiConnectionResult.message,
        details: apiConnectionResult.details
      }
    }
  }, { headers: corsHeaders });
} 