// src/hooks/useTheme.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  type ThemePreference,
  type ResolvedTheme,
  getStoredThemePreference,
  resolveTheme,
  applyTheme,
  setStoredThemePreference,
  systemPrefersDark,
} from "../lib/theme";

interface ThemeContextValue {
  /** Preferencia del usuario: 'light' | 'dark' | 'system' */
  preference: ThemePreference;
  /** Tema aplicado actualmente: 'light' | 'dark' */
  resolved: ResolvedTheme;
  /** Cambiar la preferencia */
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    getStoredThemePreference(),
  );
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(preference));

  // Aplicar tema cuando cambia la preferencia
  useEffect(() => {
    const next = resolveTheme(preference);
    setResolved(next);
    applyTheme(next);
  }, [preference]);

  // Si la preferencia es 'system', escuchar cambios del OS
  useEffect(() => {
    if (preference !== "system") return;
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const next: ResolvedTheme = systemPrefersDark() ? "dark" : "light";
      setResolved(next);
      applyTheme(next);
    };

    // Compatibilidad Safari < 14
    if (mql.addEventListener) {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    } else if ((mql as any).addListener) {
      (mql as any).addListener(handleChange);
      return () => (mql as any).removeListener(handleChange);
    }
  }, [preference]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setStoredThemePreference(pref);
    setPreferenceState(pref);
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
