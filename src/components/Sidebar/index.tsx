'use client';

import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import { useAuthStore } from '@/stores/authStore';

const DRAWER_WIDTH = 256;

interface NavItem {
  label: string;
  path: string;
  Icon: React.ElementType;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  path: '/dashboard', Icon: DashboardRoundedIcon },
  { label: 'Vendors',    path: '/vendors',   Icon: StoreRoundedIcon },
  { label: 'Admins',     path: '/admins',    Icon: PeopleRoundedIcon, superAdminOnly: true },
  { label: 'Audit Log',  path: '/audit',     Icon: HistoryRoundedIcon, superAdminOnly: true },
];

interface Props {
  open: boolean;
  onClose: () => void;
  desktopOpen: boolean;
}

function NavItems({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { admin } = useAuthStore();
  const isSuperAdmin = admin?.role === 'super_admin';

  return (
    <List component="nav" sx={{ px: 1.5, py: 1 }}>
      {NAV_ITEMS.map((item) => {
        if (item.superAdminOnly && !isSuperAdmin) return null;
        const active = pathname === item.path || pathname.startsWith(item.path + '/');
        return (
          <ListItemButton
            key={item.path}
            component={NextLink}
            href={item.path}
            onClick={onClose}
            selected={active}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '& .MuiListItemIcon-root': { color: 'white' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: active ? 'white' : 'text.secondary' }}>
              <item.Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}

function DrawerContent({ onClose }: { onClose: () => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography variant="h6" fontWeight={800} color="primary.main">
          Afshaar
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Vendor Management CRM
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <NavItems onClose={onClose} />
      </Box>
    </Box>
  );
}

export function Sidebar({ open, onClose, desktopOpen }: Props) {
  return (
    <>
      {/* Mobile temporary drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <DrawerContent onClose={onClose} />
      </Drawer>

      {/* Desktop permanent drawer */}
      {desktopOpen && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          <DrawerContent onClose={() => {}} />
        </Drawer>
      )}
    </>
  );
}
