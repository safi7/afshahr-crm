import { createServerClient } from '@/lib/supabase/server';

interface AuditParams {
  adminId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.from('audit_logs').insert({
      admin_id: params.adminId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      old_values: params.oldValues ?? null,
      new_values: params.newValues ?? null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    });
  } catch (err) {
    console.error('[audit] Failed to write log:', err);
  }
}
