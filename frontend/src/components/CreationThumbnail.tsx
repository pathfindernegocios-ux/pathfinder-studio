import { useEffect, useRef, useState } from "react";
import type { Creation } from "../types";
import { palette } from "../styles/tokens";

interface CreationThumbnailProps {
  creation: Creation;
  getDownloadUrl: (id: string) => Promise<string | null>;
  /** Cuando es true (cursor sobre la tarjeta), se reproduce una vista previa silenciosa en bucle. */
  isHovered?: boolean;
}

function getMediaType(creation: Creation): "video" | "image" | "audio" {
  const model = (creation.model || creation.engine || "").toLowerCase();
  if (model.includes("flux") || model.includes("image")) return "image";
  if (model.includes("voice") || model.includes("audio")) return "audio";
  return "video";
}

const shimmerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  background: "linear-gradient(110deg, #1a1d21 0%, #2a2d31 50%, #1a1d21 100%)",
  backgroundSize: "200% 100%",
  animation: "pfShimmer 1.5s ease-in-out infinite",
};

export function CreationThumbnail({ creation, getDownloadUrl, isHovered = false }: CreationThumbnailProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  // Guard con ref (no con una variable "cancelled" local al efecto): asegura
  // que la petición de la URL firmada se dispare EXACTAMENTE una vez para
  // esta instancia, sin importar cuántas veces React vuelva a ejecutar el
  // efecto (por ejemplo, por el doble-invocado de StrictMode en desarrollo,
  // o porque `getDownloadUrl` cambie de identidad si el padre se re-renderiza).
  // Antes, un `cancelled=true` puesto por una limpieza "de mentira" (StrictMode)
  // descartaba silenciosamente el resultado de una petición real que sí iba
  // a resolver, dejando `isLoading` en true para siempre.
  const fetchStartedRef = useRef(false);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const [videoReady, setVideoReady] = useState(false); // ya se decodificó y se ve un frame real

  const mediaType = getMediaType(creation);

  // Lazy loading: observar visibilidad antes de pedir la URL firmada.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(el);
          }
        });
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Obtener URL firmada (válida ~300s) cuando la miniatura entra en viewport.
  // Disparo único garantizado por fetchStartedRef; el resultado solo se
  // descarta si el componente ya se desmontó de verdad (isMountedRef), nunca
  // por una limpieza de efecto "de mentira".
  useEffect(() => {
    if (!isVisible) return;
    if (fetchStartedRef.current) return;
    if (mediaUrl || error) return;
    fetchStartedRef.current = true;

    setIsLoading(true);

    getDownloadUrl(creation.id)
      .then((url) => {
        if (!isMountedRef.current) return;
        if (url) {
          setMediaUrl(url);
        } else {
          setError(true);
        }
      })
      .catch((err) => {
        console.error("[CreationThumbnail] error obteniendo URL firmada", creation.id, err);
        if (isMountedRef.current) setError(true);
      })
      .finally(() => {
        if (isMountedRef.current) setIsLoading(false);
      });
  }, [isVisible, creation.id, getDownloadUrl, mediaUrl, error]);

  // Forzar la decodificación de un frame real. Un <video> sin interacción no
  // necesariamente muestra nada por sí solo: hay que decirle por código que
  // busque un instante (currentTime) o que reproduzca brevemente. No usamos
  // fragmentos de URL (#t=0.1) porque su soporte es inconsistente entre
  // navegadores y depende de que el servidor acepte peticiones Range.
  useEffect(() => {
    if (mediaType !== "video" || !mediaUrl) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let seekedFired = false;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const targetTime = () => (video.duration && isFinite(video.duration) ? Math.min(0.15, video.duration / 2) : 0.15);

    const trySeek = () => {
      if (cancelled) return;
      try {
        video.currentTime = targetTime();
      } catch (err) {
        console.warn("[CreationThumbnail] no se pudo hacer seek()", creation.id, err);
      }
    };

    const onLoadedMetadata = () => trySeek();
    const onLoadedData = () => trySeek();
    const onSeeked = () => {
      if (cancelled) return;
      seekedFired = true;
      setVideoReady(true);
    };
    const onError = () => {
      const mediaErr = video.error;
      console.error(
        "[CreationThumbnail] error de <video>",
        creation.id,
        "code:",
        mediaErr?.code,
        "message:",
        mediaErr?.message
      );
      if (!cancelled) setError(true);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);

    // Salvaguarda: si el servidor no soporta Range requests, `seeked` puede no
    // disparar nunca aunque el video sí cargue. En ese caso forzamos un frame
    // reproduciendo brevemente y pausando de inmediato (no requiere Range).
    const fallbackTimer = window.setTimeout(() => {
      if (cancelled || seekedFired) return;
      video
        .play()
        .then(() => {
          window.setTimeout(() => {
            if (cancelled) return;
            video.pause();
            setVideoReady(true);
          }, 80);
        })
        .catch((err) => {
          console.warn("[CreationThumbnail] fallback play() falló", creation.id, err);
        });
    }, 1500);

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
  }, [mediaUrl, mediaType, creation.id]);

  // Reproducir/pausar la vista previa según el hover.
  useEffect(() => {
    if (mediaType !== "video" || !mediaUrl) return;
    const video = videoRef.current;
    if (!video) return;
    if (isHovered) {
      video.loop = true;
      video.play().catch(() => {});
    } else {
      video.loop = false;
      video.pause();
      try {
        video.currentTime = video.duration && isFinite(video.duration) ? Math.min(0.15, video.duration / 2) : 0.15;
      } catch {
        // no pasa nada si todavía no hay suficiente data para buscar
      }
    }
  }, [isHovered, mediaUrl, mediaType]);

  if (error) {
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: palette.surfaceSoft }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1a1d21 0%, #111315 100%)",
            color: palette.inkFaint,
            fontSize: 24,
          }}
        >
          {mediaType === "video" ? "▶" : mediaType === "image" ? "🖼" : "🎵"}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden", background: palette.surfaceSoft }}>
      {mediaType === "video" && (
        <>
          {(!videoReady || isLoading || !mediaUrl) && <div style={{ position: "absolute", inset: 0, ...shimmerStyle }} />}
          {mediaUrl && (
            <video
              ref={videoRef}
              src={mediaUrl}
              muted
              playsInline
              preload="auto"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
                opacity: videoReady ? 1 : 0,
                transition: "opacity 0.2s ease",
              }}
            />
          )}
        </>
      )}

      {mediaType === "image" &&
        (isLoading || !mediaUrl ? (
          <div style={shimmerStyle} />
        ) : (
          <img
            src={mediaUrl}
            alt={creation.prompt || "Imagen"}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
            onError={() => setError(true)}
          />
        ))}

      {mediaType === "audio" &&
        (isLoading || !mediaUrl ? (
          <div style={shimmerStyle} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #1d2126 0%, #101316 100%)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                opacity: isHovered ? 0.85 : 0.5,
                transition: "opacity 0.2s ease",
              }}
            >
              {[4, 12, 8, 16, 10, 6, 14, 8, 12, 4, 10, 6].map((h, i) => (
                <span key={i} style={{ width: 3, height: `${h * 2}px`, borderRadius: 2, background: palette.accentDim }} />
              ))}
            </div>
            <span style={{ fontSize: 32, color: palette.inkFaint, zIndex: 1 }}>🎵</span>
          </div>
        ))}
    </div>
  );
}
