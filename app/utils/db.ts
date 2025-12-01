import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'wishlist-db';
const DB_VERSION = 1;

export interface WishlistList {
  id: string;
  title: string;
  description: string;
  color: string; // Tailwind color class or hex
  iconName: string; // Lucide icon name
  thumbnailBlob?: Blob;
  createdAt: number;
  updatedAt: number;
}

export interface WishlistCategory {
  id: string;
  name: string;
  color: string;
  iconName: string;
  createdAt: number;
}

export interface WishlistItem {
  id: string;
  listId: string;
  title: string;
  url?: string;
  categoryId: string;
  createdAt: number;
}

interface WishlistDB extends DBSchema {
  lists: {
    key: string;
    value: WishlistList;
    indexes: { 'by-date': number };
  };
  categories: {
    key: string;
    value: WishlistCategory;
    indexes: { 'by-name': string };
  };
  items: {
    key: string;
    value: WishlistItem;
    indexes: { 'by-list': string };
  };
}

let dbPromise: Promise<IDBPDatabase<WishlistDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<WishlistDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Lists Store
        const listStore = db.createObjectStore('lists', { keyPath: 'id' });
        listStore.createIndex('by-date', 'createdAt');

        // Categories Store
        const catStore = db.createObjectStore('categories', { keyPath: 'id' });
        catStore.createIndex('by-name', 'name', { unique: true });

        // Items Store
        const itemStore = db.createObjectStore('items', { keyPath: 'id' });
        itemStore.createIndex('by-list', 'listId');
      },
    });
  }
  return dbPromise;
};

// --- Lists Operations ---

export async function getAllLists(): Promise<WishlistList[]> {
  const db = await getDB();
  return db.getAllFromIndex('lists', 'by-date');
}

export async function getListById(id: string): Promise<WishlistList | undefined> {
  const db = await getDB();
  return db.get('lists', id);
}

export async function saveList(list: WishlistList): Promise<void> {
  const db = await getDB();
  await db.put('lists', list);
}

export async function deleteList(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['lists', 'items'], 'readwrite');

  // Delete the list
  await tx.objectStore('lists').delete(id);

  // Delete all items in the list
  const itemStore = tx.objectStore('items');
  const index = itemStore.index('by-list');
  let cursor = await index.openCursor(IDBKeyRange.only(id));

  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

// --- Categories Operations ---

export async function getAllCategories(): Promise<WishlistCategory[]> {
  const db = await getDB();
  return db.getAll('categories');
}

export async function saveCategory(category: WishlistCategory): Promise<void> {
  const db = await getDB();
  await db.put('categories', category);
}

export async function getCategoryByName(name: string): Promise<WishlistCategory | undefined> {
   const db = await getDB();
   return db.getFromIndex('categories', 'by-name', name);
}


// --- Items Operations ---

export async function getItemsByListId(listId: string): Promise<WishlistItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('items', 'by-list', listId);
}

export async function saveItem(item: WishlistItem): Promise<void> {
  const db = await getDB();
  await db.put('items', item);
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('items', id);
}
