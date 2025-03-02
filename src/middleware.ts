import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Return early if this is a public API route
  if (request.nextUrl.pathname.startsWith('/api/public/')) {
    return NextResponse.next();
  }

  // Continue with default behavior for all other routes
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
}; 