import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
];

// Public API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth',
  '/api/register', // Route migrated to App Router
];

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.includes(pathname);
}

// Check if API route is public
function isPublicApiRoute(pathname: string): boolean {
  return publicApiRoutes.some(route => pathname.startsWith(route));
}

// Check if user is authenticated
function isAuthenticated(request: NextRequest): boolean {
  // Check NextAuth v5 session cookies
  // NextAuth v5 uses different cookie names depending on environment
  const sessionToken = 
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('__Host-authjs.session-token')?.value;

  return !!sessionToken;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public page routes
  if (isPublicRoute(pathname)) {
    // If user is already authenticated and tries to access login/register, redirect to home
    if (isAuthenticated(request)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Allow access to public API routes
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Check authentication for all other routes
  if (!isAuthenticated(request)) {
    // If it's an API route, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Not authenticated. Please login to continue.' },
        { status: 401 }
      );
    }

    // For page routes, redirect to login with callback URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User authenticated, allow access
  return NextResponse.next();
}

// Configure which routes the proxy should execute
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

