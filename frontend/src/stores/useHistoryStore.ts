import { create } from 'zustand';
import type { CapabilityId } from '../types';
import type { SessionItem } from '../context/GenerationContext';

interface HistoryState {
  sessionHistoryByCapability: Record<CapabilityId, SessionItem[]>;
  setHistoryForCap: (cap: CapabilityId, next: SessionItem[]) => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  sessionHistoryByCapability: { image: [], video: [], audio: [] },
  setHistoryForCap: (cap, next) =>
    set((state) => ({
      sessionHistoryByCapability: { ...state.sessionHistoryByCapability, [cap]: next },
    })),
}));
