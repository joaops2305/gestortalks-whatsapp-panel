'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Card, CardContent, Chip, CircularProgress, Grid, Stack, Typography } from '@mui/material';
import { AppShell } from '@/components/AppShell';
import { api } from '@/services/api';

type SystemStatus = {
  success: boolean;
  data?: {
    uptime: number;
    nodeVersion: string;
    sessions: { total: number; connected: number; reconnecting: number };
    redisStatus: string;
    memory: { rss: number; heapUsed: number; systemFree: number };
  };
};

function formatBytes(value = 0) {
  if (!value) return '0 MB';
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default function DashboardPage() {
  const statusQuery = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => (await api.get<SystemStatus>('/api/system/status')).data,
    refetchInterval: 15000,
  });

  const status = statusQuery.data?.data;
  const cards = [
    ['Sessões', status?.sessions.total ?? 0],
    ['Conectadas', status?.sessions.connected ?? 0],
    ['Reconectando', status?.sessions.reconnecting ?? 0],
    ['Memória', formatBytes(status?.memory.rss)],
  ];

  return (
    <AppShell>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Dashboard</Typography>
          <Typography color="text.secondary">Visão global do GestorTalks WhatsApp</Typography>
        </Box>

        {statusQuery.isError && (
          <Alert severity="warning">Não foi possível consultar a API. Confira o `.env.local` e o token.</Alert>
        )}

        {statusQuery.isLoading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid container spacing={2}>
              {cards.map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">{label}</Typography>
                      <Typography variant="h4" fontWeight={800} mt={1}>{value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>Saúde dos serviços</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Chip label="API online" color="success" />
                  <Chip label={`Redis: ${status?.redisStatus ?? 'desconhecido'}`} color={status?.redisStatus === 'ready' ? 'success' : 'warning'} />
                  <Chip label={`Node ${status?.nodeVersion ?? '-'}`} variant="outlined" />
                  <Chip label={`Uptime ${Math.floor((status?.uptime ?? 0) / 60)} min`} variant="outlined" />
                </Stack>
              </CardContent>
            </Card>
          </>
        )}
      </Stack>
    </AppShell>
  );
}
