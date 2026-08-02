'use client';

import { useEffect, useState } from 'react';
import { AdminPage } from '@/components/AdminPage';

export function InstancesAdminPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (document.querySelector('[role="dialog"]')) return;
      setRefreshKey((current) => current + 1);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <AdminPage
      key={refreshKey}
      title="Instâncias"
      description="Conecte números, acompanhe status, QR Code e sessões. O status é atualizado automaticamente."
      actionLabel="Nova instância"
      columns={['Nome', 'Empresa', 'Número', 'Provider', 'Status']}
    />
  );
}
