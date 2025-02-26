import { NextResponse } from 'next/server'
import { testApiConnection } from '@/lib/server/medicationService'

export async function GET() {
  try {
    console.log('Testing API connection...');
    const isConnected = await testApiConnection();
    
    if (isConnected) {
      console.log('API connection successful');
      return NextResponse.json({ status: 'connected' });
    } else {
      console.log('API connection failed');
      return NextResponse.json({ status: 'disconnected' }, { status: 500 });
    }
  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 