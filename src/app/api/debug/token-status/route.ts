import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/server/auth';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get the current token status
    const token = await getAuthToken();
    
    // Return token info
    return NextResponse.json({
      status: 'success',
      message: 'Token retrieved successfully',
      tokenLength: token.length,
      tokenPreview: `${token.substring(0, 10)}...${token.substring(token.length - 10)}`
    });
  } catch (error) {
    console.error('Error in token status endpoint:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error getting token status'
      },
      { status: 500 }
    );
  }
} 