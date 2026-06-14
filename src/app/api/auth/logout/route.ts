import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/helpers/audit';

const COOKIE_NAME = 'afshaar_token';

export async function POST(request: NextRequest) {
  const adminId = request.headers.get('x-user-id');
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  if (adminId) {
    await logAudit({
      adminId,
      action: 'LOGOUT',
      entityType: 'session',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });
  }

  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
