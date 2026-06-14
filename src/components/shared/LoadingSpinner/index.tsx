'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

interface Props {
  fullScreen?: boolean;
  message?: string;
}

export function LoadingSpinner({ fullScreen, message }: Props) {
  if (fullScreen) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress color="primary" />
        {message && (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress color="primary" />
    </Box>
  );
}
