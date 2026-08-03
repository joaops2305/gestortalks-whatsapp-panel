'use client';

import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { Alert, Avatar, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('gtw_token', response.data.token);
      localStorage.setItem('gtw_user', JSON.stringify(response.data.user));
      router.replace('/');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center', p: 2, bgcolor: 'background.default' }}>
      <Card elevation={0} sx={{ width: '100%', maxWidth: 430, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack component="form" spacing={2.5} onSubmit={submit}>
            <Avatar sx={{ width: 56, height: 56, mx: 'auto', bgcolor: 'primary.main' }}><LockRoundedIcon /></Avatar>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight={800}>GestorTalks Whats</Typography>
              <Typography color="text.secondary">Acesso administrativo</Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
            <Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
