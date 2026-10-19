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

// ─────────────────────────────────────────────────────────────
// Pruning de caché local (Task 3, refinement v2)
//
// Eviction por prioridad de respaldo + antigüedad. Tier menor = primer
// candidato a salir. El caller provee la semántica vía `classify`:
//   0 = garbage   (error, sin respaldo)
//   1 = ephemeral (temporary sin r2Keys, sin respaldo)
//   2 = partial   (temporary con r2Keys, respaldo en R2)
//   3 = safe      (saved, respaldo completo Supabase + R2)
//   4 = inFlight  (isGenerating o saving) -> NUNCA se evicta
//
// Dentro de cada tier: ascendente por createdAt (más viejo primero).
// Sin `classify`, todo cae en tier 2 (compat. legacy).
// Si algún item no tiene createdAt válido: aborta sin borrar (fail-safe).
// ─────────────────────────────────────────────────────────────

type PrunableItem = { id: string; createdAt?: string | number };

export type EvictionTier = 0 | 1 | 2 | 3 | 4;

export const EVICTION_TIER_NEVER: EvictionTier = 4;

function isValidTimestamp(t: string | number | undefined): boolean {
  if (typeof t === "number") return Number.isFinite(t) && t > 0;
  if (typeof t === "string") return !Number.isNaN(Date.parse(t));
  return false;
}

function getItemTimestamp(t: string | number | undefined): number {
  if (typeof t === "number") return t;
  if (typeof t === "string") {
    const parsed = Date.parse(t);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getItemBytes(item: PrunableItem): number {
  try {
    // JSON en UTF-16: length * 2 = cota superior conservadora.
    return JSON.stringify(item).length * 2;
  } catch {
    return 1024;
  }
}

export async function pruneItems<T extends PrunableItem>(
  opts?: {
    maxItems?: number;
    maxBytes?: number;
    classify?: (item: T) => EvictionTier;
  }
): Promise<{ deleted: number; remaining: number; deletedIds: string[] }> {
  const maxItems = opts?.maxItems ?? 200;
  const maxBytes = opts?.maxBytes ?? 100 * 1024 * 1024;
  const classify: (item: T) => EvictionTier = opts?.classify ?? (() => 2 as EvictionTier);

  try {
    const items = await getAllItems<T>();
    if (items.length === 0) {
      return { deleted: 0, remaining: 0, deletedIds: [] };
    }

    const sizes = new Map<string, number>();
    const tiers = new Map<string, EvictionTier>();
    let totalBytes = 0;
    let allHaveValidTimestamp = true;
    let neverEvictCount = 0;

    for (const it of items) {
      const s = getItemBytes(it);
      sizes.set(it.id, s);
      totalBytes += s;
      const tier = classify(it);
      tiers.set(it.id, tier);
      if (tier === EVICTION_TIER_NEVER) neverEvictCount += 1;
      if (!isValidTimestamp(it.createdAt)) allHaveValidTimestamp = false;
    }

    if (items.length <= maxItems && totalBytes <= maxBytes) {
      return { deleted: 0, remaining: items.length, deletedIds: [] };
    }

    if (!allHaveValidTimestamp) {
      console.warn(
        "[sessionStore.pruneItems] Abortado: items sin `createdAt` válido. " +
        "Ordenar por antigüedad sin timestamps válidos puede borrar datos recientes."
      );
      return { deleted: 0, remaining: items.length, deletedIds: [] };
    }

    // Orden ascendente por (tier, createdAt). Menor tier = primer candidato.
    const sorted = [...items].sort((a, b) => {
      const ta = tiers.get(a.id) ?? 2;
      const tb = tiers.get(b.id) ?? 2;
      if (ta !== tb) return ta - tb;
      return getItemTimestamp(a.createdAt) - getItemTimestamp(b.createdAt);
    });

    const evictableCap = items.length - neverEvictCount;
    const toDelete: string[] = [];
    let remaining = items.length;
    let evicted = 0;

    for (const it of sorted) {
      if (remaining <= maxItems && totalBytes <= maxBytes) break;
      if (evicted >= evictableCap) break;
      const tier = tiers.get(it.id) ?? 2;
      if (tier === EVICTION_TIER_NEVER) continue;
      toDelete.push(it.id);
      totalBytes -= sizes.get(it.id) ?? 0;
      remaining -= 1;
      evicted += 1;
    }

    for (const id of toDelete) await deleteItem(id);
    return { deleted: toDelete.length, remaining, deletedIds: toDelete };
  } catch (err) {
    console.warn("[sessionStore.pruneItems] Error silenciado:", err);
    return { deleted: 0, remaining: 0, deletedIds: [] };
  }
}
