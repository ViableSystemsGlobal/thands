import { useState, useEffect, useCallback } from 'react';
import { getAdminNotifications } from '@/lib/services/adminApi';

export function useNotifications(pollInterval = 60_000) {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await getAdminNotifications();
      setNotifications(data.items || []);
      setTotal(data.total || 0);
    } catch {
      // Silently fail — don't break the navbar if the endpoint is unreachable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, pollInterval);
    return () => clearInterval(id);
  }, [fetch, pollInterval]);

  return { notifications, total, loading, refresh: fetch };
}
