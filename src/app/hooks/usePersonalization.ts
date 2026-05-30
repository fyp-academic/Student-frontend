import { useCallback, useEffect, useState } from 'react';
import { personalizationApi } from '@/app/services/api';
import type { PersonalizationContext } from '@/app/types/personalization';

export function usePersonalization(courseId: string) {
  const [context, setContext] = useState<PersonalizationContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!courseId) {
      setContext(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await personalizationApi.forCourse(courseId);
      setContext(res.data?.data ?? res.data ?? null);
    } catch {
      setError('Could not load personalization settings.');
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { context, loading, error, refresh };
}
