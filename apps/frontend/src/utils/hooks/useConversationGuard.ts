import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getConversationById } from '../api';

export function useConversationGuard() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(undefined);

    const tryFetch = (retries: number, delay: number) => {
      getConversationById(id)
        .then(() => setLoading(false))
        .catch((err) => {
          if (retries > 0) {
            setTimeout(() => tryFetch(retries - 1, Math.min(delay * 1.5, 3000)), delay);
          } else {
            setError(err);
            setLoading(false);
          }
        });
    };

    // Initial delay to let auth token settle after page reload
    const t = setTimeout(() => tryFetch(8, 500), 300);
    return () => clearTimeout(t);
  }, [id]);

  return { loading, error };
}
