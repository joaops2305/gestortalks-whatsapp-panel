import { AdminPage } from '@/components/AdminPage';
export default function WebhooksPage() { return <AdminPage title="Webhooks" description="Configure URLs, eventos, segredos e acompanhe entregas." actionLabel="Novo webhook" columns={['Nome', 'Empresa', 'URL', 'Eventos', 'Status']} />; }
