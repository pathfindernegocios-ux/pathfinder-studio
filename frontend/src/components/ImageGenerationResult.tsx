import { useState } from "react";
import { palette, fontDisplay, resultHeroFrame, resultVariantThumb } from "../styles/tokens";

/* ------------------------------------------------------------
   ImageGenerationResult
   Le da a Image el mismo nivel de dignidad que GenerationResult
   le da a Video: la imagen es protagonista, hay una vista
   principal con variantes navegables si se generaron varias, y
   las acciones (descargar / guardar / descartar / crear otra)
   siguen el mismo flujo de persistencia existente (saveCreation
   → save-creation → R2 → complete-creation).

   IMPORTANTE: este archivo va en
   components/ImageGenerationResult.tsx — es un componente
   nuevo y distinto de components/GenerationResult.tsx (el de
   Video), que no debe tocarse.
   ------------------------------------------------------------ */

interface ImageGenerationResultProps {
  imageSrcs: string[];
  engineLabel: string;
  onSave: (src: string) => void;
  isSaving: boolean;
  saveError: string | null;
  onDiscard: () => void;
  onCreateAnother: () => void;
}

export function ImageGenerationResult({
  imageSrcs,
  engineLabel,
  onSave,
  isSaving,
  saveError,
  onDiscard,
  onCreateAnother,
}: ImageGenerationResultProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeSrc = imageSrcs[activeIdx] ?? imageSrcs[0];
  const hasVariants = imageSrcs.length > 1;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 720, marginBottom: 22 }}>
        <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: palette.ink, letterSpacing: -0.3 }}>
          Tu creación
        </div>
        <div style={{ marginTop: 4, fontSize: 12.5, color: palette.inkFaint, letterSpacing: 0.2 }}>
          {engineLabel}
          {hasVariants && ` · ${imageSrcs.length} variantes`}
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          ...resultHeroFrame,
          width: "100%",
          maxWidth: 640,
          maxHeight: "min(66vh, 720px)",
        }}
      >
        <img
          src={activeSrc}
          alt="Resultado generado"
          style={{ display: "block", width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
        />
      </div>

      {/* Variantes */}
      {hasVariants && (
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {imageSrcs.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              style={{ ...resultVariantThumb(idx === activeIdx), border: "none", padding: 0, background: "transparent" }}
              aria-label={`Ver variante ${idx + 1}`}
            >
              <img src={src} alt={`Variante ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          display: "flex",
          gap: 14,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 26,
          flexWrap: "wrap",
        }}
      >
        <a
          href={activeSrc}
          download
          target="_blank"
          rel="noreferrer"
          className="pf-btn-ghost"
          style={{ padding: "12px 22px", fontSize: 14, textDecoration: "none", display: "inline-block" }}
        >
          Descargar
        </a>

        <button onClick={() => onSave(activeSrc)} disabled={isSaving} className="pf-btn-primary" style={{ padding: "12px 22px", fontSize: 14 }}>
          {isSaving ? "Guardando..." : "Guardar"}
        </button>

        <button onClick={onCreateAnother} className="pf-btn-ghost" style={{ padding: "12px 22px", fontSize: 14 }}>
          Crear otra
        </button>

        <button onClick={onDiscard} className="pf-btn-ghost" style={{ padding: "12px 22px", fontSize: 14 }}>
          Descartar
        </button>
      </div>

      {saveError && <p style={{ color: palette.danger, fontSize: 13, marginTop: 10 }}>{saveError}</p>}
      {isSaving && <p style={{ color: palette.inkFaint, fontSize: 13, marginTop: 10 }}>Guardando en Mis creaciones...</p>}
    </div>
  );
}
