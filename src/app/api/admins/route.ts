import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createServerClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/helpers/audit';

const createSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  email: z.string().email().max(200),
  full_name: z.string().min(1).max(200),
  password: z.string().min(8).max(200),
  role: z.enum(['admin', 'super_admin']).default('admin'),
});

function requireSuperAdmin(request: NextRequest): NextResponse | null {
  if (request.headers.get('x-user-role') !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = requireSuperAdmin(request);
  if (denied) return denied;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('admins')
    .select('id, username, email, full_name, role, is_active, last_login_at, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const denied = requireSuperAdmin(request);
  if (denied) return denied;

  const adminId = request.headers.get('x-user-id')!;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { password, ...adminData } = parsed.data;
  const password_hash = await bcrypt.hash(password, 12);

  const supabase = createServerClient();
  const { data: created, error } = await supabase
    .from('admins')
    .insert({ ...adminData, password_hash })
    .select('id, username, email, full_name, role, is_active, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }

  await logAudit({
    adminId,
    action: 'CREATE',
    entityType: 'admin',
    entityId: created.id,
    newValues: { username: created.username, email: created.email, role: created.role },
    ipAddress: ip,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
