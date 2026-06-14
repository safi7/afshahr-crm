import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();

  const [
    { count: total },
    { count: pending },
    { count: active },
    { count: disabled },
    { count: rejected },
    { data: recentPending },
  ] = await Promise.all([
    supabase.from('vendors').select('id', { count: 'exact', head: true }),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('status', 'disabled'),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase
      .from('vendors')
      .select('id, store_name, owner_name, email, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    data: {
      total: total ?? 0,
      pending: pending ?? 0,
      active: active ?? 0,
      disabled: disabled ?? 0,
      rejected: rejected ?? 0,
      recentPending: recentPending ?? [],
    },
  });
}
