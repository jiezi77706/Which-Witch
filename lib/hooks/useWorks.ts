import { useState, useEffect } from 'react';
import { getAllWorks, getWorksByCreator, type Work } from '../supabase/services';

/**
 * 作品数据 Hook
 */
export function useWorks(creatorAddress?: string) {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadWorks();
  }, [creatorAddress]);

  const loadWorks = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = creatorAddress
        ? await getWorksByCreator(creatorAddress)
        : await getAllWorks();
      
      setWorks(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading works:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    works,
    loading,
    error,
    refetch: loadWorks,
  };
}
