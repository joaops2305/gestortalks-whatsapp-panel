import { AdminPage } from '@/components/AdminPage';
export default function InstanciasPage() { return <AdminPage title="Instâncias" description="Conecte números, acompanhe status, QR Code e sessões." actionLabel="Nova instância" columns={['Nome', 'Empresa', 'Número', 'Provider', 'Status']} />; }
