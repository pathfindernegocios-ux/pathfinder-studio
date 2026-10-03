// src/lib/liveCache.ts
//
// Cache efímero en sessionStorage para hidratar componentes con el último
// estado conocido al montar (evita el flash de "offline" + historial vacío
// en F5). TTL por key. Se borra al cerrar el tab o al hacer logout.

const PREFIX = 'pf_live_';

interface Envelope<T> {
  savedAt: number;
  value: T;
}

export function readLiveCache<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > ttlMs) {
      sessionStorage.removeItem(PREFIX + key);
      return null;
    }
    return parsed.value ?? null;
  } catch {
    return null;
  }
}

export function writeLiveCache<T>(key: string, value: T): void {
  try {
    const envelope: Envelope<T> = { savedAt: Date.now(), value };
    sessionStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // sessionStorage lleno o modo privado → noop
  }
}

export function clearLiveCache(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // noop
  }
}
