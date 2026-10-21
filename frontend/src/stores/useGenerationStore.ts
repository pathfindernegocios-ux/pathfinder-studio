import { create } from 'zustand';
import type { GenerationInfo, LogEntry } from '../types';

type ModelKey = string;

interface GenerationState {
  // ── Sistema nuevo: por modelo (Pilar 5) ──
  generationInfoByModel: Record<ModelKey, GenerationInfo | null>;
  logsByModel: Record<ModelKey, LogEntry[]>;
  isLoadingByModel: Record<ModelKey, boolean>;

  // ── Compat: modelo activo (puente de migración) ──
  generationInfo: GenerationInfo | null;
  activeModelKey: ModelKey | null;

  // ── Acciones ──
  setGenerationInfoByModel: (
    modelKey: ModelKey,
    updater: GenerationInfo | null | ((prev: GenerationInfo | null) => GenerationInfo | null)
  ) => void;
  // Compat: setea el activeModelKey Y su valor en generationInfoByModel Y en generationInfo
  setGenerationInfo: (
    updater: GenerationInfo | null | ((prev: GenerationInfo | null) => GenerationInfo | null)
  ) => void;

  appendLogsByModel: (modelKey: ModelKey, entries: LogEntry[]) => void;
  clearLogsByModel: (modelKey: ModelKey) => void;
  setIsLoadingByModel: (modelKey: ModelKey, isLoading: boolean) => void;

  setActiveModelKey: (modelKey: ModelKey | null) => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  generationInfoByModel: {},
  logsByModel: {},
  isLoadingByModel: {},
  generationInfo: null,
  activeModelKey: null,

  setGenerationInfoByModel: (modelKey, updater) =>
    set((state) => {
      const prev = state.generationInfoByModel[modelKey] ?? null;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return {
        generationInfoByModel: { ...state.generationInfoByModel, [modelKey]: next },
        // Si este modelo es el activo, actualizar también generationInfo (compat)
        generationInfo: state.activeModelKey === modelKey ? next : state.generationInfo,
      };
    }),

  setGenerationInfo: (updater) => {
    const state = get();
    const key = state.activeModelKey;
    const prev = state.generationInfo;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    if (key) {
      set({
        generationInfo: next,
        generationInfoByModel: { ...state.generationInfoByModel, [key]: next },
      });
    } else {
      set({ generationInfo: next });
    }
  },

  appendLogsByModel: (modelKey, entries) =>
    set((state) => {
      const prev = state.logsByModel[modelKey] ?? [];
      const merged = [...prev, ...entries].slice(-400);
      return { logsByModel: { ...state.logsByModel, [modelKey]: merged } };
    }),

  clearLogsByModel: (modelKey) =>
    set((state) => ({
      logsByModel: { ...state.logsByModel, [modelKey]: [] },
    })),

  setIsLoadingByModel: (modelKey, isLoading) =>
    set((state) => ({
      isLoadingByModel: { ...state.isLoadingByModel, [modelKey]: isLoading },
    })),

  setActiveModelKey: (modelKey) =>
    set((state) => ({
      activeModelKey: modelKey,
      // Al cambiar el modelo activo, sincronizar generationInfo con su valor
      generationInfo: modelKey ? (state.generationInfoByModel[modelKey] ?? null) : null,
    })),
}));
