'use client';

import { Button, Card, CardContent, Divider, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';

export default function ConfiguracoesPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Stack spacing={3}>
          <div>
            <Typography variant="h4" fontWeight={800}>Configurações</Typography>
            <Typography color="text.secondary">Preferências globais, segurança e operação do gateway.</Typography>
          </div>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700}>Geral</Typography>
                <TextField label="Nome da plataforma" defaultValue="GestorTalks Whats" />
                <TextField label="URL pública da API" placeholder="https://whatsapp.gestortalks.com.br" />
                <Divider />
                <Typography variant="h6" fontWeight={700}>Segurança</Typography>
                <FormControlLabel control={<Switch defaultChecked />} label="Exigir troca da senha inicial" />
                <FormControlLabel control={<Switch defaultChecked />} label="Registrar auditoria administrativa" />
                <FormControlLabel control={<Switch />} label="Restringir acesso por IP" />
                <Divider />
                <Typography variant="h6" fontWeight={700}>Operação</Typography>
                <FormControlLabel control={<Switch defaultChecked />} label="Restaurar sessões automaticamente" />
                <FormControlLabel control={<Switch defaultChecked />} label="Baixar mídias recebidas" />
                <Button variant="contained" sx={{ alignSelf: 'flex-start' }}>Salvar configurações</Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </AppShell>
    </AuthGuard>
  );
}
