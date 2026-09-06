import { useState } from "react";
import { useGenerationContext } from "../context/GenerationContext";
import { palette, inputBase, labelStyle, pillButton } from "../styles/tokens";

const RESOLUTIONS = [
  "1024px (Standard)",
  "1536px (High)",
  "2048px (2K Ultra)",
];

const ASPECT_RATIOS = [
  "16:9 Landscape",
  "9:16 Portrait",
  "1:1 Square",
  "4:3 Standard",
  "3:4 Portrait",
];

const STYLES = ["None", "Cinematic", "Photographic", "Anime", "Cyberpunk", "Fantasy"];

export function ImageGenerationForm() {
  const { handleGenerate, isLoading } = useGenerationContext();

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [steps, setSteps] = useState(8);
  const [resolution, setResolution] = useState("1024px (Standard)");
  const [aspectRatio, setAspectRatio] = useState("1:1 Square");
  const [seed, setSeed] = useState(-1);
  const [numImages, setNumImages] = useState(1);
  const [stylePreset, setStylePreset] = useState("None");

  const isButtonDisabled = !prompt.trim() || isLoading;

  const handleSubmit = () => {
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
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Prompt */}
      <div>
        <label style={labelStyle}>Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Describe la imagen que quieres crear..."
          style={{ ...inputBase, resize: "vertical", minHeight: 100 }}
        />
      </div>

      {/* Negative Prompt */}
      <div>
        <label style={labelStyle}>Negative Prompt</label>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={2}
          placeholder="low quality, blurry, distorted..."
          style={{ ...inputBase, resize: "vertical", minHeight: 60 }}
        />
      </div>

      {/* Steps y Número de imágenes */}
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
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
        <div style={{ flex: 1 }}>
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
            style={{ width: "100%", accentColor: palette.accent }}
          />
        </div>
      </div>

      {/* Resolución */}
      <div>
        <label style={labelStyle}>Resolución</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {RESOLUTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setResolution(opt)}
              style={pillButton(resolution === opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label style={labelStyle}>Aspect Ratio</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ASPECT_RATIOS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setAspectRatio(opt)}
              style={pillButton(aspectRatio === opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Seed */}
      <div>
        <label style={labelStyle}>Seed</label>
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(parseInt(e.target.value, 10))}
          style={inputBase}
        />
      </div>

      {/* Style Preset */}
      <div>
        <label style={labelStyle}>Style Preset</label>
        <select
          value={stylePreset}
          onChange={(e) => setStylePreset(e.target.value)}
          style={{ ...inputBase, cursor: "pointer" }}
        >
          {STYLES.map((opt) => (
            <option key={opt} value={opt} style={{ background: "#14150F" }}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Botón Generar */}
      <button
        onClick={handleSubmit}
        disabled={isButtonDisabled}
        className="pf-btn-primary"
        style={{ padding: "13px 26px", fontSize: 14.5, letterSpacing: 0.1 }}
      >
        Crear imagen
      </button>
    </div>
  );
}
