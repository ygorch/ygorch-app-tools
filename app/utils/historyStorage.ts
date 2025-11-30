import { openDB, DBSchema } from 'idb';

interface ImageHistory {
  id: string;
  timestamp: number;
  originalName: string;
  processedBlob: Blob;
  type: 'resize' | 'compress';
  details: string; // e.g., "Small (840px)" or "200kb"
}

interface ToolsDB extends DBSchema {
  history: {
    key: string;
    value: ImageHistory;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'ygors-tools-db';
const STORE_NAME = 'history';

export async function initDB() {
  return openDB<ToolsDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: 'id',
      });
      store.createIndex('by-timestamp', 'timestamp');
    },
  });
}

export async function saveToHistory(historyItem: Omit<ImageHistory, 'id' | 'timestamp'>) {
  const db = await initDB();
  const id = crypto.randomUUID();
  const timestamp = Date.now();

  await db.add(STORE_NAME, {
    ...historyItem,
    id,
    timestamp,
  });

  // Clean up old items (older than 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const index = tx.store.index('by-timestamp');

  // Iterate and delete old entries
  let cursor = await index.openCursor(IDBKeyRange.upperBound(thirtyDaysAgo));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function getHistory(): Promise<ImageHistory[]> {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'by-timestamp');
}

export async function deleteFromHistory(id: string) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

export async function clearHistory() {
  const db = await initDB();
  await db.clear(STORE_NAME);
}
