import { AdminPage } from '@/components/AdminPage';
export default function WebhooksPage() { return <AdminPage title="Webhooks" description="Configure URLs, eventos, segredos e acompanhe entregas." actionLabel="Novo webhook" columns={['URL', 'Aplicação', 'Eventos', 'Última entrega', 'Status']} />; }
