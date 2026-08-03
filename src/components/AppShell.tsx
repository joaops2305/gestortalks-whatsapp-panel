'use client';

import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import WebhookRoundedIcon from '@mui/icons-material/WebhookRounded';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { AppBar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useThemeMode } from '@/context/ThemeModeContext';
import { clearSession, getUser } from '@/services/auth';

const drawerWidth = 260;
const allItems = [
  ['Dashboard', '/', DashboardRoundedIcon, false],
  ['Empresas', '/empresas', BusinessRoundedIcon, true],
  ['Usuários', '/usuarios', PeopleRoundedIcon, true],
  ['Instâncias', '/instancias', PhoneAndroidRoundedIcon, false],
  ['Mensagens', '/mensagens', MessageRoundedIcon, false],
  ['Aplicações', '/aplicacoes', HubRoundedIcon, false],
  ['API Keys', '/api-keys', KeyRoundedIcon, false],
  ['Webhooks', '/webhooks', WebhookRoundedIcon, false],
  ['Métricas', '/metricas', InsightsRoundedIcon, false],
  ['Logs', '/logs', DescriptionRoundedIcon, false],
  ['Configurações', '/configuracoes', SettingsRoundedIcon, false],
  ['Documentação', '/documentacao', MenuBookRoundedIcon, false],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, toggleMode } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = getUser();
  const isSuperAdmin = user?.role === 'superadmin';
  const items = useMemo(() => allItems.filter(([, , , superOnly]) => !superOnly || isSuperAdmin), [isSuperAdmin]);

  const drawer = (
    <>
      <Toolbar sx={{ minHeight: 76 }}>
        <Box>
          <Typography variant="h6" fontWeight={800}>GestorTalks Whats</Typography>
          <Typography variant="caption" color="text.secondary">{isSuperAdmin ? 'Painel global' : user?.name || 'Painel da empresa'}</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2 }}>
        {items.map(([label, href, Icon]) => (
          <ListItemButton key={href} component={Link} href={href} selected={pathname === href} onClick={() => setMobileOpen(false)} sx={{ borderRadius: 2, mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40 }}><Icon fontSize="small" /></ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ ml: { md: `${drawerWidth}px` }, width: { md: `calc(100% - ${drawerWidth}px)` }, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <IconButton sx={{ display: { md: 'none' }, mr: 1 }} onClick={() => setMobileOpen(true)}><MenuRoundedIcon /></IconButton>
          <Typography fontWeight={700} sx={{ flexGrow: 1 }}>{isSuperAdmin ? 'Administração global' : 'Minha empresa'}</Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title={mode === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}><IconButton onClick={toggleMode}>{mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}</IconButton></Tooltip>
            <Tooltip title="Sair"><IconButton onClick={() => { clearSession(); router.replace('/login'); }}><LogoutRoundedIcon /></IconButton></Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' } }}>{drawer}</Drawer>
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}>{drawer}</Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, pt: { xs: 11, md: 12 }, overflow: 'hidden' }}>{children}</Box>
    </Box>
  );
}
