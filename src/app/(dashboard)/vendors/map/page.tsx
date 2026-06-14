'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import NextLink from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PageHeader } from '@/components/PageHeader';
import type { Vendor } from '@/lib/types';

const VendorsMap = dynamic(
  () => import('@/components/VendorsMap').then((m) => m.VendorsMap),
  { ssr: false }
);

export default function VendorMapPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/vendors?pageSize=100&status=active')
      .then((r) => r.json())
      .then(({ data, error: e }) => {
        if (e) throw new Error(e);
        setVendors((data ?? []).filter((v: Vendor) => v.latitude != null && v.longitude != null));
      })
      .catch(() => setError('Failed to load vendors'))
      .finally(() => setLoading(false));
  }, []);

  const pinCount = vendors.length;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Vendor Map"
        subtitle={loading ? 'Loading…' : `${pinCount} vendor${pinCount !== 1 ? 's' : ''} with location`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Vendors', href: '/vendors' },
          { label: 'Map' },
        ]}
        actions={
          <Button component={NextLink} href="/vendors" startIcon={<ArrowBackIcon />} size="small">
            Back to list
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && pinCount === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No active vendors have set their location yet.
        </Alert>
      )}

      <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', height: 600 }}>
        {loading ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
            <Typography color="text.secondary">Loading map…</Typography>
          </Box>
        ) : (
          <VendorsMap vendors={vendors} />
        )}
      </Box>
    </Box>
  );
}
