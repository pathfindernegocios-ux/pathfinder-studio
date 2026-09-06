import { useState, useRef } from "react";
import { useGenerationContext } from "../context/GenerationContext";
import {
  palette,
  inputBase,
  labelStyle,
  pillButton,
  tierCard,
  tierCardTitle,
  tierCardEngine,
  tierCardTagline,
  creativeSurface,
  promptTextarea,
  negativePromptToggle,
  referenceTrayLabel,
  referenceThumb,
  referenceThumbRemove,
  referenceAddTile,
  controlGroup,
  controlGroupTitle,
  aspectChip,
} from "../styles/tokens";

/* ------------------------------------------------------------
   Rediseño completo de Image Studio.

   Principios aplicados (orden maestra §1-16):
   - Prompt + referencias viven en una sola superficie creativa,
     no en paneles separados ni acordeones.
   - Standard/Premium se presentan como tarjetas con intención
     creativa, no como un toggle técnico.
   - Las referencias son miniaturas reales (84px), no un
     <input type="file"> desnudo.
   - Los controles se agrupan por función y se revelan
     progresivamente (Formato / Control creativo / Edición /
     Avanzado), sin ocultar las referencias.
   - La arquitectura (model_id, payloads Krea/Flux, handleGenerate)
     no cambia respecto a la versión anterior.
   ------------------------------------------------------------ */

const KREA_RESOLUTIONS = ["1024px", "1536px", "2048px (2K)"];
const FLUX_RESOLUTIONS = ["1024px", "1536px", "2048px (2K)"];

const ASPECT_RATIOS = [
  { label: "1:1", ratio: 1 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "9:16", ratio: 9 / 16 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "3:4", ratio: 3 / 4 },
];

const REF_MODES = [
  { value: "Ninguna (Texto → Imagen)", label: "Sin referencia" },
  { value: "Sujeto/Escenario + Personas u Objetos (KI)", label: "Escenario + sujeto" },
  { value: "Solo Personas u Objetos (I)", label: "Solo sujeto" },
];

const INPAINTING_METHODS = [
  { value: "Masked Denoising : Inpainted area may reuse some content that has been masked", label: "Rápido" },
  { value: "LanPaint (2 steps): ~2x slower, easy task", label: "Preciso (2x)" },
  { value: "LanPaint (5 steps): ~5x slower, medium task", label: "Preciso (5x)" },
  { value: "LanPaint (10 steps): ~10x slower, hard task", label: "Preciso (10x)" },
  { value: "LanPaint (15 steps): ~15x slower, very hard task", label: "Preciso (15x)" },
];

const MODEL_META: Record<string, { label: string; engine: string; tagline: string }> = {
  "krea-2-turbo": {
    label: "Standard",
    engine: "Krea 2 Turbo",
    tagline: "Rápido y versátil — ideal para explorar ideas.",
  },
  "flux-2-klein-4b": {
    label: "Premium",
    engine: "Flux 2 Klein 4B",
    tagline: "Referencias, inpainting y máxima fidelidad.",
  },
};

function referenceUrl(file: File) {
  return URL.createObjectURL(file);
}

export function ImageGenerationForm() {
  const { activeImageModelId, setActiveImageModelId, imageModels, handleGenerate, isLoading } =
    useGenerationContext();

  const isFlux = activeImageModelId === "flux-2-klein-4b";

  // Estado común
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [showNegative, setShowNegative] = useState(false);
  const [steps, setSteps] = useState(isFlux ? 4 : 8);
  const [resolution, setResolution] = useState("1024px");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [seed, setSeed] = useState(-1);
  const [numImages, setNumImages] = useState(1);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Krea
  const [stylePreset, setStylePreset] = useState("None");
  const STYLES = ["None", "Cinematic", "Photographic", "Anime", "Cyberpunk", "Fantasy"];

  // Flux
  const [guideScaleFlux, setGuideScaleFlux] = useState(5.0);
  const [embeddedGuidance, setEmbeddedGuidance] = useState(1.0);
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [refModeLabel, setRefModeLabel] = useState(REF_MODES[0].value);
  const [maskFile, setMaskFile] = useState<File | null>(null);
  const [modelModeLabel, setModelModeLabel] = useState(INPAINTING_METHODS[0].value);
  const [editingOpen, setEditingOpen] = useState(false);

  const refInputRef = useRef<HTMLInputElement | null>(null);
  const maskInputRef = useRef<HTMLInputElement | null>(null);

  const isButtonDisabled = !prompt.trim() || isLoading;

  const handleModelChange = (modelId: string) => {
    setActiveImageModelId(modelId);
    setSteps(modelId === "flux-2-klein-4b" ? 4 : 8);
  };

  const addReferenceFiles = (files: FileList | null) => {
    if (!files) return;
    setRefFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removeReference = (idx: number) => {
    setRefFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (isFlux) {
      handleGenerate({
        prompt,
        seed,
        negativePrompt,
        steps,
        resolution,
        aspectRatio,
        numImages,
        refFiles,
        refModeLabel,
        maskFile,
        modelModeLabel,
        fluxGuideScale: guideScaleFlux,
        embeddedGuidance,
      });
    } else {
      handleGenerate({
        prompt,
        negativePrompt,
        steps,
        resolution,
        aspectRatio,
        seed,
        numImages,
        stylePreset,
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Tier: Standard / Premium */}
      {imageModels.length > 1 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {imageModels.map((m) => {
            const meta = MODEL_META[m.model_id] ?? { label: m.model_id, engine: m.model_id, tagline: "" };
            const active = activeImageModelId === m.model_id;
            return (
              <button key={m.model_id} type="button" onClick={() => handleModelChange(m.model_id)} style={tierCard(active)}>
                <div style={tierCardTitle(active)}>{meta.label}</div>
                <div style={tierCardEngine}>{meta.engine}</div>
                <div style={tierCardTagline}>{meta.tagline}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Superficie creativa: Prompt + Referencias */}
      <div style={creativeSurface}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Describe la imagen que quieres crear..."
          style={promptTextarea}
        />

        {showNegative ? (
          <div>
            <label style={{ ...labelStyle, fontSize: 11.5 }}>Negative Prompt</label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              rows={2}
              placeholder="low quality, blurry, distorted..."
              style={{ ...inputBase, resize: "vertical", minHeight: 50, fontSize: 13 }}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setShowNegative(true)} style={negativePromptToggle}>
            + Negative prompt
          </button>
        )}

        {isFlux && (
          <div>
            <div style={referenceTrayLabel}>Referencias</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {refFiles.map((file, idx) => (
                <div key={idx} style={referenceThumb}>
                  <img src={referenceUrl(file)} alt={`Referencia ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button type="button" onClick={() => removeReference(idx)} style={referenceThumbRemove} aria-label={`Quitar referencia ${idx + 1}`}>
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => refInputRef.current?.click()} style={referenceAddTile} aria-label="Agregar referencia">
                +
              </button>
              <input
                ref={refInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => addReferenceFiles(e.target.files)}
                style={{ display: "none" }}
              />
            </div>

            {refFiles.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {REF_MODES.map((m) => (
                  <button key={m.value} type="button" onClick={() => setRefModeLabel(m.value)} style={pillButton(refModeLabel === m.value)}>
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formato */}
      <div style={controlGroup}>
        <div style={controlGroupTitle}>Formato</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {ASPECT_RATIOS.map((opt) => {
            const active = aspectRatio === opt.label;
            const maxBox = 26;
            const boxW = opt.ratio >= 1 ? maxBox : maxBox * opt.ratio;
            const boxH = opt.ratio >= 1 ? maxBox / opt.ratio : maxBox;
            return (
              <button key={opt.label} type="button" onClick={() => setAspectRatio(opt.label)} style={aspectChip(active)}>
                <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div
                    style={{
                      width: boxW,
                      height: boxH,
                      border: `1.5px solid ${active ? palette.accentStrong : palette.inkFaint}`,
                      borderRadius: 3,
                    }}
                  />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: active ? palette.accentStrong : palette.ink }}>{opt.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle}>Resolución</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(isFlux ? FLUX_RESOLUTIONS : KREA_RESOLUTIONS).map((opt) => (
                <button key={opt} type="button" onClick={() => setResolution(opt)} style={pillButton(resolution === opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Imágenes · <span style={{ color: palette.ink }}>{numImages}</span>
            </label>
            <input
              type="range"
              min={1}
              max={4}
              step={1}
              value={numImages}
              onChange={(e) => setNumImages(parseInt(e.target.value, 10))}
              style={{ width: 140, accentColor: palette.accent }}
            />
          </div>
        </div>
      </div>

      {/* Control creativo */}
      <div style={controlGroup}>
        <div style={controlGroupTitle}>Control creativo</div>

        {isFlux ? (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>
                Guide Scale · <span style={{ color: palette.ink }}>{guideScaleFlux.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.5}
                value={guideScaleFlux}
                onChange={(e) => setGuideScaleFlux(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: palette.accent }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>
                Embedded Guidance · <span style={{ color: palette.ink }}>{embeddedGuidance.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={embeddedGuidance}
                onChange={(e) => setEmbeddedGuidance(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: palette.accent }}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>
                Steps · <span style={{ color: palette.ink }}>{steps}</span>
              </label>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={steps}
                onChange={(e) => setSteps(parseInt(e.target.value, 10))}
                style={{ width: "100%", accentColor: palette.accent }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>Style Preset</label>
              <select value={stylePreset} onChange={(e) => setStylePreset(e.target.value)} style={{ ...inputBase, cursor: "pointer" }}>
                {STYLES.map((opt) => (
                  <option key={opt} value={opt} style={{ background: "#14150F" }}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Edición (inpainting) — solo Premium */}
      {isFlux && (
        <div style={controlGroup}>
          <button
            type="button"
            onClick={() => setEditingOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              marginBottom: editingOpen ? 16 : 0,
            }}
          >
            <span style={{ ...controlGroupTitle, marginBottom: 0 }}>Edición (inpainting)</span>
            <span style={{ fontSize: 12, color: palette.inkFaint }}>
              {maskFile ? "Máscara cargada" : "Opcional"} {editingOpen ? "▲" : "▼"}
            </span>
          </button>

          {editingOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button type="button" onClick={() => maskInputRef.current?.click()} style={pillButton(!!maskFile)}>
                  {maskFile ? "Cambiar máscara" : "Cargar máscara"}
                </button>
                {maskFile && (
                  <button type="button" onClick={() => setMaskFile(null)} style={{ ...pillButton(false), color: palette.danger }}>
                    Quitar
                  </button>
                )}
                <input ref={maskInputRef} type="file" accept="image/*" onChange={(e) => setMaskFile(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
              </div>

              <div>
                <label style={labelStyle}>Método</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {INPAINTING_METHODS.map((m) => (
                    <button key={m.value} type="button" onClick={() => setModelModeLabel(m.value)} style={pillButton(modelModeLabel === m.value)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Avanzado (seed) */}
      <div>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          style={{ background: "transparent", border: "none", color: palette.inkFaint, fontSize: 12, cursor: "pointer", padding: 0 }}
        >
          {advancedOpen ? "Ocultar avanzado" : "Avanzado"}
        </button>
        {advancedOpen && (
          <div style={{ marginTop: 10, maxWidth: 200 }}>
            <label style={labelStyle}>Seed</label>
            <input type="number" value={seed} onChange={(e) => setSeed(parseInt(e.target.value, 10))} style={inputBase} />
          </div>
        )}
      </div>

      {/* Generar */}
      <button
        onClick={handleSubmit}
        disabled={isButtonDisabled}
        className="pf-btn-primary"
        style={{ padding: "13px 26px", fontSize: 14.5, letterSpacing: 0.1, alignSelf: "flex-start" }}
      >
        Crear imagen
      </button>
    </div>
  );
}
