// src/lib/voluntaryLogout.ts
//
// Distingue entre un logout voluntario (el user apreta "Cerrar sesion")
// y un SIGNED_OUT involuntario (el backend revoco la sesion server-side).
//
// Supabase JS no expone la razon del SIGNED_OUT. Usamos un flag con TTL
// corto: si el user apreta logout, marcamos "voluntario" por 5 segundos.
// Cuando llega el SIGNED_OUT, si el flag esta fresco, es voluntario y no
// disparamos el modal. Si no, es revocacion y lo disparamos.

const KEY = 'pf_voluntary_logout_at';
const TTL_MS = 5000;

export function markVoluntaryLogout(): void {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* noop */
  }
}

export function wasRecentVoluntaryLogout(): boolean {
  try {
    const at = Number(sessionStorage.getItem(KEY) || '0');
    return Date.now() - at < TTL_MS;
  } catch {
    return false;
  }
}

export function clearVoluntaryLogout(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
