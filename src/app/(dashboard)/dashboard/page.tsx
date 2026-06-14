'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import StorefrontIcon from '@mui/icons-material/Storefront';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PageHeader } from '@/components/PageHeader';
import { StatsCard } from '@/components/Dashboard/StatsCard';
import { formatDateShort, vendorStatusColor, vendorStatusLabel } from '@/lib/helpers';
import type { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then(({ data }) => setStats(data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your vendor management platform"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Vendors',
            value: stats?.total ?? 0,
            icon: <StorefrontIcon fontSize="medium" />,
            color: '#0f766e',
          },
          {
            title: 'Pending Review',
            value: stats?.pending ?? 0,
            icon: <HourglassEmptyIcon fontSize="medium" />,
            color: '#d97706',
          },
          {
            title: 'Active Vendors',
            value: stats?.active ?? 0,
            icon: <CheckCircleIcon fontSize="medium" />,
            color: '#16a34a',
          },
          {
            title: 'Disabled',
            value: stats?.disabled ?? 0,
            icon: <BlockIcon fontSize="medium" />,
            color: '#64748b',
          },
        ].map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard loading={loading} {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Recent pending vendors */}
      <Card>
        <CardHeader
          title="Pending Vendors"
          subheader="Stores "
          action={
            <Button
              component={NextLink}
              href="/vendors?status=pending"
              endIcon={<ArrowForwardIcon />}
              size="small"
            >
              View all
            </Button>
          }
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Store Name</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Owner</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Applied</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (stats?.recentPending ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No pending vendors
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (stats?.recentPending ?? []).map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{v.store_name}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {v.owner_name}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {v.email}
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
