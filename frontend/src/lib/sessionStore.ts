// src/lib/sessionStore.ts
//
// Persistencia del historial de generaciones en IndexedDB.
// Sobrevive a refresh, cierre de pestaña y logout (hasta que el caller limpie).
// Reemplaza el uso de liveCache (sessionStorage) para studio_history.
//
// Reglas:
//   - Sin TTL. Los items viven hasta que el user los borre o la DB se purgue.
//   - Sin truncación. Todos los items se guardan.
//   - Todos los errores se silencian: IndexedDB puede fallar en modo privado,
//     y no queremos romper el Studio por eso.

const DB_NAME = "pf_session";
const DB_VERSION = 1;
const STORE = "items";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function getAllItems<T>(): Promise<T[]> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, "readonly");
      const req = transaction.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function putItems<T>(items: T[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      for (const item of items) store.put(item);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    // silencioso
  }
}

export async function deleteItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {}
}

export async function clearAll(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {}
}
