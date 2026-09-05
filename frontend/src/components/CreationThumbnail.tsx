import { useEffect, useRef, useState } from "react";
import type { Creation } from "../types";
import { palette } from "../styles/tokens";

interface CreationThumbnailProps {
  creation: Creation;
  getDownloadUrl: (id: string) => Promise<string | null>;
}

function getMediaType(creation: Creation): "video" | "image" | "audio" {
  const model = (creation.model || creation.engine || "").toLowerCase();
  if (model.includes("flux") || model.includes("image")) return "image";
  if (model.includes("voice") || model.includes("audio")) return "audio";
  return "video";
}

export function CreationThumbnail({ creation, getDownloadUrl }: CreationThumbnailProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const mediaType = getMediaType(creation);

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
      {
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const renderMedia = () => {
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
      case "video":
        return (
          <video
            src={`${mediaUrl}#t=0.1`}
            muted
            playsInline
            preload="auto"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none",
            }}
            onError={() => setError(true)}
          />
        );
      case "image":
        return (
          <img
            src={mediaUrl}
            alt={creation.prompt || "Creación"}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none",
            }}
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
                opacity: 0.5,
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
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: palette.surfaceSoft,
      }}
    >
      {renderMedia()}
    </div>
  );
}
