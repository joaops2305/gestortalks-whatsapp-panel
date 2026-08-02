import { AdminPage } from '@/components/AdminPage';
export default function MensagensPage() { return <AdminPage title="Mensagens" description="Consulte envios e recebimentos de texto, imagem, áudio, vídeo e documentos." actionLabel="Enviar mensagem" columns={['Data', 'Instância', 'Destino', 'Tipo', 'Status']} />; }
