'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

const DRAWER_WIDTH = 256;

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header
        onMenuClick={() => setMobileOpen(true)}
        desktopSidebarOpen={desktopOpen}
        onDesktopToggle={() => setDesktopOpen((prev) => !prev)}
      />
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} desktopOpen={desktopOpen} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: desktopOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
