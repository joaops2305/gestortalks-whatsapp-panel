'use client';

import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { api } from '@/services/api';
import { getUser, updateStoredUser, type AuthUser } from '@/services/auth';
import { notifyError, notifySuccess } from '@/services/notifications';

type UserApiKey = {
  id: number;
  key_prefix: string;
  status: number | boolean;
  last_used_at?: string | null;
  created_at?: string | null;
};

export default function PerfilPage() {
  const [user, setUser] = useState<AuthUser | null>(() => getUser());
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState<UserApiKey | null>(null);
  const [generatedKey, setGeneratedKey] = useState('');
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    void Promise.all([
      api.get('/api/auth/me', { skipGlobalSuccess: true } as any),
      api.get('/api/auth/api-key', { skipGlobalSuccess: true } as any),
    ]).then(([userResponse, keyResponse]) => {
      const current = userResponse.data?.user as AuthUser;
      if (current) {
        setUser(current);
        setName(current.name);
        setEmail(current.email);
        updateStoredUser(current);
      }
      setApiKey(keyResponse.data?.data ?? null);
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

  async function regenerateApiKey() {
    setGenerating(true);
    try {
      const response = await api.post('/api/auth/api-key/regenerate', {}, { skipGlobalSuccess: true } as any);
      setApiKey(response.data?.data ?? null);
      setGeneratedKey(response.data?.api_key ?? '');
      setTokenDialogOpen(true);
      notifySuccess('API Key global gerada com sucesso.');
    } catch (error: any) {
      notifyError(error?.response?.data?.error || 'Não foi possível gerar a API Key.');
    } finally {
      setGenerating(false);
    }
  }

  async function copyGeneratedKey() {
    if (!generatedKey) return;
    try {
      await navigator.clipboard.writeText(generatedKey);
      notifySuccess('API Key copiada.');
    } catch {
      notifyError('Não foi possível copiar a API Key.');
    }
  }

  return (
    <AuthGuard>
      <AppShell>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Meus dados</Typography>
            <Typography color="text.secondary">Gerencie seu perfil, segurança e sua única API Key global.</Typography>
          </Box>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="stretch">
            <Stack spacing={3} sx={{ width: { xs: '100%', lg: 340 } }}>
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
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <KeyRoundedIcon color="primary" fontSize="small" />
                      <Typography variant="overline" color="text.secondary" fontWeight={800}>API Key global</Typography>
                    </Stack>
                    {apiKey ? <>
                      <Box component="code" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apiKey.key_prefix}...</Box>
                      <Chip size="small" label={Number(apiKey.status) === 1 ? 'Ativa' : 'Revogada'} color={Number(apiKey.status) === 1 ? 'success' : 'default'} sx={{ alignSelf: 'flex-start' }} />
                      <Typography variant="caption" color="text.secondary">Último uso: {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleString('pt-BR') : 'Nunca utilizada'}</Typography>
                    </> : <Typography color="text.secondary">Você ainda não possui uma API Key.</Typography>}
                    <Button variant="contained" onClick={() => void regenerateApiKey()} disabled={generating}>{generating ? 'Gerando...' : apiKey ? 'Regenerar API Key' : 'Gerar API Key'}</Button>
                    <Typography variant="caption" color="text.secondary">Essa chave é única para o seu usuário e pode acessar as rotas permitidas da sua empresa.</Typography>
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

        <Dialog open={tokenDialogOpen} onClose={() => { setTokenDialogOpen(false); setGeneratedKey(''); }} fullWidth maxWidth="sm">
          <DialogTitle>API Key global gerada</DialogTitle>
          <DialogContent>
            <Stack spacing={2} pt={1}>
              <Typography color="text.secondary">Copie a chave agora. Por segurança, ela não será exibida novamente.</Typography>
              <Box component="code" sx={{ display: 'block', p: 2, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', wordBreak: 'break-all', fontWeight: 700 }}>{generatedKey}</Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => { setTokenDialogOpen(false); setGeneratedKey(''); }}>Fechar</Button>
            <Button variant="contained" startIcon={<ContentCopyRoundedIcon />} onClick={() => void copyGeneratedKey()}>Copiar API Key</Button>
          </DialogActions>
        </Dialog>
      </AppShell>
    </AuthGuard>
  );
}
