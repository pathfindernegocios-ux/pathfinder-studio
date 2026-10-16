// src/config/marketing-assets.ts
// Fuente única de assets de marketing.
//
// CONVENCIÓN FIJA:
//   - Los nombres de archivo NO cambian. Para reemplazar una imagen,
//     subila a Supabase con el mismo nombre y sobreescribí.
//   - Los que no existen todavía caen al placeholder de Unsplash.
//   - Para "desactivar" un placeholder, la imagen final debe existir en
//     el bucket con el nombre exacto.

const BASE = "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/marketing-media";
const LANDING = `${BASE}/landing`;

export const LANDING_MEDIA = {
  // ─── HERO SLIDER (1:1, ~1400×1400) ───
  hero: {
    image: `${LANDING}/hero-01-image.png`,   // ✅ subida
    video: `${LANDING}/hero-02-video.png`,   // ✅ subida
    voice: `${LANDING}/hero-03-voice.png`,   // ✅ subida
  },

  // ─── CAPABILITY SHOWCASE ───
  // image:  16:9 (~1400×787)
  // video:  16:9 (~1400×787)
  // audio:  1:1  (~1400×1400)
  capability: {
    image: `${LANDING}/capability-image.jpg`, // ✅ subida
    video: `${LANDING}/capability-video.jpg`, // ✅ subida
    audio: `${LANDING}/capability-audio.jpg`, // ✅ subida
  },
} as const;
