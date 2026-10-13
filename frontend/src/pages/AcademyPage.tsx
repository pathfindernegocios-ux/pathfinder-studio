// src/pages/AcademyPage.tsx
// Guía de modelos — Conoce tus modelos
// Bloque 1: Base + Modelos de Imagen (Krea, Qwen, Flux)
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Image as ImageIcon,
  Clapperboard,
  Mic,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ArrowRight,
  Wand2,
  Layers,
  Briefcase,
  Sparkle,
  Cpu,
} from "lucide-react";
import MarketingLayout from "../components/marketing/MarketingLayout";

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
];

// ============================================================================
// COMPONENTES
// ============================================================================

// Bloque de contenido genérico
const ContentBlock: React.FC<{
  Icon: React.ElementType;
  title: string;
  items: string[];
  color: string;
}> = ({ Icon, title, items, color }) => (
  <div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "14px",
        fontFamily: "var(--pf-font-display, system-ui)",
        fontSize: "1.0625rem",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        color: "var(--pf-text-primary, #0A0A0A)",
      }}
    >
      <Icon size={18} style={{ color }} />
      <span>{title}</span>
    </div>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((it, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.9375rem",
            lineHeight: 1.6,
            color: "var(--pf-text-secondary, #525252)",
          }}
        >
          <span style={{ flexShrink: 0, marginTop: "8px", width: "4px", height: "4px", borderRadius: "50%", background: color }} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  </div>
);

// Bloque de ejemplo de prompt
const PromptExample: React.FC<{ example: PromptExample; color: string }> = ({ example, color }) => (
  <div
    style={{
      padding: "18px 20px",
      background: "var(--pf-bg-secondary, #FAFAFA)",
      border: "1px solid var(--pf-border-subtle, #F4F4F5)",
      borderRadius: "12px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
      <span style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color }}>
        {example.label}
      </span>
      <span style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.6875rem", color: "var(--pf-text-muted, #A1A1AA)" }}>
        · {example.context}
      </span>
    </div>
    <div style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--pf-text-primary, #0A0A0A)", fontStyle: "italic" }}>
      "{example.prompt}"
    </div>
  </div>
);

// ============================================================================
// MODEL CARD — Estructura premium de 8 secciones
// ============================================================================
const ModelCard: React.FC<{ model: Model }> = ({ model }) => {
  const meta = CAPABILITY_META[model.capability];
  const { Icon } = meta;
  const [showSpecs, setShowSpecs] = useState(false);
  const [showFCM, setShowFCM] = useState(false);

  return (
    <section id={model.id} style={{ scrollMarginTop: "100px", paddingTop: "64px", paddingBottom: "64px", borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)" }}>

      {/* 1. ENCABEZADO */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 12px", background: `${meta.color}14`, border: `1px solid ${meta.color}40`, borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.6875rem", fontWeight: 700, color: meta.colorDeep, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>
          <Icon size={12} strokeWidth={2.5} />
          {meta.label}
        </div>
        <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--pf-text-primary, #0A0A0A)", margin: 0, marginBottom: "10px" }}>
          {model.name}
        </h2>
        <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1rem", color: "var(--pf-text-secondary, #525252)", lineHeight: 1.6, margin: 0, marginBottom: "16px", maxWidth: "720px" }}>
          {model.tagline}
        </p>
        <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.9375rem", color: "var(--pf-text-secondary, #525252)", lineHeight: 1.7, margin: 0, maxWidth: "720px" }}>
          {model.description}
        </p>
      </div>

      {/* 2. FICHA TÉCNICA */}
      <button onClick={() => setShowSpecs(!showSpecs)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "var(--pf-bg-secondary, #FAFAFA)", border: "1px solid var(--pf-border-subtle, #F4F4F5)", borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.75rem", fontWeight: 600, color: "var(--pf-text-secondary, #525252)", cursor: "pointer", marginBottom: "24px" }}>
        <Cpu size={14} />
        Especificaciones técnicas
        <ChevronDown size={14} style={{ transform: showSpecs ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>

      {showSpecs && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px", padding: "20px", background: "var(--pf-bg-secondary, #FAFAFA)", border: "1px solid var(--pf-border-subtle, #F4F4F5)", borderRadius: "12px" }}>
          {model.specs.map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--pf-text-muted, #A1A1AA)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", fontFamily: "var(--pf-font-ui, system-ui)" }}>{s.label}</div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--pf-text-primary, #0A0A0A)", fontFamily: "var(--pf-font-ui, system-ui)" }}>{s.value}</div>
              {s.detail && <div style={{ fontSize: "0.75rem", color: "var(--pf-text-muted, #A1A1AA)", fontFamily: "var(--pf-font-ui, system-ui)", marginTop: "2px" }}>{s.detail}</div>}
            </div>
          ))}
        </div>
      )}

      {/* 3. CASOS DE USO PROFESIONALES */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", fontFamily: "var(--pf-font-display, system-ui)", fontSize: "1.0625rem", fontWeight: 600, color: "var(--pf-text-primary, #0A0A0A)" }}>
          <Briefcase size={18} style={{ color: meta.color }} />
          <span>Casos de uso profesionales</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
          {model.useCases.map((uc) => (
            <div key={uc.title} style={{ padding: "16px 18px", background: "var(--pf-bg-secondary, #FAFAFA)", border: "1px solid var(--pf-border-subtle, #F4F4F5)", borderRadius: "12px" }}>
              <div style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "0.875rem", fontWeight: 700, color: "var(--pf-text-primary, #0A0A0A)", marginBottom: "6px" }}>{uc.title}</div>
              <div style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.8125rem", lineHeight: 1.55, color: "var(--pf-text-secondary, #525252)" }}>{uc.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. GUÍA DE PROMPT */}
      <div style={{ marginBottom: "32px", padding: "24px 28px", background: "var(--pf-bg-secondary, #FAFAFA)", border: "1px solid var(--pf-border-subtle, #F4F4F5)", borderRadius: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", fontFamily: "var(--pf-font-display, system-ui)", fontSize: "1.0625rem", fontWeight: 600, color: "var(--pf-text-primary, #0A0A0A)" }}>
          <BookOpen size={18} style={{ color: meta.color }} />
          <span>Guía de prompt</span>
        </div>
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: meta.colorDeep, marginBottom: "6px" }}>Estructura recomendada</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "var(--pf-text-primary, #0A0A0A)", padding: "10px 14px", background: "var(--pf-bg-elevated, #FFFFFF)", border: "1px solid var(--pf-border-subtle, #F4F4F5)", borderRadius: "8px" }}>{model.promptGuide.structure}</div>
        </div>
        <div style={{ marginBottom: "18px" }}>
          <div style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#EF4444", marginBottom: "6px" }}>Negative prompt</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--pf-text-secondary, #525252)", padding: "10px 14px", background: "var(--pf-bg-elevated, #FFFFFF)", border: "1px solid var(--pf-border-subtle, #F4F4F5)", borderRadius: "8px" }}>{model.promptGuide.negativePrompt}</div>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          {model.promptGuide.tips.map((tip, i) => (
            <li key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.875rem", lineHeight: 1.55, color: "var(--pf-text-secondary, #525252)" }}>
              <Lightbulb size={14} style={{ color: "#F59E0B", flexShrink: 0, marginTop: "3px" }} />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. EJEMPLOS DE PROMPT */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", fontFamily: "var(--pf-font-display, system-ui)", fontSize: "1.0625rem", fontWeight: 600, color: "var(--pf-text-primary, #0A0A0A)" }}>
          <Wand2 size={18} style={{ color: meta.color }} />
          <span>Ejemplos profesionales</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px" }}>
          {model.examples.map((ex, i) => (
            <PromptExample key={i} example={ex} color={meta.colorDeep} />
          ))}
        </div>
      </div>

      {/* 6. LIMITACIONES */}
      <ContentBlock Icon={AlertTriangle} title="Limitaciones" items={model.limitations} color="#B45309" />

      {/* 7. CONTRATO FCM (colapsable) */}
      <button onClick={() => setShowFCM(!showFCM)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "var(--pf-bg-secondary, #FAFAFA)", border: "1px solid var(--pf-border-subtle, #F4F4F5)", borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.75rem", fontWeight: 600, color: "var(--pf-text-secondary, #525252)", cursor: "pointer", marginTop: "24px" }}>
        <Layers size={14} />
        Contrato con el Studio
        <ChevronDown size={14} style={{ transform: showFCM ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {showFCM && (
        <div style={{ marginTop: "16px", padding: "20px", background: "var(--pf-bg-secondary, #FAFAFA)", border: "1px solid var(--pf-border-subtle, #F4F4F5)", borderRadius: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div>
            <div style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: meta.colorDeep, marginBottom: "8px" }}>Modos disponibles</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              {model.fcmContract.modes.map((m) => (
                <li key={m} style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.8125rem", color: "var(--pf-text-secondary, #525252)" }}>· {m}</li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: meta.colorDeep, marginBottom: "8px" }}>Parámetros</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              {model.fcmContract.params.map((p) => (
                <li key={p} style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.8125rem", color: "var(--pf-text-secondary, #525252)" }}>· {p}</li>
              ))}
            </ul>
          </div>
          {model.fcmContract.files.length > 0 && (
            <div>
              <div style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: meta.colorDeep, marginBottom: "8px" }}>Archivos</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                {model.fcmContract.files.map((f) => (
                  <li key={f} style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.8125rem", color: "var(--pf-text-secondary, #525252)" }}>· {f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

// ============================================================================
// ACADEMY CONTENT
// ============================================================================
export const AcademyContent: React.FC = () => {
  const [filter, setFilter] = useState<Capability | "all">("all");
  const filtered = filter === "all" ? MODELS : MODELS.filter((m) => m.capability === filter);

  const filters: { id: Capability | "all"; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "image", label: "Imagen" },
    { id: "video", label: "Video" },
    { id: "audio", label: "Audio" },
  ];

  return (
    <div style={{ maxWidth: "980px", margin: "0 auto", padding: "60px 24px 120px" }}>
      {/* HERO */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", background: "rgba(99,102,241,0.10)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.75rem", fontWeight: 600, color: "#A5B4FC", marginBottom: "20px" }}>
          <BookOpen size={14} />
          Guía de modelos
        </div>
        <h1 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: "var(--pf-text-primary, #0A0A0A)", margin: 0, marginBottom: "20px" }}>
          Conoce tus modelos
        </h1>
        <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1.125rem", lineHeight: 1.6, color: "var(--pf-text-secondary, #525252)", maxWidth: "680px", margin: 0 }}>
          Cada modelo tiene un superpoder distinto. Aquí aprendes qué hace, para qué sirve, cómo pedirlo y qué esperar. Conocer tus herramientas es la diferencia entre generar 20 veces hasta acertar y acertar en el primer intento.
        </p>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingBottom: "24px", marginBottom: "8px" }}>
        {filters.map((f) => {
          const isActive = filter === f.id;
          const count = f.id === "all" ? MODELS.length : MODELS.filter((m) => m.capability === f.id).length;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: isActive ? "var(--pf-text-primary, #0A0A0A)" : "var(--pf-bg-secondary, #FAFAFA)", color: isActive ? "var(--pf-text-inverse, #FFFFFF)" : "var(--pf-text-secondary, #525252)", border: isActive ? "1px solid var(--pf-text-primary, #0A0A0A)" : "1px solid var(--pf-border-subtle, #F4F4F5)", borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}>
              {f.label}
              <span style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.6 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* LISTA DE MODELOS */}
      {filtered.map((model) => (
        <ModelCard key={model.id} model={model} />
      ))}

      {/* CTA FINAL */}
      <section style={{ marginTop: "64px", padding: "48px 32px", background: "#0A0A0A", color: "#FFFFFF", borderRadius: "20px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "14px", background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)", color: "#A5B4FC", marginBottom: "20px" }}>
          <Sparkle size={26} />
        </div>
        <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em", margin: 0, marginBottom: "16px", color: "#FFFFFF" }}>
          ¿Listo para ponerlo a prueba?
        </h2>
        <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1rem", color: "rgba(255,255,255,0.7)", marginBottom: "28px", maxWidth: "520px", margin: "0 auto 28px", lineHeight: 1.5 }}>
          Abre el Studio y elige el modelo que más te sirva para tu proyecto.
        </p>
        <Link to="/studio" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", padding: "14px 32px", background: "#FFFFFF", color: "#0A0A0A", borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1rem", fontWeight: 700 }}>
          Ir al Studio
          <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
};

// ============================================================================
// ACADEMY PAGE — wrapper público
// ============================================================================
const AcademyPage: React.FC = () => (
  <MarketingLayout>
    <AcademyContent />
  </MarketingLayout>
);

export default AcademyPage;
