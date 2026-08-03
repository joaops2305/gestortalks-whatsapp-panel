'use client';

import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Box, Button, Card, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';

export default function SwaggerPage() {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3002').replace(/\/$/, '');
  const openApiUrl = `${apiUrl}/openapi.json`;
  const externalSwaggerUrl = `${apiUrl}/docs`;

  const swaggerHtml = useMemo(() => `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GestorTalks Whats API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html, body, #swagger-ui { margin: 0; min-height: 100%; background: #ffffff; }
    body { font-family: Inter, Arial, sans-serif; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .information-container { margin: 24px 0 12px; }
    .swagger-ui .scheme-container { box-shadow: none; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: ${JSON.stringify(openApiUrl)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      requestInterceptor: function(request) {
        return request;
      }
    });
  </script>
</body>
</html>`, [openApiUrl]);

  return (
    <AuthGuard>
      <AppShell>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4" fontWeight={800}>Documentação da API</Typography>
              <Typography color="text.secondary">Swagger integrado ao painel para consultar e testar os endpoints do GestorTalks Whats.</Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button component={Link} href="/documentacao" variant="outlined" startIcon={<DescriptionRoundedIcon />}>
                Guia de integração
              </Button>
              <Button component="a" href={externalSwaggerUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<OpenInNewRoundedIcon />}>
                Abrir em nova aba
              </Button>
            </Stack>
          </Stack>

          <Card variant="outlined" sx={{ overflow: 'hidden', minHeight: 'calc(100vh - 190px)' }}>
            <Box
              component="iframe"
              title="Swagger GestorTalks Whats"
              srcDoc={swaggerHtml}
              sx={{
                display: 'block',
                width: '100%',
                minHeight: 'calc(100vh - 190px)',
                border: 0,
                bgcolor: '#fff',
              }}
            />
          </Card>
        </Stack>
      </AppShell>
    </AuthGuard>
  );
}
