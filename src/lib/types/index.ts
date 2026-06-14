export interface Admin {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export type VendorStatus = 'pending' | 'active' | 'disabled' | 'rejected';
export type BusinessType = 'individual' | 'company';

export interface Vendor {
  id: string;
  username: string | null;
  store_name: string;
  owner_name: string;
  email: string;
  phone: string | null;
  business_type: BusinessType | null;
  address: string | null;
  description: string | null;
  status: VendorStatus;
  latitude: number | null;
  longitude: number | null;
  rejection_reason: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  confirmer?: Pick<Admin, 'id' | 'username' | 'full_name'>;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin?: Pick<Admin, 'id' | 'username' | 'full_name'>;
}

export interface DashboardStats {
  total: number;
  pending: number;
  active: number;
  disabled: number;
  rejected: number;
  recentPending: Pick<Vendor, 'id' | 'store_name' | 'owner_name' | 'email' | 'status' | 'created_at'>[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
