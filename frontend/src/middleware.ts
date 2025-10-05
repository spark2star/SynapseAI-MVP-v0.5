import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get token from cookies
    const token = request.cookies.get('access_token')?.value;

    console.log('🛡️ Middleware:', {
        path: pathname,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });

    // Public paths that don't require authentication
    const publicPaths = ['/', '/landing', '/auth/login', '/auth/signup', '/register', '/auth/forgot-password', '/about', '/contact'];
    const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    // CRITICAL: If authenticated and on login page, redirect to dashboard
    // if (token && pathname.startsWith('/auth/login')) {
    //     console.log('✅ Authenticated user on login page → Redirecting to /dashboard');
    //     return NextResponse.redirect(new URL('/dashboard', request.url));
    // }
    // CRITICAL: If authenticated and on login page, redirect based on role
    if (token && pathname.startsWith('/auth/login')) {
        console.log('✅ Authenticated user on login page → Checking role...');
        
        // Decode JWT to get role (simple way)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload.role || 'doctor';
            const redirectPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';
            
            console.log(`✅ Redirecting ${role} to ${redirectPath}`);
            return NextResponse.redirect(new URL(redirectPath, request.url));
        } catch (error) {
            console.log('⚠️ Could not decode token, redirecting to /dashboard');
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }


    // If on public path, allow access
    if (isPublicPath) {
        console.log('✅ Public path, allowing access');
        return NextResponse.next();
    }

    // Protected paths - require authentication
    if (!token) {
        console.log('❌ No token on protected path → Redirecting to /auth/login');
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ✅ ADD THIS: Allow authenticated users to access dashboard and admin routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
        console.log('✅ Authenticated user accessing protected route');
        return NextResponse.next();
    }

    // Has token, allow access to protected routes
    console.log('✅ Token present, allowing access to protected route');
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

