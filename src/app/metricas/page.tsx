import { AdminPage } from '@/components/AdminPage';
export default function MetricasPage() { return <AdminPage title="Métricas" description="Monitore volume, sessões, filas, webhooks e saúde da infraestrutura." actionLabel="Exportar métricas" columns={['Indicador', 'Atual', 'Última hora', 'Hoje', 'Status']} />; }
