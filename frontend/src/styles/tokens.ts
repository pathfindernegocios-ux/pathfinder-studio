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

export const NAV_ITEMS: { key: string; label: string; glyph: string; enabled: boolean }[] = [
  { key: "studio", label: "Studio", glyph: "◆", enabled: true },
  { key: "projects", label: "Projects", glyph: "▤", enabled: false },
  { key: "creations", label: "Mis creaciones", glyph: "▶", enabled: true },
  { key: "assets", label: "Assets", glyph: "◫", enabled: false },
  { key: "academy", label: "Academy", glyph: "◐", enabled: false },
  { key: "station", label: "Station", glyph: "●", enabled: false },
  { key: "settings", label: "Settings", glyph: "⚙", enabled: false },
];

export const glass: React.CSSProperties = {
  background: palette.surface,
  border: `1px solid ${palette.border}`,
  borderRadius: 20,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
};

export const inputBase: React.CSSProperties = {
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

export const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 7,
  fontSize: 13,
  fontWeight: 500,
  color: palette.inkMuted,
};

export const pillButton = (active: boolean): React.CSSProperties => ({
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