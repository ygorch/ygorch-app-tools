import { openDB, DBSchema } from 'idb';

export interface DeeplinkHistoryItem {
  id: string;
  url: string;
  timestamp: number;
  count: number;
}

interface DeeplinkDB extends DBSchema {
  history: {
    key: string;
    value: DeeplinkHistoryItem;
    indexes: { 'by-url': string; 'by-timestamp': number };
  };
}

const DB_NAME = 'deeplink-opener-db';
const STORE_NAME = 'history';

export async function initDB() {
  return openDB<DeeplinkDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: 'id',
      });
      store.createIndex('by-url', 'url');
      store.createIndex('by-timestamp', 'timestamp');
    },
  });
}

export async function saveDeeplink(url: string) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const index = tx.store.index('by-url');

  // Check if URL already exists
  const existingItem = await index.get(url);

  if (existingItem) {
    // Update existing item
    await db.put(STORE_NAME, {
      ...existingItem,
      timestamp: Date.now(),
      count: existingItem.count + 1,
    });
  } else {
    // Create new item
    const id = crypto.randomUUID();
    await db.add(STORE_NAME, {
      id,
      url,
      timestamp: Date.now(),
      count: 1,
    });
  }

  await tx.done;
}

export async function getDeeplinkHistory(): Promise<DeeplinkHistoryItem[]> {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'by-timestamp');
}

export async function deleteDeeplink(id: string) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

export async function clearDeeplinkHistory() {
  const db = await initDB();
  await db.clear(STORE_NAME);
}
