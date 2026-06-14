'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useAuthStore } from '@/stores/authStore';

const DRAWER_WIDTH = 256;

interface Props {
  onMenuClick: () => void;
  desktopSidebarOpen: boolean;
  onDesktopToggle: () => void;
}

export function Header({ onMenuClick, desktopSidebarOpen, onDesktopToggle }: Props) {
  const { admin, clearAuth } = useAuthStore();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await fetch('/api/auth/logout', { method: 'POST' });
    clearAuth();
    router.push('/login');
  };

  const initials = admin?.full_name
    ? admin.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : admin?.username?.slice(0, 2).toUpperCase() ?? 'A';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        width: { xs: '100%', md: desktopSidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
        ml: { md: desktopSidebarOpen ? `${DRAWER_WIDTH}px` : 0 },
        transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1), margin-left 225ms cubic-bezier(0.4, 0, 0.6, 1)',
      }}
    >
      <Toolbar>
        <IconButton onClick={onMenuClick} edge="start" sx={{ mr: 1, display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>
        <IconButton onClick={onDesktopToggle} edge="start" sx={{ mr: 2, display: { xs: 'none', md: 'inline-flex' } }}>
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ flexGrow: 1 }}>
          Afshaar CRM
        </Typography>

        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
            {initials}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{ paper: { elevation: 2, sx: { mt: 1, minWidth: 200 } } }}
        >
          <MenuItem disabled sx={{ opacity: '1 !important' }}>
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            <Typography variant="body2">
              <strong>{admin?.full_name ?? admin?.username}</strong>
              <br />
              <span style={{ color: '#64748b', fontSize: 12 }}>
                {admin?.role?.replace('_', ' ')}
              </span>
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
            <Typography variant="body2" color="error">
              Logout
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
