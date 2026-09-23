// src/lib/theme.ts
//
// Sistema de tema de Pathfinder.
//
// Tema preferido del usuario: 'light' | 'dark' | 'system'
// Tema resuelto (aplicado): 'light' | 'dark'
//
// IMPORTANTE: el dark theme SOLO debe aplicarse cuando hay una
// sesión activa de Supabase. En páginas públicas (landing, pricing,
// auth, etc.) el tema es siempre light.

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "pf_theme_preference";

/**
 * Detecta si hay un token de sesión de Supabase en localStorage.
 * Se usa para decidir si aplicar el tema guardado o forzar light.
 */
export function hasSupabaseSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        return true;
      }
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

export function setStoredThemePreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") {
    return systemPrefersDark() ? "dark" : "light";
  }
  return pref;
}

export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolved;
}

export function applyThemePreference(pref: ThemePreference): ResolvedTheme {
  setStoredThemePreference(pref);
  const resolved = resolveTheme(pref);
  applyTheme(resolved);
  return resolved;
}

/**
 * Inicializa el tema en el boot (antes de React).
 *
 * REGLA CLAVE: solo aplica el tema guardado si hay una sesión activa
 * de Supabase. Sin sesión → siempre light. Esto evita que el dark theme
 * "se escape" a la landing / pricing / auth / páginas legales.
 */
export function initTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";

  if (!hasSupabaseSession()) {
    applyTheme("light");
    return "light";
  }

  const pref = getStoredThemePreference();
  const resolved = resolveTheme(pref);
  applyTheme(resolved);
  return resolved;
}
