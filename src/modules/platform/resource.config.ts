export type ResourceField = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'select' | 'boolean';
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  lookup?: 'companies' | 'applications';
};

export type ResourceConfig = {
  title: string;
  description: string;
  actionLabel: string;
  endpoint: string;
  superadminOnly?: boolean;
  fields: ResourceField[];
  columns: Array<{ key: string; label: string }>;
  toPayload: (values: Record<string, unknown>) => Record<string, unknown>;
};

const company = (): ResourceField => ({ name: 'company_id', label: 'Empresa', type: 'select', lookup: 'companies', required: true });
const application = (): ResourceField => ({ name: 'application_id', label: 'Aplicação', type: 'select', lookup: 'applications' });

export const resourceConfigs: Record<string, ResourceConfig> = {
  companies: {
    title: 'Empresas', description: 'Cadastre e administre clientes da plataforma global.', actionLabel: 'Nova empresa', endpoint: '/api/admin/companies', superadminOnly: true,
    fields: [
      { name: 'name', label: 'Nome da empresa', required: true }, { name: 'document', label: 'CPF/CNPJ' },
      { name: 'email', label: 'E-mail', type: 'email' }, { name: 'phone', label: 'Telefone' },
      { name: 'plan', label: 'Plano', type: 'select', required: true, options: ['Free','Starter','Pro','Enterprise'].map((value) => ({ label: value, value })) },
      { name: 'instance_limit', label: 'Limite de instâncias', type: 'number', required: true }, { name: 'status', label: 'Ativa', type: 'boolean' },
    ],
    columns: [{ key: 'name', label: 'Nome' }, { key: 'document', label: 'Documento' }, { key: 'plan', label: 'Plano' }, { key: 'instances', label: 'Instâncias' }, { key: 'status', label: 'Status' }],
    toPayload: (v) => ({ ...v, instance_limit: Number(v.instance_limit || 1) }),
  },
  users: {
    title: 'Usuários', description: 'Gerencie os acessos administrativos da plataforma.', actionLabel: 'Novo usuário', endpoint: '/api/admin/users', superadminOnly: true,
    fields: [
      { name: 'name', label: 'Nome completo', required: true },
      { name: 'email', label: 'E-mail', type: 'email', required: true },
      { name: 'password', label: 'Senha inicial (mínimo 8 caracteres)', type: 'password', required: true },
      { name: 'company_id', label: 'Empresa', type: 'select', lookup: 'companies' },
      { name: 'role', label: 'Perfil', type: 'select', required: true, options: ['superadmin','admin_empresa','desenvolvedor','operador','visualizador'].map((value) => ({ label: value, value })) },
      { name: 'status', label: 'Ativo', type: 'boolean' },
    ],
    columns: [{ key: 'name', label: 'Nome' }, { key: 'email', label: 'E-mail' }, { key: 'company_name', label: 'Empresa' }, { key: 'role', label: 'Perfil' }, { key: 'status', label: 'Status' }],
    toPayload: (v) => ({
      ...v,
      name: String(v.name || '').trim(),
      email: String(v.email || '').trim().toLowerCase(),
      company_id: v.company_id ? Number(v.company_id) : null,
      password: v.password ? String(v.password) : undefined,
    }),
  },
  applications: {
    title: 'Aplicações', description: 'Cadastre aplicações externas que consomem a API.', actionLabel: 'Nova aplicação', endpoint: '/api/admin/applications',
    fields: [{ name: 'name', label: 'Nome da aplicação', required: true }, company(), { name: 'description', label: 'Descrição' }, { name: 'rate_limit', label: 'Limite por minuto', type: 'number' }, { name: 'status', label: 'Ativa', type: 'boolean' }],
    columns: [{ key: 'name', label: 'Nome' }, { key: 'company_name', label: 'Empresa' }, { key: 'description', label: 'Descrição' }, { key: 'rate_limit', label: 'Rate limit' }, { key: 'status', label: 'Status' }],
    toPayload: (v) => ({ ...v, company_id: Number(v.company_id), rate_limit: Number(v.rate_limit || 300) }),
  },
  apiKeys: {
    title: 'API Keys', description: 'Crie e revogue chaves de integração.', actionLabel: 'Nova API Key', endpoint: '/api/admin/api-keys',
    fields: [{ name: 'name', label: 'Nome da chave', required: true }, company(), application(), { name: 'environment', label: 'Ambiente', type: 'select', required: true, options: [{ label: 'Teste', value: 'test' }, { label: 'Produção', value: 'live' }] }, { name: 'expires_in_days', label: 'Validade em dias', type: 'number' }, { name: 'status', label: 'Ativa', type: 'boolean' }],
    columns: [{ key: 'name', label: 'Nome' }, { key: 'company_name', label: 'Empresa' }, { key: 'application_name', label: 'Aplicação' }, { key: 'environment', label: 'Ambiente' }, { key: 'status', label: 'Status' }],
    toPayload: (v) => ({ ...v, company_id: Number(v.company_id), application_id: v.application_id ? Number(v.application_id) : null, expires_in_days: v.expires_in_days ? Number(v.expires_in_days) : null }),
  },
  webhooks: {
    title: 'Webhooks', description: 'Gerencie destinos, eventos e segredos de assinatura.', actionLabel: 'Novo webhook', endpoint: '/api/admin/webhooks',
    fields: [{ name: 'name', label: 'Nome do webhook', required: true }, company(), application(), { name: 'url', label: 'URL de destino', type: 'url', required: true }, { name: 'events', label: 'Eventos separados por vírgula' }, { name: 'secret', label: 'Segredo de assinatura', type: 'password' }, { name: 'status', label: 'Ativo', type: 'boolean' }],
    columns: [{ key: 'name', label: 'Nome' }, { key: 'company_name', label: 'Empresa' }, { key: 'url', label: 'URL' }, { key: 'events', label: 'Eventos' }, { key: 'status', label: 'Status' }],
    toPayload: (v) => ({ ...v, company_id: Number(v.company_id), application_id: v.application_id ? Number(v.application_id) : null, events: String(v.events || 'onmessage,onconnection').split(',').map((item) => item.trim()).filter(Boolean), secret: v.secret || null }),
  },
};
