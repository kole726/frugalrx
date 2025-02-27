import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server/auth';

export async function GET() {
  try {
    console.log('Testing authentication token...');
    const token = await getAuthToken();
    
    // Only return a partial token for security
    const partialToken = token.substring(0, 15) + '...' + token.substring(token.length - 10);
    
    return NextResponse.json({ 
      success: true, 
      hasToken: !!token,
      partialToken,
      message: 'Authentication token retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting authentication token:', error);
    return NextResponse.json({ 
      success: false, 
      hasToken: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 