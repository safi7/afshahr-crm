import dayjs from 'dayjs';
import type { VendorStatus } from '@/lib/types';

export function formatDate(date: string | null, format = 'MMM D, YYYY HH:mm'): string {
  if (!date) return '—';
  return dayjs(date).format(format);
}

export function formatDateShort(date: string | null): string {
  if (!date) return '—';
  return dayjs(date).format('MMM D, YYYY');
}

export function vendorStatusColor(
  status: VendorStatus
): 'warning' | 'success' | 'default' | 'error' {
  switch (status) {
    case 'pending':  return 'warning';
    case 'active':   return 'success';
    case 'disabled': return 'default';
    case 'rejected': return 'error';
  }
}

export function vendorStatusLabel(status: VendorStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
