import { AdminPage } from '@/components/AdminPage';
export default function EmpresasPage() { return <AdminPage title="Empresas" description="Cadastre e administre clientes da plataforma global." actionLabel="Nova empresa" columns={['Nome', 'Documento', 'Plano', 'Instâncias', 'Status']} />; }
