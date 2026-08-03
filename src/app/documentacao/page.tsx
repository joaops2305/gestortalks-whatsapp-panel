'use client';

import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { notifyError, notifySuccess } from '@/services/notifications';

const webhookPayload = `{
  "provider": "baileys",
  "applicationId": 3,
  "event": "onmessage",
  "instanceId": 15,
  "session": "inst_ABC123",
  "timestamp": 1785710000000,
  "data": {
    "key": {
      "id": "3EB0...",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "Olá"
    }
  },
  "raw": {}
}`;

const webhookHeaders = `content-type: application/json
user-agent: GestorTalks-WhatsApp/1.0
x-gestortalks-signature: <hmac-sha256>
x-webhook-signature: <hmac-sha256>
x-webhook-event: onmessage
x-webhook-attempt: 1`;

const webhookResponse = `HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true
}`;

const sendTextExample = `POST /api/messages/text
Authorization: Bearer SUA_API_KEY
Content-Type: application/json

{
  "instance_id": 15,
  "to": "5511999999999",
  "message": "Olá pelo GestorTalks Whats"
}`;

const sections = [
  ['visao-geral', 'Visão geral'],
  ['autenticacao', 'Autenticação'],
  ['aplicacoes', 'Aplicações'],
  ['api-keys', 'API Keys'],
  ['instancias', 'Instâncias'],
  ['webhooks', 'Webhooks'],
  ['payload', 'Payload enviado'],
  ['resposta', 'Resposta esperada'],
  ['tentativas', 'Tentativas e timeout'],
  ['mensagens', 'Envio de mensagens'],
  ['producao', 'Checklist de produção'],
] as const;

type SectionId = (typeof sections)[number][0];

function CodeBlock({ value }: { value: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      notifySuccess('Conteúdo copiado para a área de transferência.');
    } catch {
      notifyError('Não foi possível copiar o conteúdo.');
    }
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Button size="small" startIcon={<ContentCopyRoundedIcon />} onClick={() => void copy()} sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}>
        Copiar
      </Button>
      <Box component="pre" sx={{ m: 0, p: 2.5, pt: 6, overflowX: 'auto', borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', fontSize: 13, lineHeight: 1.65 }}>
        <code>{value}</code>
      </Box>
    </Box>
  );
}

export default function DocumentacaoPage() {
  const [active, setActive] = useState<SectionId>('visao-geral');
  const title = useMemo(() => sections.find(([id]) => id === active)?.[1] ?? 'Documentação', [active]);

  return (
    <AuthGuard>
      <AppShell>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Documentação da API</Typography>
            <Typography color="text.secondary">Referência operacional do GestorTalks Whats para integração e produção.</Typography>
          </Box>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
            <Card variant="outlined" sx={{ width: { xs: '100%', lg: 260 }, position: { lg: 'sticky' }, top: { lg: 96 } }}>
              <List dense>
                {sections.map(([id, label]) => (
                  <ListItemButton key={id} selected={active === id} onClick={() => setActive(id)}>
                    <ListItemText primary={label} />
                  </ListItemButton>
                ))}
              </List>
            </Card>

            <Card variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <Stack spacing={3}>
                  <Typography variant="h5" fontWeight={800}>{title}</Typography>
                  <Divider />

                  {active === 'visao-geral' && <Stack spacing={2}>
                    <Typography>O GestorTalks Whats é o gateway global de WhatsApp. Cada empresa possui aplicações, cada aplicação possui instâncias e webhooks, e os eventos são enviados somente aos webhooks vinculados à aplicação da instância.</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {['Multiempresa', 'Multiaplicação', 'Baileys', 'PostgreSQL', 'Redis', 'Webhooks assinados'].map((item) => <Chip key={item} label={item} />)}
                    </Stack>
                    <CodeBlock value={'Empresa → Aplicação → Instância → Evento → Webhook'} />
                  </Stack>}

                  {active === 'autenticacao' && <Stack spacing={2}>
                    <Typography>As requisições administrativas usam o token de sessão do painel. Integrações externas devem usar uma API Key ativa no cabeçalho Authorization.</Typography>
                    <CodeBlock value={'Authorization: Bearer gtwa_live_xxxxxxxxxxxxxxxxx'} />
                    <Typography color="text.secondary">A chave completa é exibida somente ao criar ou regenerar. Depois disso, o sistema mantém apenas o hash.</Typography>
                  </Stack>}

                  {active === 'aplicacoes' && <Stack spacing={2}>
                    <Typography>Uma aplicação representa um sistema consumidor, como GestorTalks Chat, GestorTrack, CRM ou ERP. A aplicação não possui URL de webhook diretamente.</Typography>
                    <CodeBlock value={`{
  "company_id": 1,
  "name": "GestorTalks Chat",
  "description": "Central de atendimento",
  "rate_limit": 300,
  "status": true
}`} />
                  </Stack>}

                  {active === 'api-keys' && <Stack spacing={2}>
                    <Typography>API Keys autenticam sistemas externos. É possível criar, regenerar e revogar. Ao regenerar, o token anterior deixa de funcionar imediatamente.</Typography>
                    <CodeBlock value={`{
  "company_id": 1,
  "application_id": 3,
  "name": "Produção",
  "environment": "live",
  "status": true
}`} />
                  </Stack>}

                  {active === 'instancias' && <Stack spacing={2}>
                    <Typography>A instância deve estar vinculada a uma aplicação. Esse vínculo determina quais webhooks receberão seus eventos.</Typography>
                    <CodeBlock value={`{
  "empresa_id": 1,
  "application_id": 3,
  "name": "Comercial",
  "session": "inst_ABC123",
  "external_id": "comercial-01"
}`} />
                  </Stack>}

                  {active === 'webhooks' && <Stack spacing={2}>
                    <Typography>O webhook pertence a uma aplicação e recebe somente eventos das instâncias vinculadas à mesma aplicação. O campo events vazio ou contendo <code>*</code> recebe todos os eventos.</Typography>
                    <CodeBlock value={`{
  "company_id": 1,
  "application_id": 3,
  "name": "Webhook produção",
  "url": "https://seu-sistema.com/api/webhooks/whatsapp",
  "secret": "segredo-forte",
  "events": ["onmessage", "onconnection", "onack"],
  "retry_limit": 3,
  "status": true
}`} />
                    <Typography fontWeight={700}>Cabeçalhos enviados</Typography>
                    <CodeBlock value={webhookHeaders} />
                  </Stack>}

                  {active === 'payload' && <Stack spacing={2}>
                    <Typography>O corpo é montado a partir do evento interno do gateway. O campo <code>data</code> contém os dados normalizados ou recebidos do Baileys; <code>raw</code> pode conter o evento bruto quando disponível.</Typography>
                    <CodeBlock value={webhookPayload} />
                    <Typography color="text.secondary">Campos fixos: provider, applicationId, event, instanceId, session, timestamp e data. O formato interno de data varia conforme o evento e o tipo da mensagem.</Typography>
                  </Stack>}

                  {active === 'resposta' && <Stack spacing={2}>
                    <Typography>O destino deve responder com qualquer status HTTP entre 200 e 299. O corpo é opcional, mas recomendamos uma resposta JSON simples.</Typography>
                    <CodeBlock value={webhookResponse} />
                    <Typography color="text.secondary">Respostas 4xx, 5xx, timeout ou falha de rede são consideradas tentativas malsucedidas.</Typography>
                  </Stack>}

                  {active === 'tentativas' && <Stack spacing={2}>
                    <Typography>Cada requisição possui timeout de 15 segundos. O limite de tentativas é configurável por webhook, entre 1 e 10.</Typography>
                    <Typography>O intervalo usa backoff exponencial:</Typography>
                    <CodeBlock value={'1ª repetição: 1 segundo\n2ª repetição: 2 segundos\n3ª repetição: 4 segundos\n4ª repetição: 8 segundos\nDemais: máximo de 10 segundos'} />
                    <Typography color="text.secondary">Cada tentativa é registrada em whatsapp_webhook_logs com status HTTP, resposta, tempo, erro e número da tentativa.</Typography>
                  </Stack>}

                  {active === 'mensagens' && <Stack spacing={2}>
                    <Typography>As rotas de mensagens exigem API Key ou credencial autorizada. Use sempre números com DDI e DDD, somente dígitos.</Typography>
                    <CodeBlock value={sendTextExample} />
                    <Typography color="text.secondary">O gateway também suporta envio de imagem, áudio, vídeo e documento conforme as rotas habilitadas no backend.</Typography>
                  </Stack>}

                  {active === 'producao' && <Stack spacing={1.5}>
                    {[
                      'Trocar API_TOKEN e GESTORTALKS_WEBHOOK_TOKEN por segredos fortes.',
                      'Usar DATABASE_URL e REDIS_URL de produção.',
                      'Executar npm run migrate antes da primeira inicialização.',
                      'Usar HTTPS no painel, API e destinos de webhook.',
                      'Criar API Keys separadas por aplicação e ambiente.',
                      'Vincular todas as instâncias a uma aplicação.',
                      'Configurar retry_limit e eventos dos webhooks.',
                      'Validar x-gestortalks-signature no sistema receptor.',
                      'Executar npm run typecheck e npm run build.',
                      'Gerenciar o processo com PM2, systemd ou container.',
                      'Monitorar Logs, Métricas e whatsapp_webhook_logs.',
                      'Não manter tokens de exemplo como change-me em produção.',
                    ].map((item, index) => <Typography key={item}>{index + 1}. {item}</Typography>)}
                  </Stack>}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      </AppShell>
    </AuthGuard>
  );
}
