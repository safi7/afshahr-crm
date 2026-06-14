import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createServerClient } from '@/lib/supabase/server';
import { signToken, getCookieOptions } from '@/lib/auth/session';
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rateLimit';
import { logAudit } from '@/lib/helpers/audit';

const COOKIE_NAME = 'afshaar_token';

const schema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const rateCheck = checkRateLimit(`login:${ip}`);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((rateCheck.remainingMs ?? 0) / 60000)} minutes.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials format' }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const supabase = createServerClient();

  const { data: admin, error } = await supabase
    .from('admins')
    .select('id, username, email, full_name, role, is_active, password_hash')
    .eq('username', username)
    .single();

  if (error || !admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  if (!admin.is_active) {
    return NextResponse.json(
      { error: 'Account is disabled. Contact your administrator.' },
      { status: 403 }
    );
  }

  resetRateLimit(`login:${ip}`);

  await supabase.from('admins').update({ last_login_at: new Date().toISOString() }).eq('id', admin.id);

  await logAudit({
    adminId: admin.id,
    action: 'LOGIN',
    entityType: 'session',
    ipAddress: ip,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  const token = await signToken({ userId: admin.id, username: admin.username, role: admin.role });

  const res = NextResponse.json({
    data: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
    },
  });
  res.cookies.set(COOKIE_NAME, token, getCookieOptions());
  return res;
}
