import { openDB, DBSchema } from 'idb';

export interface SavedSchema {
  id: string;
  name: string;
  scheme: string; // The protocol part, e.g., 'twitter' or 'myapp'
  timestamp: number;
}

interface SchemasDB extends DBSchema {
  schemas: {
    key: string;
    value: SavedSchema;
    indexes: { 'by-scheme': string; 'by-timestamp': number };
  };
}

const DB_NAME = 'deeplink-schemas-db';
const STORE_NAME = 'schemas';

async function initDB() {
  return openDB<SchemasDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: 'id',
      });
      store.createIndex('by-scheme', 'scheme');
      store.createIndex('by-timestamp', 'timestamp');
    },
  });
}

export async function saveSchema(name: string, scheme: string, id?: string) {
  const db = await initDB();

  // If no ID provided, check if we're updating an existing one by ID (if we had passed it)
  // or creating new.

  const finalId = id || crypto.randomUUID();

  await db.put(STORE_NAME, {
    id: finalId,
    name,
    scheme,
    timestamp: Date.now(),
  });

  return finalId;
}

export async function getSavedSchemas(): Promise<SavedSchema[]> {
  const db = await initDB();
  // Return sorted by timestamp (newest last or first? usually Lists are newest first or alphabetical)
  // Let's return by timestamp for now, user can sort if needed.
  return db.getAllFromIndex(STORE_NAME, 'by-timestamp');
}

export async function deleteSchema(id: string) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

// Helper to batch save (for import)
export async function saveAllSchemas(schemas: SavedSchema[]) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const schema of schemas) {
        await tx.store.put(schema);
    }
    await tx.done;
}
