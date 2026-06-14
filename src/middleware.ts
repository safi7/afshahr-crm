import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];
const COOKIE_NAME = 'afshaar_token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isApi = pathname.startsWith('/api/');

  if (isPublic) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token && !isApi) {
      try {
        await verifyToken(token);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // invalid token — fall through to login
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyToken(token);
    const headers = new Headers(request.headers);
    headers.set('x-user-id', payload.userId);
    headers.set('x-user-username', payload.username);
    headers.set('x-user-role', payload.role);
    return NextResponse.next({ request: { headers } });
  } catch {
    if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)'],
};
