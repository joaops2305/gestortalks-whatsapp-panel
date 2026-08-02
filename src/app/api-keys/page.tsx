import { AdminPage } from '@/components/AdminPage';
export default function ApiKeysPage() { return <AdminPage title="API Keys" description="Crie chaves técnicas por empresa e aplicação com permissões específicas." actionLabel="Nova API Key" columns={['Nome', 'Empresa', 'Aplicação', 'Ambiente', 'Status']} />; }
