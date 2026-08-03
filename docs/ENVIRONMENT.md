# Variaveis de ambiente do painel

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

## API

- `NEXT_PUBLIC_API_URL`: URL publica do backend GestorTalks Whats.

Desenvolvimento:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:3002
```

Producao:

```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

## Autenticacao

O painel nao usa mais `NEXT_PUBLIC_API_TOKEN`.

O fluxo atual e:

1. o usuario entra por `POST /api/auth/login`;
2. o painel armazena o token de sessao retornado pelo backend;
3. o usuario pode gerar sua unica API Key global na pagina `Meu perfil`;
4. integracoes externas usam a chave `gtwa_user_*`.

Nunca coloque tokens secretos em variaveis `NEXT_PUBLIC_*`, porque elas ficam disponiveis no JavaScript enviado ao navegador.

## Publicacao

As variaveis `NEXT_PUBLIC_*` sao incorporadas no momento do build. Sempre configure o ambiente correto antes de executar:

```bash
rm -rf .next
npm run build
npm start
```
