import { useEffect, useRef, useState } from "react";
import type { Creation } from "../types";

interface CreationThumbnailProps {
  creation: Creation;
  onClick?: (id: string) => void;
  getDownloadUrl: (id: string) => Promise<string | null>;
  isHovered?: boolean;
}

function getMediaType(creation: Creation): "video" | "image" | "audio" {
  if (creation.media_type) return creation.media_type;
  const model = (creation.model || creation.engine || "").toLowerCase();
  if (model.includes("flux") || model.includes("krea") || model.includes("image")) return "image";
  if (model.includes("voice") || model.includes("audio")) return "audio";
  return "video";
}

export function CreationThumbnail({
  creation,
  onClick,
  getDownloadUrl,
  isHovered = false,
}: CreationThumbnailProps) {
  const mediaType = getMediaType(creation);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadUrl = async () => {
      if (!creation.id) return;
      const url = await getDownloadUrl(creation.id);
      if (!cancelled) setPreviewUrl(url);
    };
    loadUrl();
    return () => {
      cancelled = true;
    };
  }, [creation.id, getDownloadUrl]);

  useEffect(() => {
    if (mediaType !== "video" || !videoRef.current) return;
    if (isHovered) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isHovered, mediaType]);

  const handleClick = () => {
    if (onClick) onClick(creation.id);
  };

  if (mediaType === "image") {
    return (
      <div
        onClick={handleClick}
        style={{
          cursor: "pointer",
          width: "100%",
          height: "100%",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={creation.prompt}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#222" }} />
        )}
      </div>
    );
  }

  if (mediaType === "audio") {
    return (
      <div
        onClick={handleClick}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 20,
          borderRadius: 12,
          background: "#1C1E22",
        }}
      >
        <span style={{ color: "#fff" }}>🎵 Audio</span>
      </div>
    );
  }

  // Video
  return (
    <div
      onClick={handleClick}
      style={{
        cursor: "pointer",
        width: "100%",
        height: "100%",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        src={previewUrl ?? undefined}
      />
    </div>
  );
}