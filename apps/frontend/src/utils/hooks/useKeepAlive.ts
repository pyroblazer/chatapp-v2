import { useEffect } from 'react';

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useKeepAlive = () => {
  useEffect(() => {
    const ping = () => fetch('/api/health', { method: 'GET' }).catch(() => {});

    ping();
    const id = setInterval(ping, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
};
