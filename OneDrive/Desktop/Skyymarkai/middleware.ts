import { NextRequest, NextResponse } from 'next/server';

const ONBOARDING_PATHS = [
  '/onboarding',
  '/onboarding/profile',
  '/onboarding/workspace',
  '/onboarding/team',
  '/onboarding/connect',
  '/onboarding/agents',
  '/onboarding/first_run',
  '/onboarding/finish',
];

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for static assets, API routes, and public paths
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/api') || 
      pathname.startsWith('/static') ||
      PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow founders full access - check for founder cookie/header
  const isFounder = req.cookies.get('isFounder')?.value === 'true';
  if (isFounder || pathname.startsWith('/founder')) {
    return NextResponse.next();
  }

  // For non-founders, check onboarding state
  const userId = req.cookies.get('userId')?.value;
  if (!userId) {
    // No user ID, allow public routes or redirect to login
    if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/login')) {
      return NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Check onboarding completion status
  let state = 'profile';
  try {
    const apiUrl = `${req.nextUrl.origin}/api/onboarding/state?userId=${userId}`;
    const resp = await fetch(apiUrl);
    if (resp.ok) {
      const data = await resp.json();
      state = data.state || 'profile';
    }
  } catch (e) {
    // Allow access on error - don't block the app
    return NextResponse.next();
  }

  // If not done, guide to onboarding (but don't force)
  if (state !== 'done' && !ONBOARDING_PATHS.some(p => pathname.startsWith(p))) {
    // For now, allow access but could redirect to onboarding
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|static|favicon.ico).*)'],
};
