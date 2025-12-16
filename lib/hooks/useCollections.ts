import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  getUserCollections,
  getUserFolders,
  collectWork,
  uncollectWork,
  createFolder,
  type Folder,
} from '../supabase/services';
import { getUserCollectionAuthStatuses } from '../supabase/services/authorization.service';

/**
 * 收藏数据 Hook
 */
export function useCollections(userId?: number) {
  const { address } = useAccount();
  const [collections, setCollections] = useState<any[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [authStatuses, setAuthStatuses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (userId) {
      loadCollections();
    }
  }, [userId]);

  const loadCollections = async () => {
    if (!userId || !address) return;

    setLoading(true);
    setError(null);

    try {
      const [collectionsData, foldersData] = await Promise.all([
        getUserCollections(userId),
        getUserFolders(userId),
      ]);

      setCollections(collectionsData);
      setFolders(foldersData);

      // 获取所有收藏作品的授权状态
      const workIds = collectionsData.map((c: any) => c.work_id);
      if (workIds.length > 0) {
        const statuses = await getUserCollectionAuthStatuses(address, workIds);
        setAuthStatuses(statuses);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCollection = async (workId: number, folderId: number, note?: string) => {
    if (!userId) throw new Error('User not logged in');

    console.log('📝 addCollection called:', { userId, workId, folderId, note })
    
    try {
      await collectWork(userId, workId, folderId, note);
      console.log('✅ collectWork succeeded, reloading collections...')
      await loadCollections();
      console.log('✅ Collections reloaded')
    } catch (err) {
      console.error('❌ Error adding collection:', err);
      throw err;
    }
  };

  const removeCollection = async (workId: number) => {
    if (!userId) throw new Error('User not logged in');

    try {
      await uncollectWork(userId, workId);
      await loadCollections();
    } catch (err) {
      console.error('Error removing collection:', err);
      throw err;
    }
  };

  const addFolder = async (name: string, description?: string) => {
    if (!userId) throw new Error('User not logged in');

    try {
      await createFolder(userId, name, description);
      await loadCollections();
    } catch (err) {
      console.error('Error creating folder:', err);
      throw err;
    }
  };

  return {
    collections,
    folders,
    authStatuses,
    loading,
    error,
    addCollection,
    removeCollection,
    addFolder,
    refetch: loadCollections,
  };
}
