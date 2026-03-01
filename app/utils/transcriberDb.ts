import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'call-transcriber-db';
const DB_VERSION = 1;

export interface CallTranscription {
  id: string;
  date: number;
  speaker1Name: string;
  speaker2Name: string;
  language: string;
  audioBlob1: Blob; // Mic
  audioBlob2: Blob; // System
  mergedTranscriptionJson?: string;
}

interface TranscriberDB extends DBSchema {
  transcriptions: {
    key: string;
    value: CallTranscription;
    indexes: { 'by-date': number };
  };
}

let dbPromise: Promise<IDBPDatabase<TranscriberDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<TranscriberDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('transcriptions', { keyPath: 'id' });
        store.createIndex('by-date', 'date');
      },
    });
  }
  return dbPromise;
};

// --- Transcriptions Operations ---

export async function getAllTranscriptions(): Promise<CallTranscription[]> {
  const db = await getDB();
  return db.getAllFromIndex('transcriptions', 'by-date');
}

export async function getTranscriptionById(id: string): Promise<CallTranscription | undefined> {
  const db = await getDB();
  return db.get('transcriptions', id);
}

export async function saveTranscription(transcription: CallTranscription): Promise<void> {
  const db = await getDB();
  await db.put('transcriptions', transcription);
}

export async function deleteTranscription(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transcriptions', id);
}
