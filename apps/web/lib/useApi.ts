"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useApi<T>(
  path: string,
  deps: unknown[] = [],
  pollInterval?: number,
): State<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData(isInitial = false) {
      if (isInitial) setLoading(true);
      try {
        const result = await api.get<T>(path);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData(true);

    let interval: ReturnType<typeof setInterval> | undefined;
    if (pollInterval && pollInterval > 0) {
      interval = setInterval(() => fetchData(false), pollInterval);
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, pollInterval, ...deps]);

  return { data, loading, error, reload };
}
