import type { CSSProperties } from "react";

export const fontDisplay = "'Bricolage Grotesque', 'Inter', sans-serif";
export const fontUI = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const palette = {
  void: "#07080A",
  voidGradient:
    "radial-gradient(circle at 15% -10%, rgba(139,195,74,0.07), transparent 40%), radial-gradient(circle at 100% 0%, rgba(139,195,74,0.04), transparent 45%), radial-gradient(circle at 50% 120%, rgba(255,255,255,0.02), transparent 50%), #07080A",
  surface: "rgba(24,26,23,0.55)",
  surfaceStrong: "rgba(14,15,13,0.78)",
  surfaceSoft: "rgba(255,255,255,0.035)",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.14)",
  ink: "#F3F5F1",
  inkMuted: "#9BA39A",
  inkFaint: "#5C645C",
  accent: "#8BC34A",
  accentStrong: "#A6DB6B",
  accentDim: "rgba(139,195,74,0.14)",
  danger: "#E5484D",
  dangerDim: "rgba(229,72,77,0.14)",
};

export const NAV_ITEMS: { key: string; label: string; enabled: boolean }[] = [
  { key: "studio", label: "Studio", enabled: true },
  { key: "projects", label: "Projects", enabled: true },
  { key: "creations", label: "Mis creaciones", enabled: true },
  { key: "assets", label: "Assets", enabled: true },
  { key: "academy", label: "Academy", enabled: true },
  { key: "station", label: "Station", enabled: true },
  { key: "settings", label: "Settings", enabled: true },
];

export const glass: CSSProperties = {
  background: palette.surface,
  border: `1px solid ${palette.border}`,
  borderRadius: 20,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
};

export const inputBase: CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${palette.border}`,
  borderRadius: 12,
  padding: "11px 14px",
  color: palette.ink,
  fontFamily: fontUI,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

export const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 7,
  fontSize: 13,
  fontWeight: 500,
  color: palette.inkMuted,
};

export const pillButton = (active: boolean): CSSProperties => ({
  padding: "8px 15px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 500,
  fontFamily: fontUI,
  cursor: "pointer",
  border: `1px solid ${active ? palette.accent : palette.border}`,
  background: active ? palette.accentDim : palette.surfaceSoft,
  color: active ? palette.accentStrong : palette.inkMuted,
  transition: "all 0.15s ease",
});

/* ============================================================
   Pastillas de estado de generación (preparando / generando /
   completo / error / cancelado). Compartidas por Video e Image.
   ============================================================ */
export type GenerationStateKind = "preparing" | "running" | "complete" | "error" | "cancelled";

export const statePillStyle = (state: GenerationStateKind): CSSProperties => {
  const map: Record<GenerationStateKind, { color: string; bg: string; border: string }> = {
    preparing: { color: palette.inkMuted, bg: palette.surfaceSoft, border: palette.border },
    running: { color: palette.accentStrong, bg: palette.accentDim, border: palette.accent },
    complete: { color: palette.accentStrong, bg: palette.accentDim, border: palette.accent },
    error: { color: palette.danger, bg: palette.dangerDim, border: palette.danger },
    cancelled: { color: palette.inkFaint, bg: palette.surfaceSoft, border: palette.border },
  };
  const s = map[state];
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 12px",
    borderRadius: 999,
    fontFamily: fontUI,
    fontSize: 12,
    fontWeight: 600,
    color: s.color,
    background: s.bg,
    border: `1px solid ${s.border}`,
  };
};

/* ============================================================
   IMAGE STUDIO — REDISEÑO
   Tokens para la superficie creativa (prompt + referencias),
   las tarjetas Standard/Premium, la tira de referencias y el
   resultado de imagen. Reemplazan por completo a los tokens
   anteriores de Image (sectionPanel, modelToggle*, accordion*),
   que quedan retirados por no tener uso tras el rediseño.
   ============================================================ */

/* ---------- Tier cards (Standard / Premium) ---------- */
export const tierCard = (active: boolean): CSSProperties => ({
  flex: 1,
  minWidth: 220,
  textAlign: "left",
  cursor: "pointer",
  padding: "18px 20px",
  borderRadius: 18,
  border: `1px solid ${active ? palette.accent : palette.border}`,
  background: active
    ? "linear-gradient(180deg, rgba(139,195,74,0.10), rgba(139,195,74,0.03))"
    : palette.surfaceSoft,
  transition: "border-color 0.18s ease, background 0.18s ease, transform 0.15s ease",
  fontFamily: fontUI,
});

export const tierCardTitle = (active: boolean): CSSProperties => ({
  fontFamily: fontDisplay,
  fontSize: 16,
  fontWeight: 600,
  color: active ? palette.accentStrong : palette.ink,
  marginBottom: 3,
});

export const tierCardEngine: CSSProperties = {
  fontSize: 11.5,
  color: palette.inkFaint,
  marginBottom: 8,
  letterSpacing: 0.2,
};

export const tierCardTagline: CSSProperties = {
  fontSize: 12.5,
  color: palette.inkMuted,
  lineHeight: 1.5,
};

/* ---------- Creative surface (Prompt + References) ---------- */
export const creativeSurface: CSSProperties = {
  ...glass,
  padding: "26px 28px 22px",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

export const promptTextarea: CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  outline: "none",
  resize: "none",
  color: palette.ink,
  fontFamily: fontUI,
  fontSize: 19,
  lineHeight: 1.55,
  minHeight: 96,
};

export const negativePromptToggle: CSSProperties = {
  alignSelf: "flex-start",
  background: "transparent",
  border: "none",
  color: palette.inkFaint,
  fontSize: 12,
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

/* ---------- Reference tray ---------- */
export const referenceTrayLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: palette.inkMuted,
  letterSpacing: 0.3,
  textTransform: "uppercase",
  marginBottom: 10,
};

export const referenceThumbSize = 84;

export const referenceThumb: CSSProperties = {
  position: "relative",
  width: referenceThumbSize,
  height: referenceThumbSize,
  borderRadius: 12,
  overflow: "hidden",
  border: `1px solid ${palette.border}`,
  background: palette.surfaceSoft,
  flexShrink: 0,
};

export const referenceThumbRemove: CSSProperties = {
  position: "absolute",
  top: 4,
  right: 4,
  width: 20,
  height: 20,
  borderRadius: "50%",
  border: "none",
  background: "rgba(7,8,10,0.75)",
  color: palette.ink,
  fontSize: 12,
  lineHeight: "20px",
  textAlign: "center",
  cursor: "pointer",
};

export const referenceAddTile: CSSProperties = {
  width: referenceThumbSize,
  height: referenceThumbSize,
  borderRadius: 12,
  border: `1px dashed ${palette.border}`,
  background: "transparent",
  color: palette.inkFaint,
  fontSize: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
  transition: "border-color 0.15s ease, color 0.15s ease",
};

/* ---------- Control groups (progressive disclosure) ---------- */
export const controlGroup: CSSProperties = {
  ...glass,
  padding: "20px 22px",
};

export const controlGroupTitle: CSSProperties = {
  fontFamily: fontUI,
  fontSize: 12,
  fontWeight: 600,
  color: palette.inkMuted,
  letterSpacing: 0.3,
  textTransform: "uppercase",
  marginBottom: 16,
};

/* ---------- Aspect ratio visual chip ---------- */
export const aspectChip = (active: boolean): CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  padding: "10px 12px",
  borderRadius: 12,
  cursor: "pointer",
  border: `1px solid ${active ? palette.accent : palette.border}`,
  background: active ? palette.accentDim : palette.surfaceSoft,
  minWidth: 68,
});

/* ---------- Result stage (hero + variants) ---------- */
export const resultHeroFrame: CSSProperties = {
  borderRadius: 20,
  overflow: "hidden",
  background: "#000",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow:
    "0 30px 90px rgba(0,0,0,0.6), 0 0 120px rgba(139,195,74,0.05), 0 0 0 1px rgba(255,255,255,0.02) inset",
};

export const resultVariantThumb = (active: boolean): CSSProperties => ({
  width: 64,
  height: 64,
  borderRadius: 10,
  overflow: "hidden",
  cursor: "pointer",
  border: `2px solid ${active ? palette.accent : "transparent"}`,
  opacity: active ? 1 : 0.6,
  transition: "opacity 0.15s ease, border-color 0.15s ease",
  flexShrink: 0,
});