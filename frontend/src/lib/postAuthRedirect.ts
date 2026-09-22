// src/lib/postAuthRedirect.ts
//
// Preserva la intención del usuario a través del flujo de OAuth.
// Ej: usuario en /pricing → "Iniciar sesión para pagar" → guarda "/pricing"
//     → vuelve del login → se lo redirige a /pricing en vez de /studio.

const KEY = "pf_post_auth_redirect";

export function setPostAuthRedirect(path: string): void {
  try {
    if (path.startsWith("/")) {
      localStorage.setItem(KEY, path);
    }
  } catch (e) {
    console.warn("[postAuthRedirect] set failed:", e);
  }
}

/**
 * Lee el redirect pendiente y lo borra.
 * Solo debe llamarse cuando estamos seguros de que vamos a usar el valor
 * (para no perderlo en un path de error).
 */
export function consumePostAuthRedirect(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v) localStorage.removeItem(KEY);
    return v;
  } catch (e) {
    console.warn("[postAuthRedirect] consume failed:", e);
    return null;
  }
}

/**
 * Lee el redirect sin borrarlo.
 * Útil para decidir si hay una intención pendiente antes de un paso intermedio
 * (ej: onboarding) que va a consumirlo más adelante.
 */
export function peekPostAuthRedirect(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
