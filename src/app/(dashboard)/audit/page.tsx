'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { PageHeader } from '@/components/PageHeader';
import { formatDate } from '@/lib/helpers';
import type { AuditLog } from '@/lib/types';

const ACTION_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  LOGIN: 'default',
  LOGOUT: 'default',
};

const ENTITY_TYPES = ['', 'vendor', 'admin', 'session'];
const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];

function summarizeChanges(log: AuditLog): string {
  if (log.action === 'LOGIN') return 'Logged in';
  if (log.action === 'LOGOUT') return 'Logged out';
  if (log.action === 'DELETE') {
    const name = (log.old_values?.store_name ?? log.old_values?.username ?? '') as string;
    return name ? `Deleted: ${name}` : 'Record deleted';
  }
  if (log.action === 'CREATE') {
    const name = (log.new_values?.username ?? log.new_values?.store_name ?? '') as string;
    return name ? `Created: ${name}` : 'Record created';
  }
  if (log.action === 'UPDATE' && log.old_values && log.new_values) {
    const entries = Object.entries(log.new_values)
      .map(([k, v]) => {
        if (k === 'password_reset') return 'password reset';
        const old = log.old_values?.[k];
        return old !== undefined ? `${k}: ${old} → ${v}` : `${k}: ${v}`;
      })
      .join(', ');
    return entries || 'Updated';
  }
  return '—';
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const params = new URLSearchParams({ page: String(page + 1), pageSize: String(pageSize) });
        if (actionFilter) params.set('action', actionFilter);
        if (entityTypeFilter) params.set('entityType', entityTypeFilter);

        const res = await fetch(`/api/audit?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        if (!cancelled) {
          setLogs(json.data ?? []);
          setTotal(json.total ?? 0);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load audit logs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [page, pageSize, actionFilter, entityTypeFilter, refreshCount]);

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(0);
  };

  return (
    <Box>
      <PageHeader
        title="Audit Log"
        subtitle="Complete history of all admin actions"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Audit Log' }]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={actionFilter}
              label="Action"
              onChange={(e) => handleFilterChange(setActionFilter)(e.target.value)}
            >
              {ACTIONS.map((a) => (
                <MenuItem key={a} value={a}>{a || 'All Actions'}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Entity Type</InputLabel>
            <Select
              value={entityTypeFilter}
              label="Entity Type"
              onChange={(e) => handleFilterChange(setEntityTypeFilter)(e.target.value)}
            >
              {ENTITY_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t || 'All Types'}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Action</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Entity</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Details</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>IP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No audit records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {log.admin?.full_name ?? log.admin?.username ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {log.admin?.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={ACTION_COLORS[log.action] ?? 'default'}
                      />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {log.entity_type}
                      </Typography>
                      {log.entity_id && (
                        <Tooltip title={log.entity_id}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontFamily: 'monospace' }}
                          >
                            {log.entity_id.slice(0, 8)}…
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 280 }}>
                      <Typography variant="body2" noWrap>
                        {summarizeChanges(log)}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ display: { xs: 'none', lg: 'table-cell' }, fontFamily: 'monospace', fontSize: '0.8rem' }}
                    >
                      {log.ip_address ?? '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[pageSize]}
          onPageChange={(_, newPage) => setPage(newPage)}
        />
      </Card>
    </Box>
  );
}
