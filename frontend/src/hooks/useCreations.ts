import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Creation } from "../types";

interface SaveCreationParams {
  tempUrl: string;
  prompt: string;
  seed: number;
  duration: string;
  resolution: string;
  aspectRatio: string;
  guideScale: number;
  matchAudioDur: boolean;
}

export function useCreations() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveCreation = async (params: SaveCreationParams) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const metadata = {
        prompt: params.prompt,
        seed: params.seed,
        duration: params.duration,
        resolution: params.resolution,
        aspect_ratio: params.aspectRatio,
        guide_scale: params.guideScale,
        match_audio_dur: params.matchAudioDur,
        model: "ltx-2.3",
        engine: "LTX-2.3",
      };

      const { data, error } = await supabase.functions.invoke("save-creation", {
        body: {
          tempUrl: params.tempUrl,
          metadata,
        },
      });

      if (error) {
        setSaveError(error.message);
        return null;
      }

      const creation = data.creation as Creation;
      setCreations((prev) => [creation, ...prev]);
      return creation;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar la creación");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const getCreations = async () => {
    const { data, error } = await supabase
      .from("creations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener creaciones:", error.message);
      return [];
    }

    const list = data as Creation[];
    setCreations(list);
    return list;
  };

  const deleteCreation = async (creationId: string) => {
    const { error } = await supabase.functions.invoke("delete-creation", {
      body: { creationId },
    });

    if (error) {
      console.error("Error al eliminar creación:", error.message);
      return false;
    }

    setCreations((prev) => prev.filter((c) => c.id !== creationId));
    return true;
  };

  const getDownloadUrl = async (creationId: string) => {
    const { data, error } = await supabase.functions.invoke("get-creation-download-url", {
      body: { creationId },
    });

    if (error) {
      console.error("Error al obtener URL de descarga:", error.message);
      return null;
    }

    return data.url as string;
  };

  return {
    creations,
    isSaving,
    saveError,
    saveCreation,
    getCreations,
    deleteCreation,
    getDownloadUrl,
  };
}