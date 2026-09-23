// src/pages/AcademyPage.tsx
import React from "react";
import { BookOpen, Lightbulb, AlertTriangle, Sparkles } from "lucide-react";
import MarketingLayout from "../components/marketing/MarketingLayout";

// ---------------------------------------------------------------------------
// ModelSection — sección por modelo
// ---------------------------------------------------------------------------
interface ModelSectionProps {
  name: string;
  tagline: string;
  capability: "image" | "video";
  architecture: string;
  quantization: string;
  recommendedSteps: string;
  whatItDoes: string[];
  idealFor: string[];
  limitations: string[];
  promptingTips: string[];
}

const ModelSection: React.FC<ModelSectionProps> = ({
  name,
  tagline,
  capability,
  architecture,
  quantization,
  recommendedSteps,
  whatItDoes,
  idealFor,
  limitations,
  promptingTips,
}) => (
  <section
    style={{
      paddingTop: "48px",
      paddingBottom: "48px",
      borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
    }}
  >
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 12px",
          background: capability === "image" ? "rgba(99,102,241,0.08)" : "rgba(245,158,11,0.08)",
          border: `1px solid ${capability === "image" ? "rgba(99,102,241,0.3)" : "rgba(245,158,11,0.3)"}`,
          borderRadius: "9999px",
          fontFamily: "var(--pf-font-ui, system-ui)",
          fontSize: "0.6875rem",
          fontWeight: 700,
          color: capability === "image" ? "#4F46E5" : "#B45309",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "12px",
        }}
      >
        {capability === "image" ? "Imagen" : "Video"}
      </div>
      <h2
        style={{
          fontFamily: "var(--pf-font-display, system-ui)",
          fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--pf-text-primary, #0A0A0A)",
          margin: 0,
          marginBottom: "8px",
        }}
      >
        {name}
      </h2>
      <p
        style={{
          fontFamily: "var(--pf-font-ui, system-ui)",
          fontSize: "1rem",
          color: "var(--pf-text-secondary, #525252)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {tagline}
      </p>
    </div>

    {/* Ficha técnica */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px",
        marginBottom: "32px",
      }}
    >
      {[
        { l: "Arquitectura", v: architecture },
        { l: "Cuantización", v: quantization },
        { l: "Steps recomendados", v: recommendedSteps },
      ].map((x) => (
        <div
          key={x.l}
          style={{
            background: "var(--pf-bg-secondary, #FAFAFA)",
            border: "1px solid var(--pf-border-subtle, #F4F4F5)",
            borderRadius: "10px",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--pf-text-muted, #A1A1AA)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "4px",
              fontFamily: "var(--pf-font-ui, system-ui)",
            }}
          >
            {x.l}
          </div>
          <div
            style={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "var(--pf-text-primary, #0A0A0A)",
              fontFamily: "var(--pf-font-ui, system-ui)",
            }}
          >
            {x.v}
          </div>
        </div>
      ))}
    </div>

    {/* Grid de contenido */}
    <div style={{ display: "grid", gap: "28px" }}>
      <ContentBlock
        icon={<Sparkles size={18} />}
        title="Qué hace"
        items={whatItDoes}
        color="#4F46E5"
      />
      <ContentBlock
        icon={<Lightbulb size={18} />}
        title="Ideal para"
        items={idealFor}
        color="#10B981"
      />
      <ContentBlock
        icon={<AlertTriangle size={18} />}
        title="Limitaciones"
        items={limitations}
        color="#B45309"
      />
      <ContentBlock
        icon={<BookOpen size={18} />}
        title="Buenas prácticas de prompt"
        items={promptingTips}
        color="#4F46E5"
      />
    </div>
  </section>
);

const ContentBlock: React.FC<{
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: string;
}> = ({ icon, title, items, color }) => (
  <div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "12px",
        color,
        fontFamily: "var(--pf-font-display, system-ui)",
        fontSize: "1.0625rem",
        fontWeight: 600,
        letterSpacing: "-0.01em",
      }}
    >
      {icon}
      <span style={{ color: "var(--pf-text-primary, #0A0A0A)" }}>{title}</span>
    </div>
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
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
          <span
            style={{
              flexShrink: 0,
              marginTop: "8px",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: color,
            }}
          />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  </div>
);

// ---------------------------------------------------------------------------
// AcademyContent — contenido sin wrapper
// ---------------------------------------------------------------------------
export const AcademyContent: React.FC = () => {
  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", padding: "60px 24px 120px" }}>
        {/* Hero */}
        <div style={{ marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "9999px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#4F46E5",
              marginBottom: "20px",
            }}
          >
            <BookOpen size={14} />
            Academy
          </div>

          <h1
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "var(--pf-text-primary, #0A0A0A)",
              margin: 0,
              marginBottom: "20px",
            }}
          >
            Guía de modelos
          </h1>

          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1.125rem",
              lineHeight: 1.6,
              color: "var(--pf-text-secondary, #525252)",
              maxWidth: "620px",
              margin: 0,
            }}
          >
            Aprende qué puede hacer cada modelo, cuándo usarlo y cómo sacarle el máximo provecho.
            Conocer las capacidades y limitaciones de cada uno te va a permitir generar mejores
            resultados en menos intentos.
          </p>
        </div>

        {/* Modelos */}
        <ModelSection
          name="Krea 2 Turbo"
          tagline="Generación de imágenes rápidas con estilos predefinidos. Ideal para iterar ideas visuales con velocidad."
          capability="image"
          architecture="12B DiT (Dense Transformer)"
          quantization="INT8"
          recommendedSteps="8"
          whatItDoes={[
            "Genera imágenes desde texto (Text-to-Image).",
            "Incluye estilos predefinidos: Cinematic, Anime, Photorealistic, 3D Render.",
            "Produce resultados de alta calidad en resoluciones de 1024px a 2K.",
            "Es el modelo más rápido del catálogo: en la estación, las generaciones tardan segundos.",
          ]}
          idealFor={[
            "Iterar ideas visuales rápido: probar 5-10 variaciones antes de decidirte.",
            "Generar imágenes conceptuales para exploración visual.",
            "Contenido con estética cinematográfica o fotográfica específica.",
            "Usuarios nuevos que quieren ver resultados rápidos antes de modelos más complejos.",
          ]}
          limitations={[
            "No edita imágenes existentes — solo genera nuevas desde cero.",
            "No mantiene consistencia de identidad entre generaciones (un personaje puede cambiar).",
            "Las manos y anatomías complejas pueden fallar con cierta frecuencia.",
            "No acepta imágenes de referencia para mantener un sujeto.",
          ]}
          promptingTips={[
            "Sé descriptivo pero concreto: 'mujer joven con abrigo rojo mirando al mar al atardecer, cinematográfico'.",
            "Incluye iluminación, composición y atmósfera. El modelo responde muy bien a esos detalles.",
            "Usa el negative prompt para excluir elementos no deseados: 'blurry, low quality, distorted'.",
            "Los estilos predefinidos ya agregan calidad técnica — combínalos con un prompt específico.",
          ]}
        />

        <ModelSection
          name="Flux 2 Klein 4B"
          tagline="Edición avanzada de imágenes y generación con referencias. Ideal para modificar imágenes existentes manteniendo coherencia visual."
          capability="image"
          architecture="Rectified Flow Transformer"
          quantization="INT8"
          recommendedSteps="4"
          whatItDoes={[
            "Genera imágenes desde texto (Text-to-Image) con calidad superior a Krea.",
            "Edita imágenes existentes usando Reference Mode (Krea Identity Edit integrado).",
            "Soporta inpainting y outpainting (rellenar o extender zonas específicas).",
            "Puede mantener la identidad de un sujeto entre múltiples generaciones usando referencias.",
          ]}
          idealFor={[
            "Editar una imagen existente para agregar, quitar o cambiar elementos específicos.",
            "Mantener la misma persona / objeto / escena entre varias imágenes.",
            "Restaurar zonas dañadas o completar partes faltantes de una imagen.",
            "Crear variaciones de un mismo sujeto con estética coherente.",
          ]}
          limitations={[
            "Más lento que Krea 2 Turbo (aprox 2-3x por generación).",
            "Consume más VRAM — si tu sesión de Kaggle tiene otros modelos cargados, puede ralentizarse.",
            "Requiere configurar correctamente el modo de referencia (KI o I) para mejores resultados.",
            "No es tan bueno con estilos artísticos estilizados (anime, cartoon).",
          ]}
          promptingTips={[
            "Para edición, describe el cambio específico: 'agrega una bufanda azul al personaje'.",
            "Para inpainting, describe solo lo que debe ir en la zona seleccionada.",
            "Usa el modo KI (Key Identity) cuando quieras mantener el sujeto original de una referencia.",
            "Usa el modo I (Identity) cuando la referencia sea un objeto o persona secundaria a agregar.",
          ]}
        />

        <ModelSection
          name="LTX 2.3"
          tagline="Generación de video con audio sincronizado, control de escenas y coherencia visual entre clips."
          capability="video"
          architecture="22B Distilled (GGUF Q4_K_M)"
          quantization="Q4_K_M (4-bit)"
          recommendedSteps="8"
          whatItDoes={[
            "Genera videos con audio sincronizado (voz, sonido ambiente, efectos).",
            "Soporta Start Frame y End Frame: definir el inicio y fin visual del video.",
            "Permite generar audio por separado y sincronizarlo con el video.",
            "Multi-escena: hasta 5 escenas encadenadas visualmente en una sola toma final.",
            "Duraciones flexibles: desde 2 hasta 30 segundos por escena.",
          ]}
          idealFor={[
            "Videos con locución: escribís el guion con estructura [VISUAL][SPEECH][SOUND].",
            "Animar imágenes fijas (Start Frame) con movimiento coherente.",
            "Storyboards animados con transiciones entre escenas.",
            "Contenido audiovisual completo para redes sociales o presentaciones.",
          ]}
          limitations={[
            "El modelo más lento: entre 5 y 10 minutos de carga inicial en Kaggle.",
            "El más pesado: requiere la GPU T4 x2 de Kaggle sin excepción.",
            "Solo disponible en Kaggle (no en otros entornos por ahora).",
            "Generar 30 segundos con audio puede tardar varios minutos en procesarse.",
          ]}
          promptingTips={[
            "Usa la estructura: [VISUAL] descripción visual, [SPEECH] lo que dice el personaje, [SOUND] sonidos ambientales.",
            "Para multi-escena, encadena visualmente: el End Frame de una escena es el Start Frame de la siguiente.",
            "Especifica el movimiento: 'la cámara se acerca lentamente mientras el personaje sonríe'.",
            "Si usás audio externo, indica 'match video duration to audio length' para sincronización automática.",
          ]}
        />

        {/* Footer note */}
        <div
          style={{
            marginTop: "48px",
            padding: "20px 24px",
            background: "var(--pf-bg-secondary, #FAFAFA)",
            border: "1px solid var(--pf-border-subtle, #F4F4F5)",
            borderRadius: "12px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.875rem",
            color: "var(--pf-text-secondary, #525252)",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "var(--pf-text-primary, #0A0A0A)" }}>Nota:</strong> Pathfinder
          entrega la estación de trabajo preconfigurada con estos modelos validados. Usar modelos
          distintos puede requerir mayor capacidad de hardware o provocar inestabilidad. Si tienes
          dudas sobre cuál usar, empieza por Krea 2 Turbo para imágenes y LTX 2.3 para video.
        </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AcademyPage — wrapper público con MarketingLayout
// ---------------------------------------------------------------------------
const AcademyPage: React.FC = () => (
  <MarketingLayout>
    <AcademyContent />
  </MarketingLayout>
);

export default AcademyPage;
