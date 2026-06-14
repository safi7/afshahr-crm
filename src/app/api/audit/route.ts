import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const VALID_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];

export async function GET(request: NextRequest) {
  if (request.headers.get('x-user-role') !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));
  const action = searchParams.get('action') ?? '';
  const entityType = searchParams.get('entityType') ?? '';

  const supabase = createServerClient();
  let query = supabase
    .from('audit_logs')
    .select('*, admin:admins(id, username, full_name)', { count: 'exact' });

  if (action && VALID_ACTIONS.includes(action)) {
    query = query.eq('action', action);
  }
  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, pageSize });
}
