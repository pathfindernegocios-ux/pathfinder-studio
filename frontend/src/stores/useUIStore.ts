// src/stores/useUIStore.ts
// Estado de UI global: sidebar, tema de Studio.
// Los 3 temas (space/dark/light) SOLO se aplican dentro de /studio.
// Fuera de Studio, el `data-theme` no se setea y aplica el :root legacy.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type StudioTheme = 'space' | 'dark' | 'light';

interface UIState {
  sidebarCollapsed: boolean;
  studioTheme: StudioTheme;

  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setStudioTheme: (theme: StudioTheme) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      studioTheme: 'space',

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setStudioTheme: (studioTheme) => set({ studioTheme }),
    }),
    {
      name: 'pf-ui-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
