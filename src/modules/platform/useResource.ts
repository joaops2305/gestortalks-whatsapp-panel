'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { resourceService } from './resource.service';

export function useResource<T extends { id: number }>(endpoint: string, enabled = true) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!enabled) {
      if (mountedRef.current) setLoading(false);
      return;
    }

    if (mountedRef.current) {
      setLoading(true);
      setError('');
    }

    try {
      const data = await resourceService.list<T>(endpoint);
      if (mountedRef.current) setItems(Array.isArray(data) ? data : []);
    } catch (requestError: any) {
      if (mountedRef.current) {
        setError(requestError?.response?.data?.error || 'Não foi possível carregar os registros.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled, endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  const upsertLocal = useCallback((item: T) => {
    setItems((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      return exists
        ? current.map((entry) => entry.id === item.id ? item : entry)
        : [item, ...current];
    });
  }, []);

  const removeLocal = useCallback((id: number) => {
    setItems((current) => current.filter((entry) => entry.id !== id));
  }, []);

  return { items, loading, error, setError, load, upsertLocal, removeLocal };
}
