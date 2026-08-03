import type { Metadata } from 'next';
import { AppProviders } from '@/components/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'GestorTalks Whats',
  description: 'Painel administrativo do GestorTalks WhatsApp',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
