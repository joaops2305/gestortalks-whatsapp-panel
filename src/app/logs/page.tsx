import { AdminPage } from '@/components/AdminPage';
export default function LogsPage() { return <AdminPage title="Logs" description="Consulte eventos, erros, conexões, mensagens e webhooks." actionLabel="Exportar logs" columns={['Data', 'Nível', 'Módulo', 'Evento', 'Mensagem']} />; }
