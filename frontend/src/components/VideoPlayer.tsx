// src/components/VideoPlayer.tsx
//
// Reproductor de video con overlay inmersivo.
// - Autoplay muted al entregarse. Se detiene en el último frame.
// - Controles custom que aparecen al hover y se desvanecen a los 2s.
// - Barra de progreso, botones mute/fullscreen, tiempo tabular.
// - Sin controles nativos del browser.

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  /** Cómo encaja el video en su contenedor. Default: "cover". */
  objectFit?: "cover" | "contain";
  /** Color de fondo del contenedor. Default: "#000000".
   *  Usar "transparent" cuando el contenedor padre tiene su propio fondo. */
  background?: string;
  /** Aspect ratio del video ("16:9", "9:16", "1:1").
   *  Si se pasa, el contenedor se ajusta a esa proporcion dentro del padre. */
  aspectRatio?: string | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, objectFit = "cover", background = "#000000", aspectRatio = null }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Sincronizar estado de fullscreen ──
  // Cuando el usuario entra/sale de fullscreen nativo, forzamos objectFit "contain"
  // para que el video 9:16 no se recorte en un viewport 16:9.
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── Autoplay muted al montar ──
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    setIsMuted(true);
    v.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [src]);

  // ── Auto-hide de controles ──
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  const handleMouseLeave = useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    setShowControls(false);
  }, []);

  useEffect(() => {
    scheduleHide();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [scheduleHide]);

  // ── Controles ──
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => void 0);
    } else {
      v.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => void 0);
    } else {
      el.requestFullscreen().catch(() => void 0);
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * duration;
    setCurrentTime(v.currentTime);
  }, [duration]);

  const formatTime = (secs: number): string => {
    if (!isFinite(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  // Convierte "16:9" a "16 / 9" para CSS aspect-ratio
  const aspectRatioCss =
    aspectRatio && typeof aspectRatio === "string" && aspectRatio.includes(":") && aspectRatio !== "auto"
      ? aspectRatio.replace(":", " / ")
      : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        background: background,
        borderRadius: "12px",
        overflow: "hidden",
        cursor: showControls ? "default" : "none",
        // Cuando hay aspectRatio, el contenedor se ajusta a la proporcion
        // del video y se centra en el padre. Si no, ocupa todo el espacio.
        ...(aspectRatioCss && !isFullscreen
          ? {
              aspectRatio: aspectRatioCss,
              height: "78vh",
              maxWidth: "100%",
              margin: "0 auto",
            }
          : {
              width: "100%",
              height: "100%",
            }),
      }}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="metadata"
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        style={{
          width: "100%",
          height: "100%",
          objectFit: isFullscreen ? "contain" : objectFit,
          display: "block",
        }}
      />

      {/* Overlay con gradiente sutil arriba y abajo para legibilidad */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.75) 100%)",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.25s ease",
          pointerEvents: "none",
        }}
      />

      {/* Botón play/pause central */}
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Pausar" : "Reproducir"}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.25s ease, transform 0.15s ease",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.08)";
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.75)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(0, 0, 0, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.55)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.5)";
        }}
      >
        {isPlaying ? (
          <Pause size={22} fill="currentColor" strokeWidth={0} />
        ) : (
          <Play size={22} fill="currentColor" strokeWidth={0} style={{ marginLeft: "3px" }} />
        )}
      </button>

      {/* Controles inferiores */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.25s ease",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {/* Barra de progreso */}
        <div
          onClick={handleSeek}
          style={{
            position: "relative",
            height: "4px",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.2)",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${progress * 100}%`,
              background: "#FFFFFF",
              borderRadius: "9999px",
              transition: "width 0.08s linear",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${progress * 100}%`,
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "none",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.6)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Fila de botones y tiempo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.9)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.02em",
              textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={toggleMute}
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.9)";
              }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <button
              onClick={handleFullscreen}
              aria-label="Pantalla completa"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.9)";
              }}
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VideoPlayer);
