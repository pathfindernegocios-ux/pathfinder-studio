// src/lib/avatar.ts
import { supabase } from "./supabaseClient";

const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 0.9;

/**
 * Presets — 12 avatares predeterminados.
 *
 * TEMPORAL: mientras se generan los 12 oficiales con Krea, usamos DiceBear.
 * Cuando estén listos:
 *   1. Subir los JPGs a `avatars/presets/preset-01.jpg` ... `preset-12.jpg`
 *   2. Reemplazar estas URLs por las del bucket:
 *      `${SUPABASE_URL}/storage/v1/object/public/avatars/presets/preset-01.jpg`
 */
export const AVATAR_PRESETS: string[] = [
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-01&backgroundColor=e0e7ff",
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-02&backgroundColor=fce7f3",
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-03&backgroundColor=dbeafe",
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-04&backgroundColor=fef3c7",
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-05&backgroundColor=d1fae5",
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-06&backgroundColor=ede9fe",
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-07&backgroundColor=fee2e2",
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-08&backgroundColor=cffafe",
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-09&backgroundColor=fef9c3",
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-10&backgroundColor=e9d5ff",
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-11&backgroundColor=dcfce7",
  "https://api.dicebear.com/9.x/notionists/svg?seed=pathfinder-12&backgroundColor=ffedd5",
];

/**
 * Lee un File y devuelve un HTMLImageElement cargado.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

/**
 * Resize + crop centrado a 512×512 y devuelve un Blob JPEG.
 */
export async function resizeImageToSquare(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  // Crop centrado tipo cover
  const scale = Math.max(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (AVATAR_SIZE - w) / 2;
  const y = (AVATAR_SIZE - h) / 2;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  ctx.drawImage(img, x, y, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo procesar la imagen"));
      },
      "image/jpeg",
      AVATAR_QUALITY,
    );
  });
}

/**
 * Sube un archivo a `avatars/{userId}/avatar.jpg` y devuelve la URL pública
 * con un cache-buster (?t=timestamp) para forzar recarga.
 */
export async function uploadAvatarFile(
  userId: string,
  file: File,
): Promise<string> {
  const blob = await resizeImageToSquare(file);
  const path = `${userId}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, blob, {
      upsert: true,
      contentType: "image/jpeg",
      cacheControl: "3600",
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

/**
 * Persiste la nueva URL de avatar en profiles.
 */
export async function saveAvatarUrl(
  userId: string,
  url: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}
