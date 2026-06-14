import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const adminId = request.headers.get('x-user-id');
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('admins')
    .select('id, username, email, full_name, role, is_active, last_login_at, created_at')
    .eq('id', adminId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  if (!data.is_active) return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });

  return NextResponse.json({ data });
}
