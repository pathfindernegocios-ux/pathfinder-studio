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

const coverStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  pointerEvents: "none",
};

export function CreationThumbnail({ creation, getDownloadUrl, isHovered = false }: CreationThumbnailProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

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

  // Obtener URL firmada (válida ~300s) solo cuando la miniatura entra en viewport.
  useEffect(() => {
    if (!isVisible || mediaUrl || isLoading || error) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const url = await getDownloadUrl(creation.id);
        if (!cancelled && url) {
          setMediaUrl(url);
        } else if (!cancelled) {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isVisible, creation.id, getDownloadUrl, mediaUrl, isLoading, error]);

  // Captura de frame por canvas: es solo una mejora progresiva (evita re-decodificar
  // el video cada vez). Si falla por CORS (canvas "tainted" porque el bucket de R2
  // no manda Access-Control-Allow-Origin en la URL firmada), no rompe nada: el
  // <video> real que se renderiza más abajo sigue funcionando como miniatura,
  // porque MOSTRAR un video no requiere leer sus píxeles, solo decodificarlo.
  useEffect(() => {
    if (!mediaUrl || mediaType !== "video" || thumbnail) return;

    let cancelled = false;
    let finished = false;

    const video = document.createElement("video");
    video.crossOrigin = "anonymous"; // necesario para poder leer píxeles vía canvas
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    // Se añade al DOM (casi invisible) en lugar de quedar totalmente desconectado:
    // algunos navegadores retrasan o nunca disparan eventos de carga en <video>
    // elementos que no están montados en el documento.
    video.style.position = "fixed";
    video.style.width = "2px";
    video.style.height = "2px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    video.style.top = "-9999px";
    video.style.left = "-9999px";
    document.body.appendChild(video);
    video.src = mediaUrl;

    const cleanup = () => {
      if (finished) return;
      finished = true;
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      window.clearTimeout(safetyTimeout);
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
    };

    const capture = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext("2d");
        if (ctx && canvas.width && canvas.height) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnail(canvas.toDataURL("image/jpeg", 0.7));
        }
      } catch {
        // Canvas contaminado por CORS: se ignora silenciosamente. El <video>
        // visible ya está haciendo el trabajo de mostrar el primer frame.
      } finally {
        cleanup();
      }
    };

    const onLoadedData = () => {
      if (cancelled) return;
      try {
        video.currentTime = Math.min(0.1, video.duration > 0 ? video.duration / 2 : 0.1);
      } catch {
        capture();
      }
    };
    const onSeeked = () => capture();
    const onError = () => {
      // Un error real de red/permmisos aquí no significa que el <video> visible
      // también vaya a fallar (a veces el navegador es más permisivo mostrando
      // el elemento que permitiendo su descarga programática), así que solo
      // dejamos de intentar capturar; no marcamos error global.
      cleanup();
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);

    // Salvaguarda: si la URL firmada tarda o el evento nunca llega, no bloqueamos
    // nada — simplemente dejamos de intentar la captura por canvas.
    const safetyTimeout = window.setTimeout(cleanup, 4000);

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [mediaUrl, mediaType, thumbnail]);

  const renderContent = () => {
    if (error) {
      return (
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
      );
    }

    if (isLoading || !mediaUrl) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(110deg, #1a1d21 0%, #2a2d31 50%, #1a1d21 100%)",
            backgroundSize: "200% 100%",
            animation: "pfShimmer 1.5s ease-in-out infinite",
          }}
        />
      );
    }

    switch (mediaType) {
      case "video": {
        // Vista previa en vivo mientras el cursor está sobre la tarjeta.
        if (isHovered) {
          return (
            <video
              key={`preview-${mediaUrl}`}
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              style={coverStyle}
              onError={() => setError(true)}
            />
          );
        }
        // Miniatura estática ya capturada (mejora progresiva vía canvas).
        if (thumbnail) {
          return <img src={thumbnail} alt={creation.prompt || "Video"} loading="lazy" style={coverStyle} />;
        }
        // Fallback confiable: el <video> real posicionado en su primer frame.
        // No depende de leer píxeles (no usa canvas), así que funciona incluso
        // si la URL firmada no trae cabeceras CORS para lectura por canvas.
        return (
          <video
            key={`frame-${mediaUrl}`}
            src={`${mediaUrl}#t=0.1`}
            muted
            playsInline
            preload="metadata"
            style={coverStyle}
            onError={() => setError(true)}
          />
        );
      }
      case "image":
        return (
          <img
            src={mediaUrl}
            alt={creation.prompt || "Imagen"}
            loading="lazy"
            style={coverStyle}
            onError={() => setError(true)}
          />
        );
      case "audio":
        return (
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
                <span
                  key={i}
                  style={{
                    width: 3,
                    height: `${h * 2}px`,
                    borderRadius: 2,
                    background: palette.accentDim,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 32, color: palette.inkFaint, zIndex: 1 }}>🎵</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden", background: palette.surfaceSoft }}>
      {renderContent()}
    </div>
  );
}
