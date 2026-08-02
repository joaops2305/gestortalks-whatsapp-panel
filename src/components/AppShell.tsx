'use client';

import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Box, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';

const drawerWidth = 260;
const items = [
  ['Dashboard', DashboardRoundedIcon],
  ['Empresas', BusinessRoundedIcon],
  ['Usuários', PeopleRoundedIcon],
  ['Instâncias', PhoneAndroidRoundedIcon],
  ['API Keys', KeyRoundedIcon],
  ['Aplicações', HubRoundedIcon],
  ['Logs', DescriptionRoundedIcon],
  ['Configurações', SettingsRoundedIcon],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' },
        }}
      >
        <Toolbar sx={{ minHeight: 76 }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>GestorTalks Whats</Typography>
            <Typography variant="caption" color="text.secondary">Painel global</Typography>
          </Box>
        </Toolbar>
        <Divider />
        <List sx={{ px: 1.5, py: 2 }}>
          {items.map(([label, Icon], index) => (
            <ListItemButton key={label} selected={index === 0} sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}><Icon fontSize="small" /></ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, overflow: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
}
