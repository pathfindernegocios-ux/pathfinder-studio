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

// Placeholders temporales mientras se suben las imágenes definitivas.
// Cuando subas el archivo con el nombre correcto al bucket, cambia la URL acá abajo a `LANDING/...`.
const PLACEHOLDERS = {
  heroVideo:    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1400&q=80",
  heroVoice:    "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1400&q=80",
  capVideo:     "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&q=80",
  capAudio:     "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1400&q=80",
};

export const LANDING_MEDIA = {
  // ─── HERO SLIDER (1:1, ~1400×1400) ───
  hero: {
    image: `${LANDING}/hero-01-image.jpg`,   // ✅ subida
    video: PLACEHOLDERS.heroVideo,            // ⏳ pendiente
    voice: PLACEHOLDERS.heroVoice,            // ⏳ pendiente
  },

  // ─── CAPABILITY SHOWCASE ───
  // image:  16:9 (~1400×787)
  // video:  16:9 (~1400×787)
  // audio:  1:1  (~1400×1400)
  capability: {
    image: `${LANDING}/capability-image.jpg`, // ✅ subida
    video: PLACEHOLDERS.capVideo,             // ⏳ pendiente
    audio: PLACEHOLDERS.capAudio,             // ⏳ pendiente
  },
} as const;
