'use client';

import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { api } from '@/services/api';
import { getToken, getUser, updateStoredUser, type AuthUser } from '@/services/auth';
import { notifyError, notifySuccess } from '@/services/notifications';

export default function PerfilPage() {
  const [user, setUser] = useState<AuthUser | null>(() => getUser());
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const token = getToken() ?? '';

  useEffect(() => {
    void api.get('/api/auth/me', { skipGlobalSuccess: true } as any).then((response) => {
      const current = response.data?.user as AuthUser;
      if (!current) return;
      setUser(current);
      setName(current.name);
      setEmail(current.email);
      updateStoredUser(current);
    }).catch(() => undefined);
  }, []);

  const initials = useMemo(() => (user?.name || 'U').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(), [user?.name]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, string> = { name: name.trim(), email: email.trim() };
      if (password) payload.password = password;
      const response = await api.put('/api/auth/profile', payload, { skipGlobalSuccess: true } as any);
      const updated = response.data?.user as AuthUser;
      setUser(updated);
      updateStoredUser(updated);
      setPassword('');
      notifySuccess('Perfil atualizado com sucesso.');
    } catch (error: any) {
      notifyError(error?.response?.data?.error || 'Não foi possível atualizar o perfil.');
    } finally {
      setSaving(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      notifySuccess('Token da sessão copiado.');
    } catch {
      notifyError('Não foi possível copiar o token.');
    }
  }

  return (
    <AuthGuard>
      <AppShell>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Meus dados</Typography>
            <Typography color="text.secondary">Gerencie suas informações de segurança e contato.</Typography>
          </Box>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="stretch">
            <Stack spacing={3} sx={{ width: { xs: '100%', lg: 320 } }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2} alignItems="center" py={2}>
                    <Avatar sx={{ width: 80, height: 80, fontSize: 30, bgcolor: 'primary.main', fontWeight: 800 }}>{initials}</Avatar>
                    <Box textAlign="center">
                      <Typography variant="h6" fontWeight={800}>{user?.name}</Typography>
                      <Typography variant="caption" color="primary.main" fontWeight={800}>{user?.role}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="overline" color="text.secondary" fontWeight={800}>Token da sessão</Typography>
                    <Box component="code" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary' }}>{token}</Box>
                    <Button size="small" startIcon={<ContentCopyRoundedIcon />} onClick={() => void copyToken()}>Copiar token</Button>
                    <Typography variant="caption" color="text.secondary">Este token identifica sua sessão no painel e expira automaticamente.</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>

            <Card variant="outlined" sx={{ flex: 1 }}>
              <Stack component="form" onSubmit={save} height="100%">
                <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                  <Stack spacing={3}>
                    <Typography variant="overline" color="primary.main" fontWeight={800}>Informações pessoais</Typography>
                    <TextField label="Nome completo" value={name} onChange={(event) => setName(event.target.value)} required fullWidth />
                    <TextField label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required fullWidth />
                    <Divider />
                    <Typography variant="overline" color="primary.main" fontWeight={800}>Segurança</Typography>
                    <TextField label="Perfil" value={user?.role ?? ''} disabled fullWidth />
                    <TextField label="Nova senha" type="password" value={password} onChange={(event) => setPassword(event.target.value)} helperText="Deixe em branco para manter a senha atual. Mínimo de 8 caracteres." fullWidth />
                  </Stack>
                </CardContent>
                <Divider />
                <Stack direction="row" justifyContent="flex-end" p={3}>
                  <Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />} disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
                </Stack>
              </Stack>
            </Card>
          </Stack>
        </Stack>
      </AppShell>
    </AuthGuard>
  );
}
