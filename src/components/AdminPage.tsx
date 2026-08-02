'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Alert, Box, Button, Card, CardContent, Chip, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';

type AdminPageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  columns: string[];
  rows?: Array<Record<string, string | number>>;
  emptyMessage?: string;
};

export function AdminPage({ title, description, actionLabel = 'Novo', columns, rows = [], emptyMessage = 'Nenhum registro encontrado.' }: AdminPageProps) {
  return (
    <AuthGuard>
      <AppShell>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={800}>{title}</Typography>
              <Typography color="text.secondary">{description}</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddRoundedIcon />}>{actionLabel}</Button>
          </Stack>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={`Buscar em ${title.toLowerCase()}...`}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
                />
                <Button variant="outlined" startIcon={<RefreshRoundedIcon />}>Atualizar</Button>
              </Stack>

              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: 720 }}>
                  <Stack direction="row" spacing={2} sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                    {columns.map((column) => <Typography key={column} variant="caption" fontWeight={800} sx={{ flex: 1 }}>{column}</Typography>)}
                  </Stack>
                  {rows.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>{emptyMessage}</Alert>
                  ) : rows.map((row, index) => (
                    <Stack key={index} direction="row" spacing={2} sx={{ px: 2, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                      {columns.map((column) => {
                        const value = row[column] ?? '-';
                        return <Box key={column} sx={{ flex: 1 }}>{column === 'Status' ? <Chip label={String(value)} size="small" color={String(value).toLowerCase().includes('ativo') || String(value).toLowerCase().includes('conect') ? 'success' : 'default'} /> : <Typography variant="body2">{value}</Typography>}</Box>;
                      })}
                    </Stack>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </AppShell>
    </AuthGuard>
  );
}
