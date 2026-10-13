// src/pages/AcademyPage.tsx
// Guía de modelos — Conoce tus modelos
// Bloque 1: Base + Modelos de Imagen (Krea, Qwen, Flux)
import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import NumberFlow from "@number-flow/react";
import {
  Image as ImageIcon,
  Clapperboard,
  Mic,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Wand2,
  Layers,
  Briefcase,
  Cpu,
} from "lucide-react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import { Badge } from "../design/components/Badge";
import { Tabs, TabContent } from "../design/components/Tabs";
import { Drawer } from "../design/components/Drawer";
import { fadeInUp, staggerContainer } from "../design/motion";
import { radius as R } from "../design/tokens";

// ============================================================================
// TIPOS
// ============================================================================
type Capability = "image" | "video" | "audio";

interface PromptExample {
  label: string;
  context: string;
  prompt: string;
}

interface Model {
  id: string;
  name: string;
  capability: Capability;
  tagline: string;
  description: string;
  thumbnailUrl?: string;
  specs: { label: string; value: string; detail?: string }[];
  useCases: { title: string; desc: string; icon: string }[];
  promptGuide: {
    structure: string;
    negativePrompt: string;
    tips: string[];
  };
  examples: PromptExample[];
  limitations: string[];
  fcmContract: {
    modes: string[];
    params: string[];
    files: string[];
  };
}

// ============================================================================
// CAPABILITY META
// ============================================================================
const CAPABILITY_META: Record<
  Capability,
  { label: string; color: string; colorDeep: string; Icon: React.ElementType }
> = {
  image: { label: "Imagen", color: "#8B5CF6", colorDeep: "#6D28D9", Icon: ImageIcon },
  video: { label: "Video", color: "#EC4899", colorDeep: "#BE185D", Icon: Clapperboard },
  audio: { label: "Audio", color: "#F59E0B", colorDeep: "#B45309", Icon: Mic },
};

// ============================================================================
// DATA — Bloque 1: Modelos de Imagen
// ============================================================================
const MODELS: Model[] = [
  // ── KREA 2 TURBO ──
  {
    id: "krea-2-turbo",
    name: "Krea 2 Turbo",
    capability: "image",
    thumbnailUrl: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/model-thumbnails/krea-2.png",
    tagline: "Generación de imágenes rápidas con estilos predefinidos. El punto de entrada al Estudio.",
    description:
      "Krea 2 Turbo es un modelo de 12B parámetros con flow-matching, destilado a 8 pasos para inferencia rápida. Es el modelo más rápido del catálogo y el más adecuado para iterar ideas visuales antes de comprometerte con modelos más lentos.",
    specs: [
      { label: "Arquitectura", value: "12B DiT (MMDiT)", detail: "Flow-matching transformer" },
      { label: "Steps", value: "8", detail: "Destilado (2-step y 4-step LoRAs disponibles)" },
      { label: "Resolución", value: "1024px – 2048px", detail: "Standard, High, 2K Ultra" },
      { label: "Aspect ratios", value: "1:1, 16:9, 9:16, 4:3, 3:4", detail: "5 proporciones" },
      { label: "Cuantización", value: "INT8", detail: "FP8 ~12.8 GB VRAM" },
      { label: "Velocidad", value: "Segundos por imagen", detail: "El más rápido del catálogo" },
      { label: "Batch", value: "1–4 imágenes", detail: "Generación múltiple en paralelo" },
      { label: "Estilos", value: "None, Cinematic, Anime, Photorealistic, 3D Render", detail: "5 presets" },
    ],
    useCases: [
      {
        title: "Iteración rápida de ideas",
        desc: "Probar 10-20 variaciones en minutos antes de decidir el concepto final. Ideal para ad concepting y moodboards.",
        icon: "Zap",
      },
      {
        title: "Contenido para redes sociales",
        desc: "Posts, stories y thumbnails que requieren velocidad sin sacrificar calidad técnica.",
        icon: "Image",
      },
      {
        title: "Ilustración con estilo definido",
        desc: "Anime, cinematográfico o 3D render: los presets de estilo agregan calidad técnica con un clic.",
        icon: "Palette",
      },
      {
        title: "Exploración de conceptos",
        desc: "Generar referencias visuales para presentar a clientes antes de invertir en modelos más costosos.",
        icon: "Lightbulb",
      },
    ],
    promptGuide: {
      structure:
        "[sujeto] + [acción/pose] + [entorno] + [iluminación] + [estilo] + [composición]",
      negativePrompt:
        "blurry, low quality, distorted, deformed, extra limbs, watermark, text, signature",
      tips: [
        "Sé descriptivo pero concreto. Iluminación, composición y atmósfera son clave.",
        "Evita prompts de más de 3 líneas: el modelo responde mejor a descripciones densas.",
        "Los estilos predefinidos ya agregan calidad técnica — combínalos con un prompt específico.",
        "Usa el negative prompt para excluir lo no deseado. Es tan importante como el prompt.",
        "El seed fijo permite reproducir exactamente la misma imagen con variaciones menores.",
      ],
    },
    examples: [
      {
        label: "Fotografía cinematográfica",
        context: "Retrato editorial para revista de moda",
        prompt:
          "Retrato de una mujer joven con abrigo rojo mirando al mar al atardecer, luz cálida lateral, cinematográfico, profundidad de campo baja, 85mm, grano de película sutil",
      },
      {
        label: "Producto premium",
        context: "Fotografía publicitaria para e-commerce de lujo",
        prompt:
          "Frasco de perfume de cristal sobre superficie de mármol negro, iluminación de estudio con reflejos suaves, fondo degradado gris, fotografía publicitaria, 4K, detalle nítido",
      },
      {
        label: "Ilustración conceptual",
        context: "Concept art para presentación de proyecto",
        prompt:
          "Ciudad flotante entre nubes al amanecer, arquitectura futurista, rayos de sol atravesando la niebla, colores pastel, ilustración digital estilo Studio Ghibli, composición panorámica",
      },
      {
        label: "Thumbnail para YouTube",
        context: "Miniatura de alto impacto para video",
        prompt:
          "Explosión de colores neón sobre fondo oscuro, formas geométricas dinámicas, alto contraste, estilo cyberpunk, composición central, espacio negativo para texto",
      },
    ],
    limitations: [
      "No edita imágenes existentes — solo genera nuevas desde cero.",
      "No mantiene consistencia de identidad entre generaciones.",
      "Manos y anatomías complejas pueden fallar.",
      "No acepta imágenes de referencia (a diferencia de Qwen o Flux).",
      "Requiere Enterprise License si tu empresa supera $1M USD anuales.",
    ],
    fcmContract: {
      modes: ["Crear"],
      params: [
        "negativePrompt",
        "steps (1–12)",
        "resolution (1024/1536/2048)",
        "aspectRatio (5 opciones)",
        "seed",
        "numImages (1–4)",
        "stylePreset (5 estilos)",
      ],
      files: [],
    },
  },

  // ── QWEN IMAGE 2.1 ──
  {
    id: "qwen-image-2.1",
    name: "Qwen Image 2.1",
    capability: "image",
    thumbnailUrl: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/model-thumbnails/qwen-image-2.1.png",
    tagline: "Imagen sin censura con inpainting, remoción de fondos y multi-referencia.",
    description:
      "Qwen Image 2.1 es un modelo de 7B parámetros que unifica generación y edición en una sola arquitectura. Su característica más distintiva es la generación nativa de RGBA (canal alfa real) — no necesita un paso separado de remoción de fondos.",
    specs: [
      { label: "Arquitectura", value: "7B DiT", detail: "32-layer transformer" },
      { label: "Steps", value: "40 (default)", detail: "Ajustable" },
      { label: "Resolución", value: "1024px – 2K", detail: "Nativo 2K" },
      { label: "Referencias", value: "Hasta 10 imágenes", detail: "Multi-referencia avanzada" },
      { label: "Modos", value: "Crear · Editar y Refs · Inpaint", detail: "3 modos de trabajo" },
      { label: "RGBA nativo", value: "Sí", detail: "Canal alfa real, no post-procesado" },
      { label: "Estilos", value: "Anime, Realista, Ilustración", detail: "Presets + custom" },
      { label: "VRAM", value: "~56 GB en 2K", detail: "Requiere GPU de alta capacidad" },
    ],
    useCases: [
      {
        title: "E-commerce: outfits completos",
        desc: "5 imágenes de referencia (modelo, ropa, zapatos, bolso, sombrero) → outfit completo generado.",
        icon: "ShoppingBag",
      },
      {
        title: "Virtual try-on",
        desc: "Probador virtual: combina una persona de referencia con prendas de otras imágenes.",
        icon: "User",
      },
      {
        title: "Inpainting preciso",
        desc: "Selecciona zonas con círculos, pincel o máscara separada y edita solo esa región.",
        icon: "Wand2",
      },
      {
        title: "Extracción de sujetos",
        desc: "Remoción de fondos nativa RGBA. Extrae personas u objetos de fotografías sin post-procesado.",
        icon: "Scissors",
      },
      {
        title: "Diseño de pósters y marketing",
        desc: "Material promocional con referencias de marca consistentes.",
        icon: "Megaphone",
      },
      {
        title: "Storyboards con estilo",
        desc: "Escenas con estilo de animación específico y personajes consistentes.",
        icon: "Clapperboard",
      },
    ],
    promptGuide: {
      structure:
        "[tarea] + [sujeto] + [acción] + [entorno] + [estilo] + [referencias: 1, 2, 3...]",
      negativePrompt:
        "blurry, low quality, distorted, deformed, extra fingers, watermark, text, logo",
      tips: [
        "Para inpainting, describe SOLO lo que debe ir en la zona seleccionada.",
        "En multi-referencia, sé explícito: 'usa la cara de la imagen 1 con el estilo de la imagen 2'.",
        "El modo 'Editar y Refs' acepta hasta 10 imágenes: combínalas con instrucciones claras.",
        "Para extracción de fondos, activa 'transparent' y el modelo genera RGBA directamente.",
        "La normalización de texto ayuda con números, siglas y monedas.",
      ],
    },
    examples: [
      {
        label: "Ilustración anime",
        context: "Personaje para proyecto de animación",
        prompt:
          "Chica joven con cabello azul, parada en una azotea de Tokio al atardecer, estilo anime de los 90, colores saturados, luz cálida, nubes dramáticas, composición vertical",
      },
      {
        label: "Inpainting selectivo",
        context: "Reemplazar un objeto en una foto existente",
        prompt:
          "Un gato naranja durmiendo sobre un cojín de terciopelo rojo, iluminación suave de tarde, estilo fotográfico consistente con la imagen original",
      },
      {
        label: "Multi-referencia",
        context: "Combinar personaje + estilo + escena",
        prompt:
          "Usa el personaje de la imagen 1 con el estilo pictórico de la imagen 2, escena en un bosque de noche con luces brillantes, composición cinematográfica",
      },
      {
        label: "Extracción de producto",
        context: "E-commerce: producto aislado con fondo transparente",
        prompt:
          "Zapatilla deportiva roja y blanca, vista lateral, iluminación de estudio, fondo transparente, sombra sutil, alta definición, 2K",
      },
    ],
    limitations: [
      "Licencia SOLO para investigación. Uso comercial requiere licencia separada de Alibaba.",
      "No disponible en Kaggle — solo en Google Colab (plan Creator o Founder).",
      "El modo Quality es notablemente más lento que los modos Turbo.",
      "VRAM elevada en 2K (~56 GB): puede degradar si hay otros modelos cargados.",
      "La censura mínima no significa ausencia total de filtros.",
    ],
    fcmContract: {
      modes: ["Crear", "Editar y Refs", "Inpaint"],
      params: [
        "task (Crear/Editar/Inpaint)",
        "mode (Turbo HQ/Turbo/Turbo Fast/Quality)",
        "stylePreset",
        "transparent (RGBA)",
        "negativePrompt",
        "resolution",
        "aspectRatio",
        "seed",
        "numImages",
        "strength",
      ],
      files: ["refFiles (hasta 10)", "editImageFile", "editMaskFile"],
    },
  },

  // ── FLUX 2 KLEIN 4B ──
  {
    id: "flux-2-klein-4b",
    name: "Flux 2 Klein 4B",
    capability: "image",
    thumbnailUrl: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/model-thumbnails/flux-2.png",
    tagline: "Máxima calidad con referencias visuales, remoción de objetos y composición quirúrgica.",
    description:
      "Flux 2 Klein 4B es el modelo de imagen más versátil del catálogo. Unifica generación y edición en una arquitectura compacta de 4B parámetros con licencia Apache 2.0 — la más permisiva del catálogo. Soporta hasta 4 referencias y edición con lenguaje natural.",
    specs: [
      { label: "Arquitectura", value: "4B Rectified Flow Transformer", detail: "Generación + edición unificadas" },
      { label: "Steps", value: "4", detail: "Extremadamente rápido" },
      { label: "Resolución", value: "1024px – 1536px", detail: "Estándar y Alta" },
      { label: "Referencias", value: "Hasta 4 imágenes", detail: "Multi-reference editing" },
      { label: "Aspect ratios", value: "1:1, 16:9, 9:16, 4:5", detail: "4 proporciones" },
      { label: "Modos", value: "KI (Key Identity) · I (Identity)", detail: "2 modos de referencia" },
      { label: "VRAM", value: "~13 GB", detail: "Corre en GPUs de consumidor" },
      { label: "Velocidad", value: "~0.3s (primera) · ~1.2s (estándar)", detail: "El más rápido en generación/edición" },
    ],
    useCases: [
      {
        title: "Edición editorial de alta resolución",
        desc: "Edita hasta 4MP manteniendo geometría, textura y coherencia visual.",
        icon: "Edit",
      },
      {
        title: "Product visualization",
        desc: "Branding consistente: el mismo producto en múltiples escenas y ángulos.",
        icon: "Package",
      },
      {
        title: "UI mockups y prototipos",
        desc: "Genera y edita interfaces con referencias visuales precisas.",
        icon: "Layout",
      },
      {
        title: "Character design",
        desc: "Consistencia de personaje entre múltiples generaciones con referencias.",
        icon: "User",
      },
      {
        title: "E-commerce photography",
        desc: "Fotografía de producto con composición quirúrgica y branding consistente.",
        icon: "Camera",
      },
      {
        title: "Brand asset creation",
        desc: "Assets de marca coherentes: logos, patrones, ilustraciones con estilo unificado.",
        icon: "Palette",
      },
    ],
    promptGuide: {
      structure:
        "[modo] + [instrucción de edición] + [referencias: 1, 2, 3, 4] + [detalles a preservar]",
      negativePrompt:
        "blurry, low quality, distorted, inconsistent, mismatched, deformed, watermark, text",
      tips: [
        "Para edición, describe el cambio específico: 'agrega una bufanda azul al personaje'.",
        "Para inpainting, describe solo lo que debe ir en la zona seleccionada.",
        "Usa el modo KI (Key Identity) para mantener el sujeto original de una referencia.",
        "Usa el modo I (Identity) para agregar un objeto o persona secundaria.",
        "Con múltiples referencias, sé explícito: 'usa la cara de la referencia 1 con el estilo de la 2'.",
        "embeddedGuidance controla cuánto sigue el prompt vs las referencias.",
      ],
    },
    examples: [
      {
        label: "Edición puntual",
        context: "Agregar un elemento a una foto existente",
        prompt:
          "Agrega una bufanda azul al personaje manteniendo su rostro y postura idénticos, iluminación consistente, estilo fotográfico natural",
      },
      {
        label: "Composición quirúrgica",
        context: "Fotografía editorial de moda",
        prompt:
          "Retrato editorial de hombre con saco beige, fondo de pared texturizada, luz natural suave desde la izquierda, estilo revista de moda, composición 4:5",
      },
      {
        label: "Extender escena",
        context: "Outpainting: expandir una imagen existente",
        prompt:
          "Extiende la imagen hacia la derecha agregando un ventanal con luz de tarde, manteniendo el estilo fotográfico y la paleta de colores original",
      },
      {
        label: "Multi-referencia",
        context: "Combinar múltiples elementos en una sola imagen",
        prompt:
          "Coloca el producto de la referencia 1 sobre la mesa de la referencia 2, con la iluminación de la referencia 3, estilo publicitario premium",
      },
    ],
    limitations: [
      "Más lento que Krea 2 Turbo (aprox 2-3x por generación).",
      "Consume más VRAM — con otros modelos cargados puede ralentizarse.",
      "Requiere configurar correctamente el modo de referencia.",
      "No es tan bueno con estilos artísticos estilizados (anime, cartoon).",
      "El modelo de 9B (no incluido) tiene mejor calidad pero licencia no comercial.",
    ],
    fcmContract: {
      modes: ["Crear", "Editar"],
      params: [
        "negativePrompt",
        "steps (1–12)",
        "resolution (1024/1536)",
        "aspectRatio (4 opciones)",
        "seed",
        "numImages",
        "refModeLabel (KI / I)",
        "modelModeLabel",
        "fluxGuideScale",
        "embeddedGuidance",
      ],
      files: ["refFiles (hasta 4)", "maskFile"],
    },
  },

  // ── LTX 2.3 ──
  {
    id: "ltx-2.3",
    name: "LTX 2.3",
    capability: "video",
    thumbnailUrl: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/model-thumbnails/ltx-2.3.png",
    tagline:
      "Video con audio sincronizado y storyboard multi-escena. Del prompt a la escena completa.",
    description:
      "LTX 2.3 es un modelo de 22B parámetros con arquitectura DiT destilada. Su característica principal es la generación de video con audio nativo sincronizado y la capacidad de encadenar hasta 5 escenas en una sola toma final. Es el modelo de mayor calidad cinematográfica del catálogo.",
    specs: [
      { label: "Arquitectura", value: "22B DiT", detail: "Distilled transformer" },
      { label: "Cuantización", value: "GGUF Q4_K_M", detail: "4-bit" },
      { label: "Steps", value: "8", detail: "Destilado para velocidad" },
      { label: "Duración", value: "2s – 30s por escena", detail: "Flexible por escena" },
      { label: "Multi-escena", value: "Hasta 5 escenas encadenadas", detail: "End Frame → Start Frame" },
      { label: "Audio nativo", value: "Voz + ambiente + efectos", detail: "Sincronizado con el video" },
      { label: "Resolución", value: "Hasta 1080×1920 (9:16)", detail: "Portrait nativo" },
      { label: "Plataforma", value: "Kaggle (GPU T4 x2)", detail: "Requiere doble GPU" },
      { label: "Carga inicial", value: "5 – 10 min", detail: "El modelo más lento del catálogo" },
    ],
    useCases: [
      {
        title: "UGC reels multi-shot",
        desc: "Reels verticales 9:16 con múltiples cortes y personaje consistente entre escenas.",
        icon: "Smartphone",
      },
      {
        title: "Short-form cinematográfico",
        desc: "Clips de alta calidad para YouTube Shorts, TikTok o Instagram con estructura de escenas.",
        icon: "Film",
      },
      {
        title: "Music video clips",
        desc: "Clips musicales con sincronización de audio y beat detection.",
        icon: "Music",
      },
      {
        title: "Talking heads / entrevistas",
        desc: "Personajes hablando con audio sincronizado y coherencia visual.",
        icon: "Mic",
      },
      {
        title: "Storyboards animados",
        desc: "Presentaciones de guion con transiciones entre escenas encadenadas.",
        icon: "Layout",
      },
      {
        title: "Commercials / brand films",
        desc: "Videos publicitarios con audio profesional y estética cinematográfica.",
        icon: "Megaphone",
      },
    ],
    promptGuide: {
      structure:
        "[VISUAL] descripción visual de la escena [SPEECH] diálogo del personaje [SOUND] ambiente y efectos",
      negativePrompt:
        "blurry, low quality, distorted, deformed, static, frozen, watermark, text, extra limbs",
      tips: [
        "Usa la estructura [VISUAL][SPEECH][SOUND] para escenas con diálogo — es la que mejor funciona.",
        "Para multi-escena, encadena visualmente: el End Frame de una escena es el Start Frame de la siguiente.",
        "Especifica el movimiento de cámara: 'la cámara se acerca lentamente', 'plano panorámico lateral'.",
        "Con audio externo, indica 'match video duration to audio length' para sincronización automática.",
        "Usa el modo Storyboard del FCM para trabajar con múltiples escenas en un solo render.",
        "Las duraciones cortas (5-10s) suelen dar mejor calidad por frame que las largas.",
      ],
    },
    examples: [
      {
        label: "Escena con diálogo",
        context: "Short cinematográfico para YouTube",
        prompt:
          "[VISUAL] Mujer joven caminando por un mercado nocturno en Tokio, luces de neón, plano medio, cámara siguiendo su paso [SPEECH] 'Nunca pensé que volvería a este lugar.' [SOUND] Murmullo de gente y música lejana, ambiente urbano",
      },
      {
        label: "Paisaje cinematográfico",
        context: "B-roll para documental o brand film",
        prompt:
          "Atardecer sobre montañas nevadas, cámara panorámica lenta de izquierda a derecha, nubes en movimiento, tonos naranja y violeta, cinematográfico, sin diálogo",
      },
      {
        label: "Producto en movimiento",
        context: "Comercial de producto premium",
        prompt:
          "Frasco de perfume girando lentamente sobre superficie reflectante negra, luz de estudio dramática, partículas doradas flotando en el aire, cámara fija, composición centrada",
      },
      {
        label: "Multi-escena encadenada",
        context: "Storyboard animado para presentación de proyecto",
        prompt:
          "[ESCENA 1] Amanecer sobre ciudad dormida, plano general [ESCENA 2] Persona despertando, close-up ojos abriéndose [ESCENA 3] Persona saliendo a la calle, plano medio [SOUND] Música ascendente que une las tres escenas",
      },
    ],
    limitations: [
      "El modelo más lento del catálogo: 5-10 minutos de carga inicial.",
      "Requiere GPU T4 x2 de Kaggle — no funciona en GPU simple.",
      "Generar 30 segundos con audio puede tardar varios minutos.",
      "Reinicia la estación al cambiar desde/hacia otro modelo.",
      "Duraciones superiores a 10s por escena pueden degradar la coherencia visual.",
    ],
    fcmContract: {
      modes: ["Single", "Storyboard"],
      params: [
        "duration",
        "resolution",
        "aspectRatio",
        "guideScale",
        "seed",
        "matchAudioDur",
        "loraItems (con multiplicador por LoRA)",
      ],
      files: ["imageStartFile", "imageEndFile", "audioFile"],
    },
  },

  // ── LTX 2.3 MSR ──
  {
    id: "ltx-2.3-msr",
    name: "LTX 2.3 MSR",
    capability: "video",
    thumbnailUrl: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/model-thumbnails/ltx-2.3-msr.png",
    tagline:
      "Video multi-referencia con el modelo 22B más pesado. Hasta 4 subjects + background.",
    description:
      "LTX 2.3 MSR (Multi-Subject Reference) es la variante especializada de LTX 2.3 para mantener múltiples sujetos de referencia. Toma hasta 4 imágenes de referencia (personas, objetos, productos) más un fondo, y genera video manteniendo sus identidades exactas. Es el modelo más pesado del catálogo.",
    specs: [
      { label: "Arquitectura", value: "22B Multi-Subject Reference", detail: "Basado en LTX 2.3" },
      { label: "Sujetos", value: "Hasta 4 referencias + background", detail: "5 imágenes simultáneas" },
      { label: "Resolución", value: "Hasta 1080×1920 (9:16)", detail: "Portrait y landscape" },
      { label: "Steps", value: "8", detail: "Igual que LTX 2.3 base" },
      { label: "Plataforma", value: "Kaggle (GPU T4 x2)", detail: "Solo Kaggle, no Colab" },
      { label: "Carga inicial", value: "8 – 12 min", detail: "El modelo más lento del catálogo" },
      { label: "Audio", value: "Sin audio nativo", detail: "Post-producción externa" },
      { label: "Consistencia", value: "Alta entre referencias y video final", detail: "Fidelidad visual" },
    ],
    useCases: [
      {
        title: "Escenas grupales",
        desc: "Múltiples personajes con identidades específicas en una misma escena.",
        icon: "Users",
      },
      {
        title: "Product placement multi-marca",
        desc: "Varios productos de referencias distintas en un solo video comercial.",
        icon: "ShoppingBag",
      },
      {
        title: "Videos publicitarios con branding",
        desc: "Cada elemento de la marca mantenido exacto desde las referencias.",
        icon: "Megaphone",
      },
      {
        title: "Animación de equipos / familias",
        desc: "Grupos de personas manteniendo la identidad de cada uno.",
        icon: "Users",
      },
    ],
    promptGuide: {
      structure:
        "[sujeto 1: posición] + [sujeto 2: posición] + [sujeto 3-4] + [escena] + [movimiento de cámara]",
      negativePrompt:
        "blurry, low quality, deformed, mismatched faces, identity swap, static, watermark, text",
      tips: [
        "Prepara referencias limpias y bien recortadas — el resultado depende de su calidad.",
        "Describe la posición de cada sujeto: 'sujeto 1 a la izquierda, sujeto 2 al centro'.",
        "Para fondo, usa referencias de escena, no de personajes.",
        "Evita prompts que pidan cosas no cubiertas por las referencias — degrada el resultado.",
        "Con 4 referencias, distribuye la composición de forma clara (cuadrantes).",
      ],
    },
    examples: [
      {
        label: "Escena grupal de amigos",
        context: "Video publicitario o corto narrativo",
        prompt:
          "Tres amigos (referencias 1, 2, 3) caminando por una calle de la ciudad al atardecer, manteniendo las identidades de cada referencia, cámara lateral siguiendo el movimiento, luz cálida de tarde",
      },
      {
        label: "Product placement",
        context: "Comercial de e-commerce con varios productos",
        prompt:
          "Los productos (referencias 1, 2, 3) dispuestos sobre mesa de madera clara, cámara orbitando lentamente alrededor, luz de estudio suave, sombras consistentes, fondo minimalista",
      },
      {
        label: "Familia en casa",
        context: "Video emocional / lifestyle",
        prompt:
          "Familia de 4 (referencias 1-4) cenando en un comedor cálido, cámara panorámica lenta, luz de velas, movimiento sutil de todos los sujetos, ambiente íntimo",
      },
    ],
    limitations: [
      "Solo disponible en Kaggle — no funciona en Colab.",
      "El modelo más pesado del catálogo — requiere GPU T4 x2 obligatorio.",
      "Carga inicial de 8-12 minutos, la más larga del catálogo.",
      "Sin audio nativo — el audio se agrega en post-producción.",
      "Menos flexible en improvisación: depende de la calidad de las referencias.",
    ],
    fcmContract: {
      modes: ["Single"],
      params: [
        "duration",
        "resolution",
        "aspectRatio",
        "guideScale",
        "seed",
        "loraItems",
      ],
      files: [
        "imageStartFile (4 referencias + background)",
        "imageEndFile",
      ],
    },
  },

  // ── LTX 2.5 MSR ──
  {
    id: "ltx-2.5-msr",
    name: "LTX 2.5 MSR",
    capability: "video",
    thumbnailUrl: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/model-thumbnails/ltx-2.5-msr.png",
    tagline:
      "La generación 2.5 de multi-referencia. Más rápido que 2.3, misma calidad visual.",
    description:
      "LTX 2.5 MSR es la evolución de LTX 2.3 MSR. Suma audio references para Two-Speaker (diálogos entre dos voces con referencias separadas) y admite hasta 5 referencias visuales. Mejora la coherencia temporal y la estabilidad del movimiento respecto a la versión anterior.",
    specs: [
      { label: "Arquitectura", value: "LTX 2.5 Multi-Subject Reference", detail: "Evolución de 2.3 MSR" },
      { label: "Referencias", value: "Hasta 5 imágenes", detail: "Una más que 2.3 MSR" },
      { label: "Audio references", value: "Sí (Two-Speaker)", detail: "Diálogos entre 2 voces" },
      { label: "Modos", value: "KI (Key Identity) · I (Identity)", detail: "2 modos de referencia" },
      { label: "Resolución", value: "Hasta 1080×1920 (9:16)", detail: "Portrait y landscape" },
      { label: "Steps", value: "8", detail: "Igual que 2.3" },
      { label: "Pipeline", value: "Configurable", detail: "Ajustable según caso de uso" },
      { label: "Plataforma", value: "Kaggle (GPU T4 x2)", detail: "Requiere doble GPU" },
    ],
    useCases: [
      {
        title: "Diálogos multi-personaje",
        desc: "Dos speakers con voces e identidades distintas en una sola escena sincronizada.",
        icon: "Mic",
      },
      {
        title: "Escenas complejas con 5 elementos",
        desc: "Hasta 5 referencias visuales simultáneas en una composición.",
        icon: "Layers",
      },
      {
        title: "Multi-referencia ágil",
        desc: "Los mismos casos que 2.3 MSR pero con iteración más rápida gracias a las mejoras 2.5.",
        icon: "Zap",
      },
      {
        title: "Anuncios con producto + personajes",
        desc: "Combinar branding de producto con personajes específicos en un mismo video.",
        icon: "Megaphone",
      },
    ],
    promptGuide: {
      structure:
        "[sujeto 1 + voz si aplica] + [sujeto 2-5] + [escena] + [movimiento] + [audio ref si aplica]",
      negativePrompt:
        "blurry, low quality, deformed, mismatched identities, audio desync, static, watermark",
      tips: [
        "En modo Two-Speaker, asigna una referencia de audio a cada speaker explícitamente.",
        "Mismas buenas prácticas que LTX 2.3 MSR — la calidad de referencias es lo más importante.",
        "Aprovecha la velocidad extra para hacer más iteraciones antes del render final.",
        "Prueba combinaciones de referencias antes de comprometerte con una escena completa.",
        "El modo KI mantiene el sujeto de la referencia; el modo I lo trata como elemento a agregar.",
      ],
    },
    examples: [
      {
        label: "Diálogo Two-Speaker",
        context: "Escena narrativa con dos personajes hablando",
        prompt:
          "[Referencia A: mujer joven] [Referencia B: hombre adulto] [Audio Ref A: voz femenina] [Audio Ref B: voz masculina] Dos personas en una cafetería discutiendo tranquilamente, plano medio alternando entre ambos, luz natural de tarde",
      },
      {
        label: "Multi-producto premium",
        context: "Comercial de alta gama con varios elementos",
        prompt:
          "Tres productos (referencias 1, 2, 3) sobre mármol blanco, cámara orbitando lentamente, luz de estudio premium, sombras suaves, branding visible de cada referencia",
      },
      {
        label: "Familia dinámica",
        context: "Video lifestyle para redes",
        prompt:
          "Familia de 5 (referencias 1-5) caminando por un parque al atardecer, movimiento natural, cámara siguiendo en dolly, luz dorada de hora mágica",
      },
    ],
    limitations: [
      "Requiere reiniciar la estación al cambiar desde/hacia otro modelo.",
      "Consume VRAM considerable — Kaggle T4 x2 obligatorio.",
      "Depende de la calidad de las referencias (visuales y de audio).",
      "El modo Two-Speaker necesita dos audios limpios, sin ruido de fondo.",
      "No tiene audio nativo generativo (a diferencia de LTX 2.3 base) — el audio viene de referencias.",
    ],
    fcmContract: {
      modes: ["KI", "I"],
      params: [
        "mode (KI / I)",
        "removeBg",
        "duration",
        "resolution",
        "aspectRatio",
        "pipeline",
        "audioCfg",
        "steps",
        "seed",
        "loraItems (con multiplicador)",
      ],
      files: [
        "ref1",
        "ref2",
        "ref3",
        "ref4",
        "ref5",
      ],
    },
  },

  // ── WAN 2.1 i2v ──
  {
    id: "wan-dual-i2v",
    name: "Wan 2.1 Image-to-Video",
    capability: "video",
    thumbnailUrl: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/model-thumbnails/wan-dual.png",
    tagline:
      "Anima una imagen estática con movimiento coherente. LoRAs aceleradoras ya cargadas.",
    description:
      "Wan 2.1 i2v es un modelo de 14B parámetros especializado en animar imágenes estáticas. Toma una imagen de entrada (generada en Krea/Flux/Qwen o subida) y le agrega movimiento coherente respetando la composición original. Incluye LoRAs aceleradoras preconfiguradas para tiempos de generación más cortos.",
    specs: [
      { label: "Arquitectura", value: "Wan 2.1 14B", detail: "Image-to-video especializado" },
      { label: "Modo", value: "i2v (Image-to-Video)", detail: "Requiere imagen de entrada" },
      { label: "Duración", value: "5s (81 frames)", detail: "Típico" },
      { label: "Resolución", value: "480p", detail: "Optimizado para velocidad" },
      { label: "Steps", value: "4", detail: "Con LoRAs aceleradoras" },
      { label: "Sampler", value: "UniPC", detail: "Recomendado por defecto" },
      { label: "Guide scale", value: "1.0", detail: "Ajustable" },
      { label: "LoRAs", value: "Aceleradoras preconfiguradas", detail: "Tiempos más cortos" },
    ],
    useCases: [
      {
        title: "Animación de fotografías",
        desc: "Dar movimiento a fotos propias o generadas con otros modelos.",
        icon: "Image",
      },
      {
        title: "Motion de productos",
        desc: "Productos estáticos que cobran vida para e-commerce o publicidad.",
        icon: "ShoppingBag",
      },
      {
        title: "Clips de 5s para redes",
        desc: "Contenido corto desde una sola imagen sin necesidad de prompts largos.",
        icon: "Smartphone",
      },
      {
        title: "Iteración visual rápida",
        desc: "Ver movimiento de un concepto antes de comprometerse con un render largo.",
        icon: "Zap",
      },
      {
        title: "Motion posters",
        desc: "Pósters animados para presentaciones o redes sociales.",
        icon: "Layout",
      },
      {
        title: "B-roll desde stills",
        desc: "Convertir imágenes fijas en B-roll para proyectos audiovisuales.",
        icon: "Film",
      },
    ],
    promptGuide: {
      structure:
        "[movimiento deseado] + [tipo de cámara] + [ritmo/tempo] — el contenido viene de la imagen",
      negativePrompt:
        "blurry, static, frozen, distorted, deformed, jittery, watermark, text, extra limbs",
      tips: [
        "Describe el movimiento deseado, no el contenido: 'la cámara se acerca lentamente'.",
        "Puedes dejar el prompt casi vacío si la imagen ya es clara.",
        "Evita pedir cambios de composición: el modelo respeta la imagen original.",
        "Para bucles perfectos, indica 'seamless loop' y usa imágenes simétricas.",
        "Con LoRA de cámara, especifica el tipo de movimiento exacto (dolly in, pan right).",
      ],
    },
    examples: [
      {
        label: "Retrato animado",
        context: "Dar vida a un retrato generado con Krea",
        prompt:
          "El personaje respira sutilmente, parpadea lentamente, cabello moviéndose con brisa suave, cámara fija, movimiento orgánico",
      },
      {
        label: "Paisaje en movimiento",
        context: "Animar una foto de paisaje",
        prompt:
          "Nubes en movimiento lento sobre las montañas, agua ondulando en el lago, cámara panorámica lenta de izquierda a derecha, movimiento atmosférico",
      },
      {
        label: "Producto en bucle",
        context: "Bucle de producto para e-commerce",
        prompt:
          "El producto gira suavemente sobre su eje, luz cambiando ligeramente, fondo estático, bucle perfecto sin corte visible",
      },
    ],
    limitations: [
      "Requiere una imagen de entrada — no genera desde cero.",
      "El movimiento posible depende mucho de lo que la imagen permita.",
      "No genera audio.",
      "Duraciones típicas de 5 segundos.",
      "Resolución limitada a 480p (optimizado para velocidad, no detalle extremo).",
    ],
    fcmContract: {
      modes: ["i2v"],
      params: [
        "duration (5s)",
        "resolution (480p)",
        "aspectRatio",
        "steps (4)",
        "guideScale (1.0)",
        "shift (5.0)",
        "sampler (UniPC)",
        "seed",
        "forcePreset",
        "loraItems (con multiplicador)",
      ],
      files: ["imageStartFile", "imageEndFile"],
    },
  },

  // ── WAN 2.1 t2v ──
  {
    id: "wan-dual-t2v",
    name: "Wan 2.1 Text-to-Video",
    capability: "video",
    thumbnailUrl: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/model-thumbnails/wan-dual.png",
    tagline:
      "Video desde texto en un solo modelo. Rápido y liviano, ideal para exploración visual.",
    description:
      "Wan 2.1 t2v es la variante liviana de Wan 2.1 (1.3B parámetros) para generar video directamente desde texto sin imagen de entrada. Es significativamente más rápido que Wan i2v y está incluido en el plan Free. Ideal para exploración rápida de conceptos antes de comprometerse con renders de mayor calidad.",
    specs: [
      { label: "Arquitectura", value: "Wan 2.1 1.3B", detail: "Modelo liviano" },
      { label: "Modo", value: "t2v (Text-to-Video)", detail: "Sin imagen de entrada" },
      { label: "Duración", value: "5s (81 frames)", detail: "Típico" },
      { label: "Resolución", value: "480p", detail: "Optimizado para velocidad" },
      { label: "Steps", value: "4", detail: "Con LoRAs" },
      { label: "VRAM", value: "~8.19 GB", detail: "Corre en GPUs de consumidor" },
      { label: "Plataforma", value: "Kaggle", detail: "Disponible en plan Free" },
      { label: "Velocidad", value: "~4 min para 5s", detail: "En T4 simple" },
    ],
    useCases: [
      {
        title: "Exploración visual rápida",
        desc: "Probar ideas antes de invertir en un render de mayor calidad con LTX.",
        icon: "Zap",
      },
      {
        title: "Moodboards animados",
        desc: "Prototipos de conceptos visuales para presentar a clientes.",
        icon: "Layout",
      },
      {
        title: "Contenido para redes",
        desc: "Clips generativos sin partir de una imagen específica.",
        icon: "Smartphone",
      },
      {
        title: "Bucles cortos para prototipos",
        desc: "Contenido de 5s que se puede usar en loops para presentaciones.",
        icon: "Film",
      },
    ],
    promptGuide: {
      structure:
        "[sujeto] + [acción] + [entorno] + [movimiento de cámara] + [atmósfera]",
      negativePrompt:
        "blurry, static, frozen, low quality, distorted, watermark, text, multiple subjects",
      tips: [
        "Sé claro con el movimiento: 'cámara dolly in lento sobre un campo de flores'.",
        "Descriptores de atmósfera funcionan bien: 'cinematográfico, hora dorada, suave'.",
        "Evita prompts con múltiples acciones simultáneas — confunden al modelo.",
        "Mantén el prompt bajo 30 palabras para resultados más limpios.",
        "Un solo sujeto principal por video da mejores resultados.",
      ],
    },
    examples: [
      {
        label: "Atmósfera",
        context: "B-roll generativo para documental",
        prompt:
          "Bosque cubierto de niebla al amanecer, rayos de sol atravesando los árboles, cámara avanzando lentamente, ambiente etéreo",
      },
      {
        label: "Cotidiano",
        context: "Contenido lifestyle para redes",
        prompt:
          "Café caliente humeando sobre mesa de madera, luz de mañana entrando por la ventana, cámara fija, movimiento sutil de vapor",
      },
      {
        label: "Abstracto",
        context: "Motion graphics / intro visual",
        prompt:
          "Partículas doradas flotando sobre fondo negro, movimiento suave ascendente, sensación etérea, cámara lenta, alta saturación",
      },
    ],
    limitations: [
      "Calidad menor que LTX 2.3 o Wan i2v — es el modelo de exploración.",
      "Duraciones cortas (típicamente 5 segundos).",
      "No genera audio.",
      "Sin LoRAs avanzadas más allá de las aceleradoras.",
      "Recomendado solo para prototipos; para producción final, usar LTX.",
    ],
    fcmContract: {
      modes: ["t2v"],
      params: [
        "duration (5s)",
        "resolution (480p)",
        "aspectRatio",
        "steps (4)",
        "guideScale (1.0)",
        "shift (5.0)",
        "sampler (UniPC)",
        "seed",
        "forcePreset",
        "loraItems (con multiplicador)",
      ],
      files: [],
    },
  },

  // ── OMNI VOICE ──
  {
    id: "tts-dual-omnivoice",
    name: "OmniVoice",
    capability: "audio",
    thumbnailUrl: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/model-thumbnails/tts-dual.png",
    tagline:
      "Voz sintética con 4 modos: diseño, clonación, diálogos y auto voice. 13 idiomas.",
    description:
      "OmniVoice es un motor TTS de alta fidelidad con 4 modos de trabajo: genera voz sin referencia previa, clona voces desde muestras cortas, produce diálogos entre dos speakers, o diseña voces custom con tags de instrucción. Soporta 13 idiomas con español neutro incluido. Es la opción por defecto para narración, audiolibros y locución profesional.",
    specs: [
      { label: "Arquitectura", value: "OmniVoice", detail: "Motor TTS multi-modo" },
      { label: "Modos", value: "4", detail: "Auto Voice · Voice Design · Voice Cloning · Two-Speaker" },
      { label: "Idiomas", value: "13", detail: "Incluye español neutro" },
      { label: "Steps", value: "32 (default)", detail: "Ajustable 10–50" },
      { label: "Guide scale", value: "2.0 (default)", detail: "Control de adherencia al texto" },
      { label: "Sample rate", value: "24,000 Hz", detail: "Calidad profesional" },
      { label: "Duración", value: "Custom (auto) · 5s–60s", detail: "Ajustable por preset" },
      { label: "Referencia mínima", value: "10 segundos de audio limpio", detail: "Para clonación" },
    ],
    useCases: [
      {
        title: "Locución para video",
        desc: "Voice-over profesional para YouTube, TikTok, Reels o documentales.",
        icon: "Mic",
      },
      {
        title: "Audiolibros y narración",
        desc: "Lectura de textos largos con voz consistente a lo largo de horas.",
        icon: "BookOpen",
      },
      {
        title: "Diálogos entre personajes",
        desc: "Modo Two-Speaker: dos voces distintas en una sola generación para ficción sonora.",
        icon: "Users",
      },
      {
        title: "Doblaje multiidioma",
        desc: "Mismo texto en 13 idiomas con la misma voz clonada o diseñada.",
        icon: "Globe",
      },
      {
        title: "Clonación de tu propia voz",
        desc: "Con 10 segundos de audio limpio puedes producir todo tu contenido en tu voz.",
        icon: "User",
      },
      {
        title: "Voice Design sin referencia",
        desc: "Diseña una voz custom con tags: 'voz femenina joven, tono cálido, pausado'.",
        icon: "Wand2",
      },
    ],
    promptGuide: {
      structure:
        "Voice Design: [Tags: descripción de voz] + texto a narrar | Cloning: [referencia de audio] + texto | Two-Speaker: [Referencia A] + [Referencia B] + texto con guiones",
      negativePrompt:
        "No aplica — el control de calidad viene de la instrucción y la referencia",
      tips: [
        "En el texto, evita puntos internos: usa comas para que el TTS fluya natural.",
        "Marcadores conversacionales funcionan bien: 'Ahora', 'Entonces', 'Mira'.",
        "Para clonación, la referencia debe tener mínimo 10 segundos de voz limpia, sin ruido de fondo.",
        "En Voice Design, los tags afectan la voz final: 'voz cálida, joven, pausada'.",
        "Para Two-Speaker, asigna cada referencia a un speaker explícitamente en el prompt.",
        "Si la generación suena 'leída', baja el guide scale o agrega marcadores conversacionales.",
        "El modo Auto Voice es el más rápido — úsalo para drafts antes de diseñar la voz final.",
      ],
    },
    examples: [
      {
        label: "Voice Design",
        context: "Locución de video sin referencia previa",
        prompt:
          "[Tags: voz femenina joven, tono cálido, pausado] Bienvenido a Pathfinder, ahora vamos a crear algo juntos.",
      },
      {
        label: "Two-Speaker",
        context: "Diálogo entre dos personajes para ficción sonora",
        prompt:
          "[Referencia A: voz masculina adulta] [Referencia B: voz femenina joven] — ¿Ya llegaste? — Sí, estoy aquí desde hace una hora. — Perdón, el tráfico estuvo terrible.",
      },
      {
        label: "Clonación",
        context: "Producción en serie con tu propia voz",
        prompt:
          "Texto a narrar en tu voz clonada. Recuerda usar comas en lugar de puntos internos para fluidez.",
      },
      {
        label: "Narración para audiolibro",
        context: "Capítulo de audiolibro con voz consistente",
        prompt:
          "Había una vez, en un pueblo pequeño rodeado de montañas, un anciano que contaba historias a los niños cada atardecer. Sus relatos, decían, tenían el poder de sanar.",
      },
    ],
    limitations: [
      "El audio clonado puede sonar 'leído' si la referencia es muy corta (menos de 10s).",
      "Emociones muy sutiles (ironía, sarcasmo) pueden no captarse bien.",
      "El modo Two-Speaker requiere dos referencias limpias y bien diferenciadas.",
      "La clonación hereda el acento y tono de la referencia — no se puede cambiar después.",
      "Voces con acentos muy marcados pueden sonar menos naturales en idiomas que no son el nativo.",
    ],
    fcmContract: {
      modes: [
        "Auto Voice (sin referencia)",
        "Voice Design (solo tags)",
        "Voice Cloning (1 referencia)",
        "Two-Speaker (2 referencias)",
      ],
      params: [
        "voiceMode (4 opciones)",
        "voiceInstruction (tags para Voice Design)",
        "language (13 idiomas)",
        "duration (Custom · 5s · 10s · 15s · 25s · 40s · 60s)",
        "seed",
        "steps (10–50, default 32)",
        "guideScale (default 2.0)",
      ],
      files: ["audioGuide (referencia 1)", "audioGuide2 (referencia 2)"],
    },
  },

  // ── INDEX TTS 2.5 ──
  {
    id: "tts-dual-index",
    name: "Index TTS 2.5",
    capability: "audio",
    thumbnailUrl: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/model-thumbnails/tts-dual.png",
    tagline:
      "Clonación de voz con control de emoción. Dos referencias: una de voz, otra de emoción.",
    description:
      "Index TTS 2.5 es un motor TTS especializado en control emocional avanzado. Toma dos referencias de audio: una para la voz a clonar y otra para la emoción a aplicar. El resultado: 'decir este texto con esta voz, pero con esta emoción específica'. Ideal para publicidad, ficción sonora y narración dramática donde el matiz emocional es crítico.",
    specs: [
      { label: "Arquitectura", value: "Index TTS 2.5", detail: "Con Qwen0.6B-Emo (emoción)" },
      { label: "Modos", value: "2", detail: "Voice Cloning · Voice + Emotion" },
      { label: "Idiomas", value: "6", detail: "ES · EN · ZH · ZHEN · JA · AR" },
      { label: "Steps", value: "25 (default)", detail: "Ajustable 10–40" },
      { label: "Guide scale", value: "1.0 (default)", detail: "Control de adherencia" },
      { label: "Sample rate", value: "22,050 Hz", detail: "Calidad profesional" },
      { label: "Duración", value: "Custom (auto) · 5s–60s", detail: "Ajustable por preset" },
      { label: "Cross-lingual", value: "Sí", detail: "Voz china → output en inglés, ej." },
    ],
    useCases: [
      {
        title: "Publicidad con emoción",
        desc: "Locutor entusiasta, grave, cálido — la emoción viene de la referencia.",
        icon: "Megaphone",
      },
      {
        title: "Ficción sonora / audiodrama",
        desc: "Personajes con matices emocionales específicos: miedo, alegría, tristeza.",
        icon: "Drama",
      },
      {
        title: "Narración dramática",
        desc: "Audiolibros con carga emocional: suspenso, romance, thriller.",
        icon: "BookOpen",
      },
      {
        title: "Cross-lingual voice transfer",
        desc: "Usar una voz clonada en un idioma y generar output en otro idioma soportado.",
        icon: "Globe",
      },
      {
        title: "Contenido de marca con tono específico",
        desc: "Mantener la voz de la marca pero adaptar la emoción según el mensaje.",
        icon: "Sparkle",
      },
      {
        title: "Personajes con personalidad",
        desc: "Diferentes emociones para el mismo personaje en distintas escenas.",
        icon: "Users",
      },
    ],
    promptGuide: {
      structure:
        "Voice Cloning: [Referencia de voz] + texto | Voice + Emotion: [Referencia de voz] + [Referencia de emoción] + texto",
      negativePrompt:
        "No aplica — el control viene de las dos referencias de audio",
      tips: [
        "Separa el texto de la emoción: la emoción viene de la referencia, no del prompt.",
        "Usa referencias de emoción claras y reconocibles: alegría, tristeza, enojo, sorpresa.",
        "Ajusta la velocidad de habla por separado si el resultado suena rápido o lento.",
        "Activa la normalización de texto para números, siglas y monedas.",
        "La temperatura baja (0.6–0.8) da resultados más estables; alta (0.9+) más variación.",
        "Con cross-lingual, la voz hereda el acento del idioma destino de forma natural.",
      ],
    },
    examples: [
      {
        label: "Narración emotiva",
        context: "Cierre de audiolibro con carga emocional",
        prompt:
          "[Referencia de voz: narrador] [Referencia de emoción: audio triste] Y así, después de tantos años, todo lo que quedó fue el silencio.",
      },
      {
        label: "Publicidad entusiasta",
        context: "Spot publicitario de producto",
        prompt:
          "[Referencia de voz: locutor profesional] [Referencia de emoción: audio entusiasta] Descubre Pathfinder. La estación de IA que estabas esperando.",
      },
      {
        label: "Personaje con miedo",
        context: "Escena de suspenso para audiodrama",
        prompt:
          "[Referencia de voz: personaje femenino] [Referencia de emoción: audio con miedo] ¿Hay alguien ahí? Por favor, respóndeme.",
      },
      {
        label: "Cross-lingual",
        context: "Misma voz, diferente idioma",
        prompt:
          "[Referencia de voz: voz en español] texto en inglés, manteniendo el timbre original de la referencia, emoción neutral, ritmo natural",
      },
    ],
    limitations: [
      "Requiere referencia de audio obligatoriamente — no funciona sin ella.",
      "El control de emoción depende de la claridad de la referencia emocional.",
      "Menos idiomas soportados que OmniVoice (6 vs 13).",
      "Disponible en Colab solo para plan Creator o Founder.",
      "La clonación hereda el tono emocional de la referencia base si no se especifica la segunda.",
    ],
    fcmContract: {
      modes: [
        "Voice Cloning (1 referencia)",
        "Voice + Emotion (2 referencias)",
      ],
      params: [
        "voiceMode (2 opciones)",
        "emotionInstruction (descripción de emoción)",
        "language (6 idiomas)",
        "duration (Custom · 5s · 10s · 15s · 25s · 40s · 60s)",
        "seed",
        "steps (10–40, default 25)",
        "guideScale (default 1.0)",
        "speechSpeed",
        "temperature (0.6–1.0)",
        "topP (default 0.8)",
        "topK (default 30)",
        "textNormalization",
      ],
      files: ["audioGuide (voz)", "audioGuide2 (emoción)"],
    },
  },
];


// ═══════════════════════════════════════════════════════════════════════════
// MODEL TILE — Card de la grid
// ═══════════════════════════════════════════════════════════════════════════
const ModelTile: React.FC<{ model: Model; onClick: () => void }> = ({ model, onClick }) => {
  const meta = CAPABILITY_META[model.capability];
  const { Icon } = meta;

  return (
    <motion.button
      variants={fadeInUp}
      whileHover={{ y: -2 }}
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        background: "var(--pf-bg-secondary)",
        border: "1px solid var(--pf-border-subtle)",
        borderRadius: R.lg,
        overflow: "hidden",
        cursor: "pointer",
        padding: 0,
        width: "100%",
        transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${meta.color}40`;
        e.currentTarget.style.boxShadow = `0 8px 24px -8px ${meta.color}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--pf-border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {model.thumbnailUrl ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 10",
            background: "var(--pf-bg-inset)",
            overflow: "hidden",
          }}
        >
          <img
            src={model.thumbnailUrl}
            alt={model.name}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "transform 400ms ease-out",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.55) 100%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "absolute", top: 12, left: 12 }}>
            <Badge tone="brand" color={meta.color} colorDeep={meta.colorDeep} icon={<Icon size={11} strokeWidth={2.5} />}>
              {meta.label}
            </Badge>
          </div>
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 10",
            background: `${meta.color}10`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: meta.color,
          }}
        >
          <Icon size={40} strokeWidth={1.5} />
        </div>
      )}

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
        <div>
          <div
            style={{
              fontFamily: "var(--pf-font-display)",
              fontSize: "1.125rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--pf-text-primary)",
              marginBottom: 6,
            }}
          >
            {model.name}
          </div>
          <div
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.8125rem",
              lineHeight: 1.5,
              color: "var(--pf-text-secondary)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {model.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            fontFamily: "var(--pf-font-mono)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--pf-text-muted)",
            marginTop: "auto",
          }}
        >
          {model.specs.slice(0, 3).map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ opacity: 0.4 }}>·</span>}
              <span>{s.value}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MODEL DRAWER — Detalle en slide-over
// ═══════════════════════════════════════════════════════════════════════════
const ModelDrawer: React.FC<{ model: Model | null; onClose: () => void }> = ({ model, onClose }) => {
  const meta = model ? CAPABILITY_META[model.capability] : null;

  return (
    <Drawer
      open={!!model}
      onOpenChange={(open) => !open && onClose()}
      title={model?.name}
      subtitle={model?.tagline}
      width="620px"
    >
      {model && meta && (
        <Tabs
          defaultValue="specs"
          items={[
            { value: "specs", label: "Specs", icon: <Cpu size={14} /> },
            { value: "casos", label: "Casos de uso", icon: <Briefcase size={14} /> },
            { value: "prompt", label: "Prompt", icon: <BookOpen size={14} /> },
            { value: "ejemplos", label: "Ejemplos", icon: <Wand2 size={14} /> },
            { value: "fcm", label: "Studio", icon: <Layers size={14} /> },
          ]}
        >
          <TabContent value="specs">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {model.specs.map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "14px 16px",
                    background: "var(--pf-bg-secondary)",
                    border: "1px solid var(--pf-border-subtle)",
                    borderRadius: R.base,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--pf-font-mono)",
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--pf-text-muted)",
                      marginBottom: 6,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--pf-font-ui)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--pf-text-primary)",
                      marginBottom: s.detail ? 4 : 0,
                    }}
                  >
                    {s.value}
                  </div>
                  {s.detail && (
                    <div
                      style={{
                        fontFamily: "var(--pf-font-ui)",
                        fontSize: "0.75rem",
                        color: "var(--pf-text-muted)",
                        lineHeight: 1.4,
                      }}
                    >
                      {s.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p
              style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                lineHeight: 1.65,
                color: "var(--pf-text-secondary)",
                marginTop: 24,
                marginBottom: 0,
              }}
            >
              {model.description}
            </p>
          </TabContent>

          <TabContent value="casos">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {model.useCases.map((uc) => (
                <div
                  key={uc.title}
                  style={{
                    padding: "16px 18px",
                    background: "var(--pf-bg-secondary)",
                    border: "1px solid var(--pf-border-subtle)",
                    borderRadius: R.base,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--pf-font-display)",
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      color: "var(--pf-text-primary)",
                      marginBottom: 6,
                    }}
                  >
                    {uc.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--pf-font-ui)",
                      fontSize: "0.875rem",
                      lineHeight: 1.55,
                      color: "var(--pf-text-secondary)",
                    }}
                  >
                    {uc.desc}
                  </div>
                </div>
              ))}
            </div>
          </TabContent>

          <TabContent value="prompt">
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: meta.colorDeep,
                    marginBottom: 8,
                  }}
                >
                  Estructura recomendada
                </div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.8125rem",
                    color: "var(--pf-text-primary)",
                    padding: "12px 16px",
                    background: "var(--pf-bg-inset)",
                    border: "1px solid var(--pf-border-subtle)",
                    borderRadius: R.sm,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}
                >
                  {model.promptGuide.structure}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#EF4444",
                    marginBottom: 8,
                  }}
                >
                  Negative prompt
                </div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.75rem",
                    color: "var(--pf-text-secondary)",
                    padding: "12px 16px",
                    background: "var(--pf-bg-inset)",
                    border: "1px solid var(--pf-border-subtle)",
                    borderRadius: R.sm,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}
                >
                  {model.promptGuide.negativePrompt}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: meta.colorDeep,
                    marginBottom: 10,
                  }}
                >
                  Buenas prácticas
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {model.promptGuide.tips.map((tip, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        fontFamily: "var(--pf-font-ui)",
                        fontSize: "0.875rem",
                        lineHeight: 1.55,
                        color: "var(--pf-text-secondary)",
                      }}
                    >
                      <Lightbulb size={14} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 3 }} />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabContent>

          <TabContent value="ejemplos">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {model.examples.map((ex, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 18px",
                    background: "var(--pf-bg-secondary)",
                    border: "1px solid var(--pf-border-subtle)",
                    borderRadius: R.base,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "var(--pf-font-mono)",
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: meta.colorDeep,
                      }}
                    >
                      {ex.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--pf-font-ui)",
                        fontSize: "0.75rem",
                        color: "var(--pf-text-muted)",
                      }}
                    >
                      · {ex.context}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--pf-font-mono)",
                      fontSize: "0.8125rem",
                      lineHeight: 1.6,
                      color: "var(--pf-text-primary)",
                    }}
                  >
                    {ex.prompt}
                  </div>
                </div>
              ))}
            </div>
          </TabContent>

          <TabContent value="fcm">
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: meta.colorDeep,
                    marginBottom: 8,
                  }}
                >
                  Modos disponibles
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {model.fcmContract.modes.map((m) => (
                    <Badge key={m} tone="neutral">{m}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: meta.colorDeep,
                    marginBottom: 8,
                  }}
                >
                  Parámetros
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {model.fcmContract.params.map((p) => (
                    <li
                      key={p}
                      style={{
                        fontFamily: "var(--pf-font-mono)",
                        fontSize: "0.75rem",
                        color: "var(--pf-text-secondary)",
                        lineHeight: 1.5,
                      }}
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {model.fcmContract.files.length > 0 && (
                <div>
                  <div
                    style={{
                      fontFamily: "var(--pf-font-mono)",
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: meta.colorDeep,
                      marginBottom: 8,
                    }}
                  >
                    Archivos
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {model.fcmContract.files.map((f) => (
                      <li
                        key={f}
                        style={{
                          fontFamily: "var(--pf-font-mono)",
                          fontSize: "0.75rem",
                          color: "var(--pf-text-secondary)",
                          lineHeight: 1.5,
                        }}
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#B45309",
                    marginBottom: 10,
                  }}
                >
                  Limitaciones
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {model.limitations.map((l, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        fontFamily: "var(--pf-font-ui)",
                        fontSize: "0.875rem",
                        lineHeight: 1.55,
                        color: "var(--pf-text-secondary)",
                      }}
                    >
                      <AlertTriangle size={14} style={{ color: "#B45309", flexShrink: 0, marginTop: 3 }} />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabContent>
        </Tabs>
      )}
    </Drawer>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ACADEMY CONTENT
// ═══════════════════════════════════════════════════════════════════════════
export const AcademyContent: React.FC = () => {
  const [filter, setFilter] = useState<Capability | "all">("all");
  const [selected, setSelected] = useState<Model | null>(null);
  const [gridRef] = useAutoAnimate({ duration: 250, easing: "ease-out" });

  const counts = useMemo(
    () => ({
      all: MODELS.length,
      image: MODELS.filter((m) => m.capability === "image").length,
      video: MODELS.filter((m) => m.capability === "video").length,
      audio: MODELS.filter((m) => m.capability === "audio").length,
    }),
    []
  );

  const filtered = filter === "all" ? MODELS : MODELS.filter((m) => m.capability === filter);

  const filters: { id: Capability | "all"; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "image", label: "Imagen" },
    { id: "video", label: "Video" },
    { id: "audio", label: "Audio" },
  ];

  return (
    <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "80px 32px 120px" }}>
      {/* HERO TÉCNICO */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        style={{ marginBottom: 56 }}
      >
        <motion.div
          variants={fadeInUp}
          style={{
            fontFamily: "var(--pf-font-mono)",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--pf-text-muted)",
            marginBottom: 24,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span>CATÁLOGO</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>
            <NumberFlow value={counts.all} format={{ useGrouping: false }} /> MODELOS
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{counts.image} IMG · {counts.video} VID · {counts.audio} AUD</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>v2.1</span>
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          style={{
            fontFamily: "var(--pf-font-display)",
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 800,
            letterSpacing: "-0.045em",
            lineHeight: 1.02,
            color: "var(--pf-text-primary)",
            margin: 0,
            marginBottom: 20,
            maxWidth: 800,
          }}
        >
          Conoce tus modelos.
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "1.125rem",
            lineHeight: 1.6,
            color: "var(--pf-text-secondary)",
            maxWidth: 640,
            margin: 0,
          }}
        >
          Cada modelo tiene un superpoder distinto. Aprende qué hace, para qué sirve, cómo pedirlo y qué esperar antes de ir al Studio.
        </motion.p>
      </motion.div>

      {/* FILTROS */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: "1px solid var(--pf-border-subtle)",
        }}
      >
        {filters.map((f) => {
          const isActive = filter === f.id;
          const count = counts[f.id];
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                background: isActive ? "var(--pf-text-primary)" : "transparent",
                color: isActive ? "var(--pf-text-inverse)" : "var(--pf-text-secondary)",
                border: isActive ? "1px solid var(--pf-text-primary)" : "1px solid var(--pf-border-subtle)",
                borderRadius: R.full,
                fontFamily: "var(--pf-font-mono)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 150ms ease-out",
              }}
            >
              {f.label}
              <span style={{ opacity: 0.6 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* GRID */}
      <div
        ref={gridRef}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        {filtered.map((model) => (
          <ModelTile key={model.id} model={model} onClick={() => setSelected(model)} />
        ))}
      </div>

      {/* DRAWER */}
      <ModelDrawer model={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ACADEMY PAGE — wrapper público
// ═══════════════════════════════════════════════════════════════════════════
const AcademyPage: React.FC = () => (
  <MarketingLayout>
    <AcademyContent />
  </MarketingLayout>
);

export default AcademyPage;
