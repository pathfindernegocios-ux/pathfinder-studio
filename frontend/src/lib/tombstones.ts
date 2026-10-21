// src/lib/tombstones.ts
//
// Sistema de tombstones (lápidas) para evitar que items borrados
// "revivan" al hacer F5 o al recibir eventos de Realtime retrasados.
//
// Persistencia: localStorage (síncrono, disponible antes de IndexedDB).
// Tope: 500 entradas (LRU — al llegar al límite, se descartan las más viejas).

const STORAGE_KEY = 'pf_deleted_items_v2';
const MAX_TOMBSTONES = 500;

export interface Tombstone {
  id: string;
  deletedAt: number;
}

function load(): Tombstone[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: Tombstone[]): void {
  try {
    const capped = items.slice(-MAX_TOMBSTONES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // silencioso
  }
}

export function addTombstone(id: string): void {
  const items = load();
  if (items.some(t => t.id === id)) return;
  items.push({ id, deletedAt: Date.now() });
  save(items);
}

export function removeTombstone(id: string): void {
  save(load().filter(t => t.id !== id));
}

export function isTombstoned(id: string): boolean {
  return load().some(t => t.id === id);
}

export function getTombstoneSet(): Set<string> {
  return new Set(load().map(t => t.id));
}
