import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PasteBinHistoryDB extends DBSchema {
  history: {
    key: string;
    value: {
      id: string;
      title: string;
      lastAccess: number;
    };
    indexes: { 'by-date': number };
  };
}

let dbPromise: Promise<IDBPDatabase<PasteBinHistoryDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<PasteBinHistoryDB>('pastebin-history', 1, {
      upgrade(db) {
        const store = db.createObjectStore('history', { keyPath: 'id' });
        store.createIndex('by-date', 'lastAccess');
      },
    });
  }
  return dbPromise;
};

export const addHistory = async (id: string, title: string) => {
  const db = await getDB();
  await db.put('history', {
    id,
    title: title || 'Untitled',
    lastAccess: Date.now(),
  });
};

export const getHistory = async () => {
  const db = await getDB();
  return db.getAllFromIndex('history', 'by-date');
};

export const removeHistory = async (id: string) => {
  const db = await getDB();
  await db.delete('history', id);
};
