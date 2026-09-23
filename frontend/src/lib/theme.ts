// src/lib/theme.ts
//
// Sistema de tema de Pathfinder.
//
// Tema preferido del usuario: 'light' | 'dark' | 'system'
// Tema resuelto (aplicado): 'light' | 'dark'
//
// Solo aplica a la App (logueado). El marketing siempre usa light.

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "pf_theme_preference";

/**
 * Lee la preferencia guardada. Si no hay nada o es inválida, devuelve 'system'.
 */
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

/**
 * Guarda la preferencia del usuario.
 */
export function setStoredThemePreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
}

/**
 * Detecta si el sistema operativo está en modo oscuro.
 */
export function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Resuelve el tema aplicado según la preferencia.
 */
export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") {
    return systemPrefersDark() ? "dark" : "light";
  }
  return pref;
}

/**
 * Aplica el tema al documento. Setea `data-theme` en `<html>`.
 */
export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolved;
}

/**
 * Aplica el tema según la preferencia + guarda + retorna el resuelto.
 */
export function applyThemePreference(pref: ThemePreference): ResolvedTheme {
  setStoredThemePreference(pref);
  const resolved = resolveTheme(pref);
  applyTheme(resolved);
  return resolved;
}

/**
 * Inicializa el tema en el boot (antes de React).
 * Previene el flash blanco si el usuario prefiere dark.
 */
export function initTheme(): ResolvedTheme {
  const pref = getStoredThemePreference();
  const resolved = resolveTheme(pref);
  applyTheme(resolved);
  return resolved;
}
