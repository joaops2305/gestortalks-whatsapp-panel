import { AdminPage } from '@/components/AdminPage';
export default function UsuariosPage() { return <AdminPage title="Usuários" description="Gerencie superadmins, administradores, desenvolvedores e operadores." actionLabel="Novo usuário" columns={['Nome', 'E-mail', 'Empresa', 'Perfil', 'Status']} />; }
