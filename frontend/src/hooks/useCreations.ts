import { useState, useCallback } from "react";
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
  mediaType: "image" | "video" | "audio";
  modelId?: string;
}

export function useCreations() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveCreation = useCallback(async (params: SaveCreationParams) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const modelId = params.modelId || (params.mediaType === "image" ? "krea-2-turbo" : "ltx-2.3");

      const metadata = {
        prompt: params.prompt,
        seed: params.seed,
        duration: params.duration,
        resolution: params.resolution,
        aspect_ratio: params.aspectRatio,
        guide_scale: params.guideScale,
        match_audio_dur: params.matchAudioDur,
        media_type: params.mediaType,
        model_id: modelId,
        model: modelId,
        engine: "Wan2GP",
      };

      const { data: presignData, error: presignError } = await supabase.functions.invoke(
        "save-creation",
        { body: { metadata } }
      );

      if (presignError) {
        setSaveError(presignError.message);
        return null;
      }

      const { creationId, uploadUrl, storageKey } = presignData;

      const fileRes = await fetch(params.tempUrl);
      if (!fileRes.ok) {
        setSaveError("No se pudo descargar el archivo temporal.");
        return null;
      }
      const blob = await fileRes.blob();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": params.mediaType === "image" ? "image/png" : "video/mp4",
        },
      });

      if (!putRes.ok) {
        setSaveError("No se pudo subir el archivo a R2.");
        return null;
      }

      const { data: completeData, error: completeError } = await supabase.functions.invoke(
        "complete-creation",
        {
          body: { creationId, storageKey, metadata },
        }
      );

      if (completeError) {
        setSaveError(completeError.message);
        return null;
      }

      const creation = completeData.creation as Creation;
      setCreations((prev) => [creation, ...prev]);
      return creation;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar la creación");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const getCreations = useCallback(async () => {
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
  }, []);

  const deleteCreation = useCallback(async (creationId: string) => {
    const { error } = await supabase.functions.invoke("delete-creation", {
      body: { creationId },
    });

    if (error) {
      console.error("Error al eliminar creación:", error.message);
      return false;
    }

    setCreations((prev) => prev.filter((c) => c.id !== creationId));
    return true;
  }, []);

  const getDownloadUrl = useCallback(async (creationId: string) => {
    const { data, error } = await supabase.functions.invoke("get-creation-download-url", {
      body: { creationId },
    });

    if (error) {
      console.error("Error al obtener URL de descarga:", error.message);
      return null;
    }

    return data.url as string;
  }, []);

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