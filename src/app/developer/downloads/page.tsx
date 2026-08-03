'use client';

import ApiRoundedIcon from '@mui/icons-material/ApiRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';

export default function DeveloperDownloadsPage() {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3002').replace(/\/$/, '');
  const downloads = [
    {
      title: 'Postman Collection',
      description: 'Coleção oficial com autenticação, instâncias, mensagens, webhooks, logs e métricas.',
      href: `${apiUrl}/downloads/postman/collection.json`,
      icon: <Inventory2RoundedIcon />,
    },
    {
      title: 'Postman Environment',
      description: 'Ambiente com baseUrl, token, apiKey, instanceId e applicationId.',
      href: `${apiUrl}/downloads/postman/environment.json`,
      icon: <Inventory2RoundedIcon />,
    },
    {
      title: 'OpenAPI JSON',
      description: 'Especificação para Swagger, Postman, Insomnia e geradores de SDK.',
      href: `${apiUrl}/downloads/openapi.json`,
      icon: <ApiRoundedIcon />,
    },
  ];

  return (
    <AuthGuard>
      <AppShell>
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="h4" fontWeight={800}>Downloads para desenvolvedores</Typography>
            <Typography color="text.secondary">Arquivos oficiais para integrar e testar a API GestorTalks Whats.</Typography>
          </Stack>

          <Stack spacing={2}>
            {downloads.map((item) => (
              <Card key={item.title} variant="outlined">
                <CardContent>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                    <Stack direction="row" spacing={2} alignItems="center">
                      {item.icon}
                      <Stack>
                        <Typography variant="h6" fontWeight={700}>{item.title}</Typography>
                        <Typography color="text.secondary">{item.description}</Typography>
                      </Stack>
                    </Stack>
                    <Button component="a" href={item.href} variant="contained" startIcon={<DownloadRoundedIcon />}>
                      Baixar
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Stack>
      </AppShell>
    </AuthGuard>
  );
}
