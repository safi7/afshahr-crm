'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import MuiLink from '@mui/material/Link';
import NextLink from 'next/link';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: Props) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb, i) =>
            crumb.href ? (
              <MuiLink
                key={i}
                component={NextLink}
                href={crumb.href}
                underline="hover"
                variant="body2"
                color="text.secondary"
              >
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography key={i} variant="body2" color="text.primary">
                {crumb.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
      </Box>
    </Box>
  );
}
