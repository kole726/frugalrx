import { NextResponse } from 'next/server';
import { testApiConnection } from '@/lib/server/medicationService';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const isConnected = await testApiConnection();
    return NextResponse.json({
      status: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      useMockData: process.env.USE_MOCK_DATA || 'false',
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error testing API connection:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: `Failed to test API connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 