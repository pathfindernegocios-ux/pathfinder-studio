// src/config/models.ts
// Fuente única de verdad: catálogo de modelos en la UI + mapeo al runtimeId
// que cada notebook registra en la tabla `runtimes` de Supabase.
//
// Reglas:
// - `id`: identificador del botón en la UI. Único dentro de su capability.
// - `runtimeId`: el `model_id` con el que el notebook se registra en `runtimes`.
//   Puede repetirse entre varias opciones UI (ej: Wan I2V y T2V comparten
//   backend y ambas registran como 'wan-dual').
// - `comingSoon`: la opción aparece deshabilitada.
// - `type`: etiqueta libre para lógica interna del FCM (ej: 'wan', 'ltx').

import type { CapabilityId } from '../types';

// Alias: el resto del archivo usa 'Capability' por claridad semántica,
// pero el tipo canónico vive en src/types/index.ts
export type Capability = CapabilityId;

export interface ModelOption {
  id: string;
  name: string;
  type: string;
  runtimeId: string;
  comingSoon?: boolean;
}

export const IMAGE_MODELS: ModelOption[] = [
  { id: 'krea-2-turbo',    name: 'Krea 2',   type: 'krea', runtimeId: 'krea-2-turbo' },
  { id: 'flux-2-klein-4b', name: 'Flux 2',   type: 'flux', runtimeId: 'flux-2-klein-4b' },
];

export const VIDEO_MODELS: ModelOption[] = [
  { id: 'ltx-2.3', name: 'LTX 2.3', type: 'ltx', runtimeId: 'ltx-2.3' },
  { id: 'ltx-2.5-msr', name: 'LTX 2.5 MSR', type: 'ltx25msr', runtimeId: 'ltx-2.5-msr' },
  { id: 'wan-i2v', name: 'Wan I2V', type: 'wan', runtimeId: 'wan-dual' },
  { id: 'wan-t2v', name: 'Wan T2V', type: 'wan', runtimeId: 'wan-dual' },
];

export const AUDIO_MODELS: ModelOption[] = [
  { id: 'omnivoice',   name: 'OmniVoice', type: 'tts', runtimeId: 'tts-dual' },
  { id: 'index_tts25', name: 'Index TTS', type: 'tts', runtimeId: 'tts-dual' },
];

export const MODELS_BY_CAPABILITY: Record<Capability, ModelOption[]> = {
  image: IMAGE_MODELS,
  video: VIDEO_MODELS,
  audio: AUDIO_MODELS,
};

/**
 * Dado un `id` de UI, devuelve el `runtimeId` correspondiente.
 * Si no encuentra coincidencia, devuelve el mismo id (fallback seguro).
 */
export function getRuntimeId(uiId: string): string {
  const all = [...IMAGE_MODELS, ...VIDEO_MODELS, ...AUDIO_MODELS];
  return all.find(m => m.id === uiId)?.runtimeId ?? uiId;
}

/**
 * Devuelve la capability que tiene al menos un modelo online.
 * Prioridad: video > image > audio (solo importa cuando hay varias online).
 * Si ninguna está online, devuelve null.
 */
export function getOnlineCapability(
  statusMap: Record<string, 'online' | 'offline'>,
): Capability | null {
  const order: Capability[] = ['video', 'image', 'audio'];
  for (const cap of order) {
    if (MODELS_BY_CAPABILITY[cap].some(m => statusMap[m.runtimeId] === 'online')) {
      return cap;
    }
  }
  return null;
}

/**
 * Devuelve el primer modelo no "comingSoon" con runtime online dentro
 * de una capability. Si no hay ninguno, devuelve null.
 */
export function getFirstOnlineModel(
  capability: Capability,
  statusMap: Record<string, 'online' | 'offline'>,
): ModelOption | null {
  return (
    MODELS_BY_CAPABILITY[capability].find(
      m => !m.comingSoon && statusMap[m.runtimeId] === 'online',
    ) ?? null
  );
}

/**
 * Devuelve el label corto que se muestra en la tarjeta de generación del chat.
 * Casos especiales:
 * - `wan-i2v` / `wan-t2v`: usan el modo para diferenciarse (mismo runtimeId).
 * - `wan-dual` (runtimeId puro, sin saber el modo): usa `wanMode` si está
 *   disponible; si no, cae a "Wan 2.1".
 * - Resto: usa `name` del catálogo.
 */
export function getChatLabel(uiId: string, wanMode?: string): string {
  if (uiId === 'wan-i2v') return 'Wan 2.1 I2V';
  if (uiId === 'wan-t2v') return 'Wan 2.1 T2V';
  if (uiId === 'wan-dual') {
    if (wanMode === 't2v') return 'Wan 2.1 T2V';
    if (wanMode === 'i2v') return 'Wan 2.1 I2V';
    return 'Wan 2.1';
  }
  if (uiId === 'ltx-2.5-msr') return 'LTX 2.5 MSR';
  const all = [...IMAGE_MODELS, ...VIDEO_MODELS, ...AUDIO_MODELS];
  return all.find(m => m.id === uiId)?.name ?? uiId;
}

/**
 * Dado un `runtimeId` (el `model_id` de la tabla `runtimes`), devuelve un label
 * legible para mostrar al usuario. Se usa en el pill del topbar del Studio
 * cuando la estación está arrancando.
 *
 * Casos especiales:
 * - `wan-dual` no sabe si es i2v o t2v a nivel runtime → usa "Wan 2.1".
 * - `tts-dual` no sabe si es OmniVoice o Index TTS → usa "TTS Dual".
 * - Resto: busca el `name` del primer model con ese runtimeId.
 */
export function getRuntimeLabel(runtimeId: string): string {
  if (runtimeId === 'wan-dual') return 'Wan 2.1';
  if (runtimeId === 'tts-dual') return 'TTS Dual';
  const all = [...IMAGE_MODELS, ...VIDEO_MODELS, ...AUDIO_MODELS];
  return all.find(m => m.runtimeId === runtimeId)?.name ?? runtimeId;
}
