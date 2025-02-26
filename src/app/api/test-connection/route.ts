import { NextResponse } from 'next/server';
import { testApiConnection } from '@/lib/server/medicationService';

export async function GET() {
  try {
    const isConnected = await testApiConnection();
    
    return NextResponse.json({
      status: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing API connection:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 