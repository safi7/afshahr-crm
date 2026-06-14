'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyIcon from '@mui/icons-material/Key';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuthStore } from '@/stores/authStore';
import { formatDate } from '@/lib/helpers';
import type { Admin } from '@/lib/types';

type NewAdminForm = {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: 'admin' | 'super_admin';
};

export default function AdminsPage() {
  const { admin: currentAdmin } = useAuthStore();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const refresh = () => setRefreshCount((c) => c + 1);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState<NewAdminForm>({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'admin',
  });

  // Reset password dialog
  const [resetDialog, setResetDialog] = useState<Admin | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Toggle active / delete
  const [toggleDialog, setToggleDialog] = useState<Admin | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Admin | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/admins')
      .then((r) => r.json())
      .then(({ data, error: e }) => {
        if (e) throw new Error(e);
        setAdmins(data ?? []);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load admins'))
      .finally(() => setLoading(false));
  }, [refreshCount]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });
      const json = await res.json();
      if (!res.ok) { setCreateError(json.error ?? 'Failed to create admin'); return; }
      setCreateOpen(false);
      setNewAdmin({ username: '', email: '', full_name: '', password: '', role: 'admin' });
      refresh();
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetDialog) return;
    if (resetPassword !== resetConfirm) {
      setResetError('Passwords do not match');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    try {
      const res = await fetch(`/api/admins/${resetDialog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: resetPassword }),
      });
      const json = await res.json();
      if (!res.ok) { setResetError(json.error ?? 'Failed to reset password'); return; }
      setResetDialog(null);
      setResetPassword('');
      setResetConfirm('');
    } catch {
      setResetError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleDialog) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admins/${toggleDialog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !toggleDialog.is_active }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      setToggleDialog(null);
      refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Action failed');
      setToggleDialog(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admins/${deleteDialog.id}`, { method: 'DELETE' });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      setDeleteDialog(null);
      refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete admin');
      setDeleteDialog(null);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Admins"
        subtitle="Manage CRM admin accounts"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admins' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            New Admin
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Username</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : admins.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{a.full_name}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontFamily: 'monospace' }}>
                    {a.username}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{a.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={a.role.replace('_', ' ')}
                      size="small"
                      color={a.role === 'super_admin' ? 'primary' : 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={a.is_active ? 'Active' : 'Disabled'}
                      size="small"
                      color={a.is_active ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    {a.last_login_at ? formatDate(a.last_login_at, 'MMM D, YYYY HH:mm') : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {a.id !== currentAdmin?.id && (
                      <>
                        <Tooltip title="Reset Password">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setResetDialog(a);
                              setResetPassword('');
                              setResetConfirm('');
                              setResetError(null);
                            }}
                          >
                            <KeyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={a.is_active ? 'Disable' : 'Enable'}>
                          <IconButton
                            size="small"
                            color={a.is_active ? 'warning' : 'success'}
                            onClick={() => setToggleDialog(a)}
                          >
                            {a.is_active ? (
                              <BlockIcon fontSize="small" />
                            ) : (
                              <CheckCircleIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog(a)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create admin dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Admin</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <Box
            component="form"
            id="create-admin-form"
            onSubmit={handleCreate}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
          >
            <TextField
              label="Full Name"
              value={newAdmin.full_name}
              onChange={(e) => setNewAdmin((p) => ({ ...p, full_name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Username"
              value={newAdmin.username}
              onChange={(e) => setNewAdmin((p) => ({ ...p, username: e.target.value }))}
              required
              fullWidth
              helperText="Letters, numbers, and underscores only"
            />
            <TextField
              label="Email"
              type="email"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin((p) => ({ ...p, email: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={newAdmin.password}
              onChange={(e) => setNewAdmin((p) => ({ ...p, password: e.target.value }))}
              required
              fullWidth
              helperText="Minimum 8 characters"
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newAdmin.role}
                label="Role"
                onChange={(e) =>
                  setNewAdmin((p) => ({ ...p, role: e.target.value as typeof newAdmin.role }))
                }
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="super_admin">Super Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={createLoading}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="create-admin-form"
            variant="contained"
            loading={createLoading}
          >
            Create Admin
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog
        open={Boolean(resetDialog)}
        onClose={() => setResetDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set a new password for <strong>{resetDialog?.full_name}</strong>.
          </Typography>
          {resetError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resetError}
            </Alert>
          )}
          <Box
            component="form"
            id="reset-password-form"
            onSubmit={handleResetPassword}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label="New Password"
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              required
              fullWidth
              helperText="Minimum 8 characters"
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              required
              fullWidth
              error={resetConfirm.length > 0 && resetPassword !== resetConfirm}
              helperText={
                resetConfirm.length > 0 && resetPassword !== resetConfirm
                  ? 'Passwords do not match'
                  : ' '
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetDialog(null)} disabled={resetLoading}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="reset-password-form"
            variant="contained"
            loading={resetLoading}
            disabled={!resetPassword || resetPassword !== resetConfirm}
          >
            Reset Password
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Toggle active confirm */}
      <ConfirmDialog
        open={Boolean(toggleDialog)}
        title={toggleDialog?.is_active ? 'Disable Admin' : 'Enable Admin'}
        message={
          toggleDialog?.is_active
            ? `Disable ${toggleDialog?.full_name}? They will no longer be able to log in.`
            : `Enable ${toggleDialog?.full_name}? They will be able to log in again.`
        }
        confirmLabel={toggleDialog?.is_active ? 'Disable' : 'Enable'}
        danger={toggleDialog?.is_active}
        loading={actionLoading}
        onConfirm={handleToggleActive}
        onCancel={() => setToggleDialog(null)}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteDialog)}
        title="Delete Admin"
        message={`Permanently delete ${deleteDialog?.full_name}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(null)}
      />
    </Box>
  );
}
