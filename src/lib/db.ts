import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "khethai-db";
const DB_VERSION = 1;

export interface UserProfile {
  phone: string;
  name?: string;
  locale: string;
  createdAt: number;
}

export interface CachedData {
  key: string;
  data: unknown;
  timestamp: number;
  expiresAt: number;
}

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  synced: boolean;
}

type KhethAiDB = IDBPDatabase<{
  user: { key: string; value: UserProfile };
  cache: { key: string; value: CachedData; indexes: { "by-expires": number } };
  syncQueue: {
    key: string;
    value: QueuedAction;
    indexes: { "by-synced": number };
  };
}>;

let dbPromise: Promise<KhethAiDB> | null = null;

function getDB(): Promise<KhethAiDB> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available on the server"));
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("user")) {
          db.createObjectStore("user", { keyPath: "phone" });
        }
        if (!db.objectStoreNames.contains("cache")) {
          const cacheStore = db.createObjectStore("cache", { keyPath: "key" });
          cacheStore.createIndex("by-expires", "expiresAt");
        }
        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", { keyPath: "id" });
          syncStore.createIndex("by-synced", "synced");
        }
      },
    }) as Promise<KhethAiDB>;
  }

  return dbPromise;
}

export async function saveUser(user: UserProfile): Promise<void> {
  const db = await getDB();
  await db.put("user", user);
}

export async function getUser(phone: string): Promise<UserProfile | undefined> {
  const db = await getDB();
  return db.get("user", phone);
}

export async function cacheData(
  key: string,
  data: unknown,
  ttlMs: number = 24 * 60 * 60 * 1000
): Promise<void> {
  const db = await getDB();
  const now = Date.now();
  await db.put("cache", {
    key,
    data,
    timestamp: now,
    expiresAt: now + ttlMs,
  });
}

export async function getCachedData<T = unknown>(key: string): Promise<T | null> {
  const db = await getDB();
  const entry = await db.get("cache", key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    await db.delete("cache", key);
    return null;
  }
  return entry.data as T;
}

export async function addToSyncQueue(
  type: string,
  payload: unknown
): Promise<void> {
  const db = await getDB();
  await db.put("syncQueue", {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    payload,
    timestamp: Date.now(),
    synced: false,
  });
}

export async function getUnsyncedActions(): Promise<QueuedAction[]> {
  const db = await getDB();
  const all = await db.getAll("syncQueue");
  return all.filter((a) => !a.synced);
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDB();
  const action = await db.get("syncQueue", id);
  if (action) {
    action.synced = true;
    await db.put("syncQueue", action);
  }
}

export async function clearExpiredCache(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("cache", "readwrite");
  const index = tx.store.index("by-expires");
  let cursor = await index.openCursor(IDBKeyRange.upperBound(Date.now()));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
