export function durationSeconds(opt: string): string {
  return opt.split(" ")[0];
}

export function durationLabel(opt: string): string {
  const s = durationSeconds(opt);
  return `${s} ${s === "1" ? "segundo" : "segundos"}`;
}

export function durationFrames(opt: string): string | null {
  const m = opt.match(/\((\d+)\s*frames\)/i);
  return m ? m[1] : null;
}

export function snap32(v: number): number {
  return Math.floor(v / 32) * 32;
}

export function computeDims(
  resolution: string,
  ratio: number
): { width: number; height: number } {
  const BASE_RESOLUTIONS: Record<string, number> = {
    "1080p": 1088,
    "720p": 704,
    "540p": 544,
    "480p": 480,
  };

  const base = BASE_RESOLUTIONS[resolution] ?? 704;
  let width: number;
  let height: number;
  if (ratio >= 1) {
    height = base;
    width = base * ratio;
  } else {
    width = base;
    height = base / ratio;
  }
  return { width: snap32(width), height: snap32(height) };
}

export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function formatMMSS(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return "0:00";
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}