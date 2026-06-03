import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define route matching for protected pages
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/chat');

  if (isProtectedRoute) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      // Redirect to sign-in if token is missing
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages (sign-in/sign-up)
  const isAuthRoute = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  if (isAuthRoute) {
    const token = request.cookies.get('token')?.value;
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
