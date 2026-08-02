import { AdminPage } from '@/components/AdminPage';
export default function AplicacoesPage() { return <AdminPage title="Aplicações" description="Gerencie sistemas externos, permissões, limites e integrações." actionLabel="Nova aplicação" columns={['Nome', 'Empresa', 'Instâncias', 'Rate limit', 'Status']} />; }
