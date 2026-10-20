import { useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Creation } from "../types";

interface SaveCreationParams {
  tempUrl?: string;
  r2Key?: string;
  clientRequestId?: string;
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

// Fetch paginado de `creations` con cursor por created_at DESC.
// Función pura (no hook) para permitir su uso desde GenerationContext
// sin acoplar al estado del hook. Filtra server-side:
//   status = 'ready' AND expires_at > now() AND media_type = capability (si se pasa)
// Cursor: created_at del último item devuelto por la página anterior.
// Retorna hasta `limit` items + flag hasMore (probe limit+1).
export async function fetchCreationsPage(
  opts?: { cursor?: string; limit?: number; capability?: "image" | "video" | "audio"; modelId?: string }
): Promise<{ items: Creation[]; hasMore: boolean; nextCursor: string | null }> {
  const limit = opts?.limit ?? 50;
  const cursor = opts?.cursor;
  const capability = opts?.capability;
  const modelId = opts?.modelId;

  try {
    let query = supabase
      .from("creations")
      .select("*")
      .eq("status", "ready")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (capability) query = query.eq("media_type", capability);
    if (modelId) query = query.eq("model_id", modelId);
    if (cursor) query = query.lt("created_at", cursor);

    const { data, error } = await query;
    if (error) return { items: [], hasMore: false, nextCursor: null };

    const rows = (data as Creation[]) ?? [];
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = items.length > 0 ? items[items.length - 1].created_at : null;

    return { items, hasMore, nextCursor };
  } catch {
    return { items: [], hasMore: false, nextCursor: null };
  }
}

export function useCreations() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveCreation = useCallback(async (params: SaveCreationParams & { r2Key?: string; clientRequestId?: string }) => {
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

      // ── FLUJO NUEVO: Si tenemos r2Key, solo insertamos en la DB ──
      if (params.r2Key) {
        const { data, error } = await supabase.functions.invoke(
          "save-creation",
          { body: { metadata, r2_key: params.r2Key, client_request_id: params.clientRequestId } }
        );
        if (error) throw error;
        setCreations((prev) => [data.creation, ...prev]);
        return data.creation;
      }

      // ── FLUJO VIEJO: Presign y subida ──
      const { data: presignData, error: presignError } = await supabase.functions.invoke(
        "save-creation",
        { body: { metadata } }
      );

      if (presignError) {
        setSaveError(presignError.message);
        return null;
      }

      const { creationId, uploadUrl, storageKey } = presignData;

      if (!params.tempUrl) throw new Error('tempUrl es requerido para este flujo');
      const fileRes = await fetch(params.tempUrl);
      if (!fileRes.ok) {
        setSaveError("No se pudo descargar el archivo temporal.");
        return null;
      }
      const blob = await fileRes.blob();

      const CONTENT_TYPE_BY_MEDIA: Record<string, string> = {
        image: "image/png",
        video: "video/mp4",
        audio: "audio/wav",
      };
      const contentType = CONTENT_TYPE_BY_MEDIA[params.mediaType] || "application/octet-stream";

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": contentType,
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
      void 0;
      return [];
    }

    // FIX: Guardar contra filas inválidas. Puede venir un `null` si
    // Supabase devuelve una fila con error de mapeo, o si el query
    // devuelve `[null]`. Sin este guard, `c.id` explota en deleteCreation.
    if (!Array.isArray(data)) {
      setCreations([]);
      return [];
    }

    // Filtro client-side: solo filas válidas con status 'ready' y expiración futura.
    const now = Date.now();
    const list = (data as Creation[]).filter(
      (c): c is Creation =>
        !!c &&
        typeof c === 'object' &&
        typeof c.id === 'string' &&
        c.status === 'ready' &&
        !!c.expires_at &&
        new Date(c.expires_at).getTime() > now
    );
    setCreations(list);
    return list;
  }, []);

  const deleteCreation = useCallback(async (creationId: string) => {
    const { error } = await supabase.functions.invoke("delete-creation", {
      body: { creationId },
    });

    if (error) {
      void 0;
      return false;
    }

    // FIX: Blindar contra items undefined en el state.
    setCreations((prev) => prev.filter((c) => c && c.id !== creationId));
    return true;
  }, []);

  const getDownloadUrl = useCallback(async (creationId: string) => {
    const { data, error } = await supabase.functions.invoke("get-creation-download-url", {
      body: { creationId },
    });

    if (error) {
      void 0;
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