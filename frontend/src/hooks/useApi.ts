import { useState, useCallback } from 'react';
import api from '../lib/api';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useGet<T>(url: string, immediate = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(url);
      setData(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar datos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useState(() => {
    if (immediate) {
      fetch();
    }
  });

  return { data, loading, error, refetch: fetch };
}

export function usePost<T>(url: string, options?: UseApiOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = useCallback(async (payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(url, payload);
      setData(response.data);
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al guardar';
      setError(msg);
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return { data, loading, error, post };
}

export function usePut<T>(url: string, options?: UseApiOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const put = useCallback(async (payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(url, payload);
      setData(response.data);
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al actualizar';
      setError(msg);
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return { data, loading, error, put };
}

export function useDelete(url: string, options?: UseApiOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`${url}/${id}`);
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al eliminar';
      setError(msg);
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return { loading, error, remove };
}
