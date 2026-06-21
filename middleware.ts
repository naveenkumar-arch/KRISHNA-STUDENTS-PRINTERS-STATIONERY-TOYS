import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 1. If not authenticated, the authorized callback will redirect to login (except for public pages)
    if (!token) {
      if (
        path.startsWith('/auth/login') ||
        path.startsWith('/auth/register') ||
        path.startsWith('/auth/forgot-password')
      ) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // 2. Redirect authenticated users away from public authentication forms
    if (
      path.startsWith('/auth/login') ||
      path.startsWith('/auth/register') ||
      path.startsWith('/auth/forgot-password')
    ) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 3. Prevent access if account is suspended
    if (token.isSuspended) {
      return NextResponse.redirect(new URL('/auth/error?error=Suspended', req.url));
    }

    const isAdminPath = path.startsWith('/secure-admin-dashboard') || path.startsWith('/admin');
    const isTotpPath = path.startsWith('/auth/totp-setup') || path.startsWith('/auth/totp-verify');
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(token?.role as string);

    // 4. Admin dashboards role security and 2FA checks
    if (isAdminPath) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/auth/error?error=AccessDenied', req.url));
      }

      // Enforce 2FA strictly for ADMIN and SUPER_ADMIN
      if (token.role === 'SUPER_ADMIN' || token.role === 'ADMIN') {
        if (token.needsTotpSetup) {
          return NextResponse.redirect(new URL('/auth/totp-setup', req.url));
        }
        if (token.needsTotpVerify) {
          return NextResponse.redirect(new URL('/auth/totp-verify', req.url));
        }
      }
    }

    // 5. Secure TOTP endpoints / pages
    if (isTotpPath) {
      // Must be an administrative role (excluding MANAGER if manager has no 2FA)
      if (!isAdmin || token.role === 'MANAGER') {
        return NextResponse.redirect(new URL('/', req.url));
      }

      // Prevent redirect loops
      if (token.needsTotpSetup && path === '/auth/totp-verify') {
        return NextResponse.redirect(new URL('/auth/totp-setup', req.url));
      }
      if (token.needsTotpVerify && path === '/auth/totp-setup') {
        return NextResponse.redirect(new URL('/auth/totp-verify', req.url));
      }
      if (!token.needsTotpSetup && !token.needsTotpVerify) {
        return NextResponse.redirect(new URL('/secure-admin-dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Bypass NextAuth's default redirect-to-signin behavior for public forms
        if (
          path.startsWith('/auth/login') ||
          path.startsWith('/auth/register') ||
          path.startsWith('/auth/forgot-password')
        ) {
          return true; // Let the middleware handle them
        }

        // Require authentication for all other matched endpoints
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/account/:path*',
    '/orders/:path*',
    '/checkout/:path*',
    '/admin/:path*',
    '/secure-admin-dashboard/:path*',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/totp-setup',
    '/auth/totp-verify',
  ],
};
