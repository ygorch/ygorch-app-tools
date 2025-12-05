
import { openDB, DBSchema, IDBPDatabase } from 'idb';

const PREFS_DB_NAME = 'user-prefs-db';
const PREFS_DB_VERSION = 1;

export type ThemeMode = 'dark' | 'light';
export type BackgroundType = 'solid' | 'doodle' | 'image';

export interface UserPreferences {
  id: 'user-settings'; // Singleton key
  theme: ThemeMode;
  backgroundType: BackgroundType;
  backgroundColor: string; // Hex code
  backgroundPattern?: string; // Doodle pattern name
  backgroundImage?: Blob;
}

interface PrefsDB extends DBSchema {
  prefs: {
    key: string;
    value: UserPreferences;
  };
}

let dbPromise: Promise<IDBPDatabase<PrefsDB>>;

const getPrefsDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<PrefsDB>(PREFS_DB_NAME, PREFS_DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('prefs', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};

const DEFAULT_PREFS: UserPreferences = {
  id: 'user-settings',
  theme: 'dark',
  backgroundType: 'solid',
  backgroundColor: '#0a0a0a', // neutral-950
};

export async function getPreferences(): Promise<UserPreferences> {
  const db = await getPrefsDB();
  const prefs = await db.get('prefs', 'user-settings');
  return prefs || DEFAULT_PREFS;
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  const db = await getPrefsDB();
  await db.put('prefs', prefs);
}
