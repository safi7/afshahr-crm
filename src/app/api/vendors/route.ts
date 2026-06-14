import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createServerClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/helpers/audit';

const VALID_STATUSES = ['pending', 'active', 'disabled', 'rejected'];

const createSchema = z.object({
  store_name: z.string().min(1, 'Store name is required').max(200),
  owner_name: z.string().min(1, 'Owner name is required').max(200),
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  phone: z.string().max(50).optional(),
  business_type: z.enum(['individual', 'company']).optional(),
  address: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'pending']).default('active'),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));
  const status = searchParams.get('status') ?? '';
  const search = (searchParams.get('search') ?? '').trim();

  const supabase = createServerClient();
  let query = supabase.from('vendors').select('*', { count: 'exact' });

  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(
      `store_name.ilike.%${search}%,owner_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, pageSize });
}

export async function POST(request: NextRequest) {
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

  const { status, password, ...fields } = parsed.data;
  const password_hash = await bcrypt.hash(password, 12);
  const supabase = createServerClient();

  const insertData: Record<string, unknown> = { ...fields, status, password_hash };

  if (status === 'active') {
    insertData.confirmed_by = adminId;
    insertData.confirmed_at = new Date().toISOString();
  }

  const { data: vendor, error: insertError } = await supabase
    .from('vendors')
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'A vendor with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }

  await logAudit({
    adminId,
    action: 'CREATE',
    entityType: 'vendor',
    entityId: vendor.id,
    newValues: { store_name: vendor.store_name, status: vendor.status },
    ipAddress: ip,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ data: vendor }, { status: 201 });
}
