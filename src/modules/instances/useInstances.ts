'use client';

import { useCallback, useEffect, useState } from 'react';
import { instanceService } from './instance.service';
import type { WhatsAppInstance } from './types';

export function useInstances() {
  const [items, setItems] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await instanceService.list());
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível carregar as instâncias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback((id: number, changes: Partial<WhatsAppInstance>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  }, []);

  const removeLocal = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  return { items, loading, error, setError, load, patch, removeLocal };
}
