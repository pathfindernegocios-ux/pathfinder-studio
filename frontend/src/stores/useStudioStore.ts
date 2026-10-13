// src/stores/useStudioStore.ts
// Estado global del Studio. Reemplaza GenerationContext + estados locales dispersos.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CapabilityId = 'image' | 'video' | 'audio';

interface StudioState {
  activeModelId: string | null;
  activeCapability: CapabilityId;
  storyboardMode: 'single' | 'storyboard';
  fcmExpanded: boolean;

  setActiveModel: (id: string | null, capability: CapabilityId) => void;
  setStoryboardMode: (mode: 'single' | 'storyboard') => void;
  toggleFcm: () => void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      activeModelId: null,
      activeCapability: 'image',
      storyboardMode: 'single',
      fcmExpanded: true,

      setActiveModel: (id, capability) =>
        set({ activeModelId: id, activeCapability: capability }),

      setStoryboardMode: (mode) =>
        set({ storyboardMode: mode }),

      toggleFcm: () =>
        set((s) => ({ fcmExpanded: !s.fcmExpanded })),
    }),
    {
      name: 'pf-studio-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeModelId: state.activeModelId,
        activeCapability: state.activeCapability,
        storyboardMode: state.storyboardMode,
      }),
    }
  )
);
