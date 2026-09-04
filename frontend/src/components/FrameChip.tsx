import type { ChangeEvent } from "react";
import { palette } from "../styles/tokens";

interface FrameChipProps {
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  preview: string | null;
  label: string;
  sublabel: string;
  emphasized?: boolean;
  onOpen: () => void;
  onClear: () => void;
}

export function FrameChip({
  inputId,
  inputRef,
  onChange,
  preview,
  label,
  sublabel,
  emphasized,
  onOpen,
  onClear,
}: FrameChipProps) {
  const size = emphasized ? 64 : 48;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        {preview ? (
          <div
            onClick={onOpen}
            title={`Ver ${label.toLowerCase()} completa`}
            style={{
              width: size,
              height: size,
              borderRadius: 12,
              overflow: "hidden",
              cursor: "zoom-in",
              border: `1px solid ${emphasized ? "rgba(139,195,74,0.35)" : palette.borderStrong}`,
            }}
          >
            <img src={preview} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <label
            htmlFor={inputId}
            style={{
              width: size,
              height: size,
              borderRadius: 12,
              border: `1px dashed ${emphasized ? palette.borderStrong : palette.border}`,
              background: emphasized ? "rgba(255,255,255,0.02)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: emphasized ? palette.inkMuted : palette.inkFaint,
              fontSize: emphasized ? 18 : 15,
              cursor: "pointer",
            }}
          >
            ＋
          </label>
        )}
        <input id={inputId} type="file" accept="image/*" ref={inputRef} onChange={onChange} style={{ display: "none" }} />
        {preview && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Quitar ${label.toLowerCase()}`}
            title="Quitar"
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(7,8,10,0.9)",
              color: palette.ink,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontSize: emphasized ? 13 : 12,
            fontWeight: 500,
            color: emphasized ? palette.ink : palette.inkMuted,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 10.5, color: palette.inkFaint, whiteSpace: "nowrap", letterSpacing: 0.2 }}>
          {sublabel}
        </span>
      </div>
    </div>
  );
}