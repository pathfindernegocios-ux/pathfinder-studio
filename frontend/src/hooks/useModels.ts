// src/hooks/useModels.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface ModelCatalogEntry {
  id: string;
  name: string;
  family: string | null;
  family_label: string | null;
  capability: 'image' | 'video' | 'audio';
  description: string | null;
  long_description: string | null;
  thumbnail_url: string | null;
  template_path: string;
  is_free: boolean;
  is_available: boolean;
  coming_soon: boolean;
  display_order: number;
  metadata: Record<string, unknown>;
}

export interface UserModelUnlock {
  id: string;
  user_id: string;
  model_id: string;
  source: 'beta' | 'grant' | 'purchase' | 'trial';
  unlocked_at: string;
  expires_at: string | null;
}

export interface UseModelsResult {
  allModels: ModelCatalogEntry[];
  unlocks: UserModelUnlock[];
  unlockedIds: Set<string>;
  ownedModels: ModelCatalogEntry[];
  lockedModels: ModelCatalogEntry[];
  comingSoonModels: ModelCatalogEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useModels(): UseModelsResult {
  const [allModels, setAllModels] = useState<ModelCatalogEntry[]>([]);
  const [unlocks, setUnlocks] = useState<UserModelUnlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Esperar a que la sesión esté restaurada antes de consultar
      // (si no, las queries van como anon y RLS bloquea user_models)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No hay sesión activa');
        setLoading(false);
        return;
      }

      const [modelsRes, unlocksRes] = await Promise.all([
        supabase.from('models').select('*').order('display_order', { ascending: true }),
        supabase.from('user_models').select('*'),
      ]);

      if (modelsRes.error) throw modelsRes.error;
      if (unlocksRes.error) throw unlocksRes.error;

      setAllModels((modelsRes.data ?? []) as ModelCatalogEntry[]);
      setUnlocks((unlocksRes.data ?? []) as UserModelUnlock[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error cargando modelos';
      console.error('[useModels]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unlockedIds = new Set(unlocks.map((u) => u.model_id));
  const ownedModels = allModels.filter((m) => unlockedIds.has(m.id));
  const lockedModels = allModels.filter((m) => !unlockedIds.has(m.id) && !m.coming_soon);
  const comingSoonModels = allModels.filter((m) => m.coming_soon);

  return {
    allModels,
    unlocks,
    unlockedIds,
    ownedModels,
    lockedModels,
    comingSoonModels,
    loading,
    error,
    refresh: fetchData,
  };
}
