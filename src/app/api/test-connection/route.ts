import { NextResponse } from 'next/server';
import { testApiConnection } from '@/lib/server/medicationService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isConnected = await testApiConnection();
    return NextResponse.json({ 
      success: true, 
      isConnected,
      message: isConnected ? 'API connection successful' : 'API connection failed'
    });
  } catch (error) {
    console.error('Error testing API connection:', error);
    return NextResponse.json({ 
      success: false, 
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 