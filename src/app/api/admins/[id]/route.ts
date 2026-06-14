import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createServerClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/helpers/audit';

const patchSchema = z.object({
  is_active: z.boolean().optional(),
  new_password: z.string().min(8).max(200).optional(),
  email: z.string().email().max(200).optional(),
  full_name: z.string().min(1).max(200).optional(),
});

function requireSuperAdmin(request: NextRequest): NextResponse | null {
  if (request.headers.get('x-user-role') !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireSuperAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const adminId = request.headers.get('x-user-id')!;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { is_active, new_password, email, full_name } = parsed.data;

  if (id === adminId && is_active === false) {
    return NextResponse.json({ error: 'You cannot disable your own account' }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: target, error: fetchError } = await supabase
    .from('admins')
    .select('id, username, is_active, role')
    .eq('id', id)
    .single();

  if (fetchError || !target) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }

  // Guard: cannot disable the last active super_admin
  if (is_active === false && target.role === 'super_admin') {
    const { count } = await supabase
      .from('admins')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'super_admin')
      .eq('is_active', true);

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Cannot disable the only active super admin' },
        { status: 400 }
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  const oldValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};

  if (typeof is_active === 'boolean') {
    updateData.is_active = is_active;
    oldValues.is_active = target.is_active;
    newValues.is_active = is_active;
  }
  if (new_password) {
    updateData.password_hash = await bcrypt.hash(new_password, 12);
    newValues.password_reset = true;
  }
  if (email) { updateData.email = email; newValues.email = email; }
  if (full_name) { updateData.full_name = full_name; newValues.full_name = full_name; }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('admins')
    .update(updateData)
    .eq('id', id)
    .select('id, username, email, full_name, role, is_active, last_login_at, created_at')
    .single();

  if (updateError) return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });

  await logAudit({
    adminId,
    action: 'UPDATE',
    entityType: 'admin',
    entityId: id,
    oldValues: Object.keys(oldValues).length ? oldValues : undefined,
    newValues: Object.keys(newValues).length ? newValues : undefined,
    ipAddress: ip,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireSuperAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const adminId = request.headers.get('x-user-id')!;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  if (id === adminId) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: target, error: fetchError } = await supabase
    .from('admins')
    .select('id, username, role')
    .eq('id', id)
    .single();

  if (fetchError || !target) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }

  // Guard: cannot delete the last super_admin
  if (target.role === 'super_admin') {
    const { count } = await supabase
      .from('admins')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'super_admin');

    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: 'Cannot delete the only super admin' }, { status: 400 });
    }
  }

  await logAudit({
    adminId,
    action: 'DELETE',
    entityType: 'admin',
    entityId: id,
    oldValues: { username: target.username, role: target.role },
    ipAddress: ip,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  const { error } = await supabase.from('admins').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });

  return NextResponse.json({ message: 'Admin deleted' });
}
