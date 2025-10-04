import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get token from cookies or check if it exists
    const token = request.cookies.get('access_token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '');

    // Public routes that don't require authentication
    const publicRoutes = ['/auth/login', '/register', '/auth/forgot-password', '/'];

    // Check if current path is public
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // If no token and trying to access protected route, redirect to login
    if (!token && !isPublicRoute) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
        // In a real app, you'd decode the JWT to check the role
        // For now, we'll rely on backend validation
        // The frontend will handle the redirect after login based on role
        if (!token) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
    }

    // Doctor routes protection
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/doctor')) {
        if (!token) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
};

