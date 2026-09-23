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
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * Si es false, el dark theme NO se aplica (siempre light).
   * Se usa para páginas públicas (landing, pricing, auth, etc.).
   * Default: true (para compatibilidad).
   */
  enabled?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  enabled = true,
}) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    getStoredThemePreference(),
  );
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    enabled ? resolveTheme(getStoredThemePreference()) : "light",
  );

  // Aplicar tema cuando cambia la preferencia o el flag enabled
  useEffect(() => {
    if (!enabled) {
      applyTheme("light");
      setResolved("light");
      return;
    }
    const next = resolveTheme(preference);
    setResolved(next);
    applyTheme(next);
  }, [preference, enabled]);

  // Si la preferencia es 'system' Y el tema está habilitado,
  // escuchar cambios del OS
  useEffect(() => {
    if (!enabled || preference !== "system") return;
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const next: ResolvedTheme = systemPrefersDark() ? "dark" : "light";
      setResolved(next);
      applyTheme(next);
    };

    if (mql.addEventListener) {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    } else if ((mql as any).addListener) {
      (mql as any).addListener(handleChange);
      return () => (mql as any).removeListener(handleChange);
    }
  }, [preference, enabled]);

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
