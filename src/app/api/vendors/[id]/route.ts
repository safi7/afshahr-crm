import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/helpers/audit';

const patchSchema = z.object({
  status: z.enum(['active', 'disabled', 'rejected']),
  rejection_reason: z.string().max(500).optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase.from('vendors').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { status, rejection_reason } = parsed.data;
  const supabase = createServerClient();

  const { data: vendor, error: fetchError } = await supabase
    .from('vendors')
    .select('id, status, store_name')
    .eq('id', id)
    .single();

  if (fetchError || !vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  const updateData: Record<string, unknown> = { status };

  // First-time confirmation from pending → active: record who confirmed and when
  if (status === 'active' && vendor.status === 'pending') {
    updateData.confirmed_by = adminId;
    updateData.confirmed_at = new Date().toISOString();
  }
  if (status === 'rejected' && rejection_reason) {
    updateData.rejection_reason = rejection_reason;
  }

  const { data: updated, error: updateError } = await supabase
    .from('vendors')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });

  await logAudit({
    adminId,
    action: 'UPDATE',
    entityType: 'vendor',
    entityId: id,
    oldValues: { status: vendor.status },
    newValues: { status, ...(status === 'rejected' && { rejection_reason }) },
    ipAddress: ip,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminId = request.headers.get('x-user-id')!;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  const supabase = createServerClient();

  const { data: vendor, error: fetchError } = await supabase
    .from('vendors')
    .select('id, store_name, status')
    .eq('id', id)
    .single();

  if (fetchError || !vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  // Log before deletion so the record still exists for FK integrity during logging
  await logAudit({
    adminId,
    action: 'DELETE',
    entityType: 'vendor',
    entityId: id,
    oldValues: { store_name: vendor.store_name, status: vendor.status },
    ipAddress: ip,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  const { error } = await supabase.from('vendors').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });

  return NextResponse.json({ message: 'Vendor deleted' });
}
