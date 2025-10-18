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
    const publicPaths = [
        '/',
        '/landing',
        '/auth/login',
        '/auth/signup',
        '/register',
        '/auth/forgot-password',
        '/auth/change-password',
        '/about',
        '/contact',
        '/Logo-MVP-v0.5.png',
        '/_next',
        '/demo',
        '/request-demo',
        '/favicon.ico',
        '/api',
        '/invite',  // Add invitation acceptance route as public
    ];
    const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

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

    // Decode JWT to get user information
    let userPayload: any;
    try {
        userPayload = JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        console.log('⚠️ Could not decode token, redirecting to login');
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const role = userPayload.role || 'doctor';
    const passwordResetRequired = userPayload.password_reset_required || false;
    const profileCompleted = userPayload.profile_completed !== false; // Default to true for non-doctors

    console.log('🔍 User info:', {
        role,
        passwordResetRequired,
        profileCompleted,
        pathname
    });

    // Step 1: Check password reset requirement (applies to all roles)
    if (passwordResetRequired) {
        if (!pathname.startsWith('/change-password')) {
            console.log('🔒 Password reset required → Redirecting to /change-password');
            return NextResponse.redirect(new URL('/change-password', request.url));
        }
        // Allow access to change-password page
        return NextResponse.next();
    }

    // Step 2: Check profile completion (doctors only)
    if (role === 'doctor' && !profileCompleted) {
        if (!pathname.startsWith('/doctor/complete-profile')) {
            console.log('📝 Profile not completed → Redirecting to /doctor/complete-profile');
            return NextResponse.redirect(new URL('/doctor/complete-profile', request.url));
        }
        // Allow access to complete-profile page
        return NextResponse.next();
    }

    // Step 3: If authenticated and on login page, redirect based on role
    if (pathname.startsWith('/auth/login')) {
        console.log('✅ Authenticated user on login page → Checking role...');
        const redirectPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';
        console.log(`✅ Redirecting ${role} to ${redirectPath}`);
        return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Step 4: Allow access to dashboard and admin routes for authenticated users
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/doctor')) {
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
         * - any file with an extension (.*\\..*) - covers all static assets like images, fonts, etc.
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
};


