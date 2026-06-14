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
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddIcon from '@mui/icons-material/Add';
import MapIcon from '@mui/icons-material/Map';
import NextLink from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDateShort, vendorStatusColor, vendorStatusLabel } from '@/lib/helpers';
import type { Vendor, VendorStatus, BusinessType } from '@/lib/types';

const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Disabled', value: 'disabled' },
  { label: 'Rejected', value: 'rejected' },
];

type NewVendorForm = {
  store_name: string;
  owner_name: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  business_type: BusinessType | '';
  address: string;
  description: string;
  status: 'active' | 'pending';
};

const EMPTY_VENDOR: NewVendorForm = {
  store_name: '',
  owner_name: '',
  email: '',
  username: '',
  password: '',
  phone: '',
  business_type: '',
  address: '',
  description: '',
  status: 'active',
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const refresh = () => setRefreshCount((c) => c + 1);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newVendor, setNewVendor] = useState<NewVendorForm>(EMPTY_VENDOR);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<Vendor | null>(null);
  const [disableDialog, setDisableDialog] = useState<Vendor | null>(null);
  const [enableDialog, setEnableDialog] = useState<Vendor | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Vendor | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ vendor: Vendor; reason: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch vendors
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const params = new URLSearchParams({
          page: String(page + 1),
          pageSize: String(pageSize),
        });
        if (search.trim()) params.set('search', search.trim());
        if (statusFilter) params.set('status', statusFilter);

        const res = await fetch(`/api/vendors?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        if (!cancelled) {
          setVendors(json.data ?? []);
          setTotal(json.total ?? 0);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load vendors');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(load, search ? 300 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [page, pageSize, statusFilter, search, refreshCount]);

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(0);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleVendorAction = async (vendorId: string, status: VendorStatus, rejectionReason?: string) => {
    setActionLoading(true);
    try {
      const body: Record<string, string> = { status };
      if (rejectionReason) body.rejection_reason = rejectionReason;

      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error);
      }
      setConfirmDialog(null);
      setDisableDialog(null);
      setEnableDialog(null);
      setRejectDialog(null);
      refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (vendorId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, { method: 'DELETE' });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      setDeleteDialog(null);
      refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      const body: Record<string, string> = {
        store_name: newVendor.store_name,
        owner_name: newVendor.owner_name,
        email: newVendor.email,
        username: newVendor.username,
        password: newVendor.password,
        status: newVendor.status,
      };
      if (newVendor.phone) body.phone = newVendor.phone;
      if (newVendor.business_type) body.business_type = newVendor.business_type;
      if (newVendor.address) body.address = newVendor.address;
      if (newVendor.description) body.description = newVendor.description;

      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setCreateError(json.error ?? 'Failed to create vendor'); return; }
      setCreateOpen(false);
      setNewVendor(EMPTY_VENDOR);
      refresh();
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Vendors"
        subtitle="Manage store applications and account status"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Vendors' }]}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button component={NextLink} href="/vendors/map" variant="outlined" startIcon={<MapIcon />}>
              Map
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Add Vendor
            </Button>
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ px: 2, pt: 1 }}>
          <Tabs
            value={statusFilter}
            onChange={(_, v) => handleStatusChange(v as string)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {STATUS_TABS.map((tab) => (
              <Tab key={tab.value} label={tab.label} value={tab.value} />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ px: 2, pb: 2 }}>
          <TextField
            placeholder="Search by store name, owner, or email…"
            value={search}
            onChange={handleSearch}
            size="small"
            sx={{ width: { xs: '100%', sm: 360 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Store Name</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Owner</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Applied</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No vendors found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{v.store_name}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {v.owner_name}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {v.email}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      {v.business_type ? (
                        <Chip
                          label={v.business_type}
                          size="small"
                          color={v.business_type === 'company' ? 'primary' : 'default'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vendorStatusLabel(v.status)}
                        size="small"
                        color={vendorStatusColor(v.status)}
                      />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {formatDateShort(v.created_at)}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {v.status === 'pending' && (
                        <>
                          <Tooltip title="Confirm (Approve)">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => setConfirmDialog(v)}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setRejectDialog({ vendor: v, reason: '' })}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {v.status === 'active' && (
                        <Tooltip title="Disable">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => setDisableDialog(v)}
                          >
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {v.status === 'disabled' && (
                        <Tooltip title="Enable">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => setEnableDialog(v)}
                          >
                            <LockOpenIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog(v)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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

      {/* Confirm dialog */}
      <ConfirmDialog
        open={Boolean(confirmDialog)}
        title="Confirm Vendor"
        message={`Approve "${confirmDialog?.store_name}" and activate their store? They will be able to list products and sell.`}
        confirmLabel="Confirm & Activate"
        loading={actionLoading}
        onConfirm={() => confirmDialog && handleVendorAction(confirmDialog.id, 'active')}
        onCancel={() => setConfirmDialog(null)}
      />

      {/* Disable dialog */}
      <ConfirmDialog
        open={Boolean(disableDialog)}
        title="Disable Vendor"
        message={`Disable "${disableDialog?.store_name}"? Their store will be inaccessible until re-enabled.`}
        confirmLabel="Disable"
        danger
        loading={actionLoading}
        onConfirm={() => disableDialog && handleVendorAction(disableDialog.id, 'disabled')}
        onCancel={() => setDisableDialog(null)}
      />

      {/* Enable dialog */}
      <ConfirmDialog
        open={Boolean(enableDialog)}
        title="Enable Vendor"
        message={`Re-enable "${enableDialog?.store_name}"? Their store will become accessible again.`}
        confirmLabel="Enable"
        loading={actionLoading}
        onConfirm={() => enableDialog && handleVendorAction(enableDialog.id, 'active')}
        onCancel={() => setEnableDialog(null)}
      />

      {/* Delete dialog */}
      <ConfirmDialog
        open={Boolean(deleteDialog)}
        title="Delete Vendor"
        message={`Permanently delete "${deleteDialog?.store_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={actionLoading}
        onConfirm={() => deleteDialog && handleDelete(deleteDialog.id)}
        onCancel={() => setDeleteDialog(null)}
      />

      {/* Create vendor dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Vendor</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <Box
            component="form"
            id="create-vendor-form"
            onSubmit={handleCreate}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Store Name"
                  value={newVendor.store_name}
                  onChange={(e) => setNewVendor((p) => ({ ...p, store_name: e.target.value }))}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Owner Name"
                  value={newVendor.owner_name}
                  onChange={(e) => setNewVendor((p) => ({ ...p, owner_name: e.target.value }))}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor((p) => ({ ...p, email: e.target.value }))}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Phone"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor((p) => ({ ...p, phone: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Username"
                  value={newVendor.username}
                  onChange={(e) => setNewVendor((p) => ({ ...p, username: e.target.value }))}
                  required
                  fullWidth
                  helperText="Letters, numbers, and underscores only"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Password"
                  type="password"
                  value={newVendor.password}
                  onChange={(e) => setNewVendor((p) => ({ ...p, password: e.target.value }))}
                  required
                  fullWidth
                  helperText="Minimum 8 characters"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Business Type</InputLabel>
                  <Select
                    value={newVendor.business_type}
                    label="Business Type"
                    onChange={(e) =>
                      setNewVendor((p) => ({ ...p, business_type: e.target.value as BusinessType | '' }))
                    }
                  >
                    <MenuItem value="">
                      <em>Not specified</em>
                    </MenuItem>
                    <MenuItem value="individual">Individual</MenuItem>
                    <MenuItem value="company">Company</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newVendor.status}
                    label="Status"
                    onChange={(e) =>
                      setNewVendor((p) => ({ ...p, status: e.target.value as 'active' | 'pending' }))
                    }
                  >
                    <MenuItem value="active">Active (auto-confirmed)</MenuItem>
                    <MenuItem value="pending">Pending (requires review)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Address"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor((p) => ({ ...p, address: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Description"
                  value={newVendor.description}
                  onChange={(e) => setNewVendor((p) => ({ ...p, description: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => { setCreateOpen(false); setNewVendor(EMPTY_VENDOR); setCreateError(null); }}
            disabled={createLoading}
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="create-vendor-form"
            variant="contained"
            loading={createLoading}
          >
            Add Vendor
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Reject dialog — needs rejection reason */}
      <Dialog
        open={Boolean(rejectDialog)}
        onClose={() => setRejectDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Vendor</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide a reason for rejecting <strong>{rejectDialog?.vendor.store_name}</strong>.
          </Typography>
          <TextField
            label="Rejection Reason"
            value={rejectDialog?.reason ?? ''}
            onChange={(e) =>
              setRejectDialog((d) => d ? { ...d, reason: e.target.value } : null)
            }
            multiline
            rows={3}
            fullWidth
            required
            placeholder="e.g. Incomplete documentation, invalid business information…"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialog(null)} disabled={actionLoading}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color="error"
            loading={actionLoading}
            disabled={!rejectDialog?.reason?.trim()}
            onClick={() =>
              rejectDialog &&
              handleVendorAction(rejectDialog.vendor.id, 'rejected', rejectDialog.reason)
            }
          >
            Reject
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
