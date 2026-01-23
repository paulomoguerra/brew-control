import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  where,
  limit,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Hook for real-time data subscription
export function useRealtimeCollection<T>(
  collectionName: string, 
  constraints: QueryConstraint[] = [orderBy("timestamp", "desc")]
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      setData(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading };
}

// Hook for one-off data fetching
export function useFetchCollection<T>(
  collectionName: string, 
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      setData(items);
    } catch (e) {
      console.error(`Error fetching ${collectionName}`, e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [collectionName]);

  return { data, loading, refresh };
}