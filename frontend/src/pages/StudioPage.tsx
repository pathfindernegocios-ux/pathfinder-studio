import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import type { Status, AspectOption } from "../types";
import {
  durationSeconds,
  durationLabel,
  durationFrames,
  computeDims,
  formatHMS,
} from "../lib/helpers";
import {
  fontUI,
  palette,
  inputBase,
  labelStyle,
  pillButton,
} from "../styles/tokens";
import { useGeneration } from "../hooks/useGeneration";
import { useCreations } from "../hooks/useCreations";
import { FrameChip } from "../components/FrameChip";
import { AudioChip } from "../components/AudioChip";
import { GenerationProgress } from "../components/GenerationProgress";
import { GenerationResult } from "../components/GenerationResult";

const DURATION_OPTIONS = [
  "2 Seconds (49 frames)",
  "3 Seconds (73 frames)",
  "5 Seconds (121 frames)",
  "8 Seconds (193 frames)",
  "10 Seconds (241 frames)",
  "15 Seconds (361 frames)",
  "20 Seconds (481 frames)",
  "25 Seconds (601 frames)",
  "30 Seconds (721 frames)",
];

const ENGINE_LABEL = "LTX-2.3";
const RESOLUTION_OPTIONS = ["1080p", "720p", "540p", "480p"];

const ASPECT_RATIO_OPTIONS: AspectOption[] = [
  { label: "16:9 Landscape", short: "16:9", ratio: 16 / 9 },
  { label: "4:3 Standard", short: "4:3", ratio: 4 / 3 },
  { label: "1:1 Square", short: "1:1", ratio: 1 },
  { label: "3:4 Portrait", short: "3:4", ratio: 3 / 4 },
  { label: "9:16 Portrait", short: "9:16", ratio: 9 / 16 },
];

interface StudioPageProps {
  profile: { station_id: string | null } | null;
  gradioUrl: string | null;
  status: Status;
  getClient: () => Promise<any>;
}

export function StudioPage({ profile, gradioUrl, status, getClient }: StudioPageProps) {
  void profile;
  const [imageStartFile, setImageStartFile] = useState<File | null>(null);
  const [imageStartPreview, setImageStartPreview] = useState<string | null>(null);
  const [imageEndFile, setImageEndFile] = useState<File | null>(null);
  const [imageEndPreview, setImageEndPreview] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState<string>("");
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  const [prompt, setPrompt] = useState<string>("");
  const [seed, setSeed] = useState<number>(-1);
  const [duration, setDuration] = useState<string>("5 Seconds (121 frames)");
  const [resolution, setResolution] = useState<string>("720p");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9 Landscape");
  const [guideScale, setGuideScale] = useState<number>(4.0);
  const [matchAudioDur, setMatchAudioDur] = useState<boolean>(false);

  const [paramsOpen, setParamsOpen] = useState<boolean>(false);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [logsOpen, setLogsOpen] = useState<boolean>(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const endFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const {
    videoSrc,
    setVideoSrc,
    videoRatio,
    setVideoRatio,
    statusMsg,
    errorMsg,
    setErrorMsg,
    isLoading,
    generationInfo,
    logs,
    isCancelling,
    handleGenerate,
    handleCancel,
    progressFrac,
    liveElapsedSec,
    remainingSec,
    completedDurationSec,
    backendError,
    canCancel,
  } = useGeneration({
    getClient,
    gradioUrl,
    status,
    imageStartFile,
    imageEndFile,
    audioFile,
    prompt,
    seed,
    duration,
    resolution,
    aspectRatio,
    guideScale,
    matchAudioDur,
  });

  const { isSaving, saveError, saveCreation } = useCreations();

  useEffect(() => {
    if (logsOpen && diagnosticsOpen) {
      logsEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [logs, logsOpen, diagnosticsOpen]);

  useEffect(() => {
    if (isLoading) setParamsOpen(false);
  }, [isLoading]);

  const handleStartFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageStartFile(file);
    setVideoSrc(null);
    setErrorMsg(null);
    setImageStartPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleEndFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageEndFile(file);
    setImageEndPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleAudioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAudioFile(file);
    setAudioName(file ? file.name : "");
    setAudioPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearStartFile = () => {
    setImageStartFile(null);
    setImageStartPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearEndFile = () => {
    setImageEndFile(null);
    setImageEndPreview(null);
    if (endFileInputRef.current) endFileInputRef.current.value = "";
  };

  const clearAudioFile = () => {
    setAudioFile(null);
    setAudioName("");
    setAudioPreview(null);
    setMatchAudioDur(false);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const handleAudioTrimmed = (file: File) => {
    setAudioFile(file);
    setAudioName(file.name);
    setAudioPreview(URL.createObjectURL(file));
  };

  const handleSaveCreation = async () => {
    if (!videoSrc) return;
    await saveCreation({
      tempUrl: videoSrc,
      prompt,
      seed,
      duration,
      resolution,
      aspectRatio,
      guideScale,
      matchAudioDur,
    });
  };

  const isButtonDisabled =
    status !== "READY" || isLoading || !imageStartFile || !prompt.trim() || !gradioUrl;

  const statusLabel: Record<Status, string> = {
    STARTING: "Preparando Pathfinder",
    READY: "Lista para crear",
    BUSY: "Creando",
    ERROR: "No se pudo completar la creación",
    UNKNOWN: "Conexión no disponible",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
      {!gradioUrl && (
        <div style={{ marginBottom: 20, color: palette.inkFaint, fontSize: 13 }}>
          Buscando tu estación Pathfinder...
        </div>
      )}

      {(errorMsg || backendError) && (
        <p style={{ color: palette.danger, fontSize: 13, marginBottom: 14 }}>{errorMsg || backendError}</p>
      )}
      {statusMsg && !errorMsg && !backendError && !isLoading && !videoSrc && (
        <p style={{ color: palette.inkMuted, fontSize: 13, marginBottom: 14 }}>{statusMsg}</p>
      )}

      {isLoading ? (
        <GenerationProgress
          stage={generationInfo?.stage}
          progress={generationInfo?.progress ?? null}
          progressFrac={progressFrac}
          liveElapsedSec={liveElapsedSec}
          remainingSec={remainingSec}
          canCancel={canCancel}
          isCancelling={isCancelling}
          onCancel={handleCancel}
          engineLabel={ENGINE_LABEL}
        />
      ) : videoSrc ? (
        <GenerationResult
          videoSrc={videoSrc}
          videoRatio={videoRatio}
          onVideoRatioChange={setVideoRatio}
          selectedAspect={ASPECT_RATIO_OPTIONS.find((o) => o.label === aspectRatio)}
          duration={duration}
          completedDurationSec={completedDurationSec}
          onCreateAnother={() => setVideoSrc(null)}
          engineLabel={ENGINE_LABEL}
          onSave={handleSaveCreation}
          isSaving={isSaving}
          saveError={saveError}
          onDiscard={() => setVideoSrc(null)}
        />
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.014) 0%, rgba(255,255,255,0.004) 100%)",
            border: `1px solid rgba(255,255,255,0.03)`,
            borderRadius: 28,
            padding: "38px 40px 26px",
          }}
        >
          <textarea
            placeholder="Una mujer entra a un estudio y dice “hola”. Se escucha el ambiente del estudio."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            style={{
              ...inputBase,
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 21,
              lineHeight: 1.55,
              resize: "none",
              minHeight: 140,
              flex: 1,
            }}
          />

          <div style={{ fontSize: 11, color: palette.inkFaint, opacity: 0.75, marginBottom: 18 }}>
            Guía opcional · [VISUAL] [SPEECH] [SOUND]
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginBottom: 22 }}>
            <FrameChip
              inputId="start-frame-input"
              inputRef={fileInputRef}
              onChange={handleStartFileChange}
              preview={imageStartPreview}
              label="Imagen de inicio"
              sublabel="Start Frame"
              emphasized
              onOpen={() => imageStartPreview && window.open(imageStartPreview, "_blank")}
              onClear={clearStartFile}
            />
            <FrameChip
              inputId="end-frame-input"
              inputRef={endFileInputRef}
              onChange={handleEndFileChange}
              preview={imageEndPreview}
              label="Imagen final"
              sublabel="End Frame · opcional"
              onOpen={() => imageEndPreview && window.open(imageEndPreview, "_blank")}
              onClear={clearEndFile}
            />

            <div style={{ width: 1, height: 40, background: palette.border, margin: "0 2px" }} />

            {audioName && audioPreview ? (
              <AudioChip
                audioName={audioName}
                audioPreview={audioPreview}
                matchAudioDur={matchAudioDur}
                onToggleMatchDur={setMatchAudioDur}
                onClear={clearAudioFile}
                onTrimmed={handleAudioTrimmed}
              />
            ) : (
              <label
                htmlFor="audio-input"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: `1px dashed ${palette.border}`,
                  color: palette.inkFaint,
                  fontSize: 12,
                  cursor: "pointer",
                  marginTop: 4,
                }}
              >
                <span>＋</span> Audio
              </label>
            )}
            <input
              id="audio-input"
              type="file"
              accept="audio/*"
              ref={audioInputRef}
              onChange={handleAudioChange}
              style={{ display: "none" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              paddingTop: 18,
              borderTop: `1px solid ${palette.border}`,
            }}
          >
            <button
              onClick={() => setParamsOpen((v) => !v)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: fontUI,
                color: palette.inkMuted,
                fontSize: 13,
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>
                {ASPECT_RATIO_OPTIONS.find((o) => o.label === aspectRatio)?.short ?? aspectRatio} · {resolution} · {durationSeconds(duration)} s
              </span>
              <span style={{ color: palette.accentStrong, textDecoration: "underline", textUnderlineOffset: 3 }}>
                {paramsOpen ? "Cerrar" : "Configuración"}
              </span>
            </button>

            <button
              onClick={handleGenerate}
              disabled={isButtonDisabled}
              className="pf-btn-primary"
              style={{ padding: "13px 26px", fontSize: 14.5, letterSpacing: 0.1 }}
            >
              Crear video
            </button>
          </div>

          {paramsOpen && (
            <div style={{ paddingTop: 22, marginTop: 4 }}>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Formato</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {ASPECT_RATIO_OPTIONS.map((opt) => {
                    const dims = computeDims(resolution, opt.ratio);
                    const active = aspectRatio === opt.label;
                    const maxBox = 28;
                    const boxW = opt.ratio >= 1 ? maxBox : maxBox * opt.ratio;
                    const boxH = opt.ratio >= 1 ? maxBox / opt.ratio : maxBox;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setAspectRatio(opt.label)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          padding: "12px 14px",
                          borderRadius: 14,
                          cursor: "pointer",
                          fontFamily: fontUI,
                          border: `1px solid ${active ? palette.accent : palette.border}`,
                          background: active ? palette.accentDim : palette.surfaceSoft,
                          minWidth: 84,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div
                            style={{
                              width: boxW,
                              height: boxH,
                              border: `1.5px solid ${active ? palette.accentStrong : palette.inkFaint}`,
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: active ? palette.accentStrong : palette.ink }}>
                          {opt.short}
                        </span>
                        <span style={{ fontSize: 10, color: palette.inkFaint }}>
                          {dims.width}×{dims.height}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Resolución</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {RESOLUTION_OPTIONS.map((opt) => (
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

              <div style={{ marginBottom: 6 }}>
                <label style={labelStyle}>Duración</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  style={{ ...inputBase, cursor: "pointer", maxWidth: 260 }}
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} style={{ background: "#14150F" }}>
                      {durationLabel(opt)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${palette.border}` }}>
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((v) => !v)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: palette.inkFaint,
                    fontSize: 12.5,
                    fontFamily: fontUI,
                    padding: 0,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  {advancedOpen ? "Ocultar avanzado" : "Avanzado"}
                </button>

                {advancedOpen && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                      <div>
                        <label style={labelStyle}>Seed</label>
                        <input
                          type="number"
                          value={seed}
                          onChange={(e) => setSeed(parseInt(e.target.value, 10))}
                          style={inputBase}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>
                        Prompt influence · <span style={{ color: palette.ink }}>{guideScale.toFixed(1)}</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={8}
                        step={0.5}
                        value={guideScale}
                        onChange={(e) => setGuideScale(parseFloat(e.target.value))}
                        style={{ width: "100%", accentColor: palette.accent }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <button
          onClick={() => setLogsOpen((v) => !v)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: fontUI,
            fontSize: 12.5,
            color: palette.inkFaint,
            padding: 0,
          }}
        >
          {logsOpen ? "Ocultar detalles de generación" : "Detalles de generación"}
        </button>
        {logsOpen && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12.5, color: palette.inkFaint, lineHeight: 1.9, marginBottom: 8 }}>
              {(() => {
                const aspectOpt = ASPECT_RATIO_OPTIONS.find((o) => o.label === aspectRatio);
                const dims = computeDims(resolution, aspectOpt?.ratio ?? 16 / 9);
                const frames = durationFrames(duration);
                return (
                  <>
                    <div>Modelo · {ENGINE_LABEL}</div>
                    <div>Estado · {statusLabel[status]}</div>
                    {generationInfo?.stage && <div>Etapa · {generationInfo.stage}</div>}
                    <div>
                      Formato · {aspectOpt?.short ?? aspectRatio} · {resolution} · {dims.width}×{dims.height}
                    </div>
                    <div>
                      Duración objetivo · {durationLabel(duration)}
                      {frames && ` · ${frames} frames`}
                    </div>
                    <div>Seed · {seed === -1 ? "aleatoria (-1)" : seed}</div>
                    <div>Prompt influence · {guideScale.toFixed(1)}</div>
                    {completedDurationSec !== null && <div>Tiempo de generación · {formatHMS(completedDurationSec)}</div>}
                    {generationInfo?.id && <div>ID · {generationInfo.id}</div>}
                  </>
                );
              })()}
            </div>

            <button
              onClick={() => setDiagnosticsOpen((v) => !v)}
              style={{
                background: "transparent",
                border: "none",
                color: palette.inkFaint,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: fontUI,
                padding: 0,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {diagnosticsOpen ? "Ocultar diagnóstico" : "Ver diagnóstico"}
              {logs.length > 0 ? ` (${logs.length})` : ""}
            </button>

            {diagnosticsOpen && (
              <div
                className="pf-log-scroll"
                style={{
                  maxHeight: 220,
                  overflowY: "auto",
                  marginTop: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.25)",
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  fontSize: 11.5,
                  color: palette.inkFaint,
                }}
              >
                {logs.length === 0 ? (
                  <div style={{ color: palette.inkFaint, padding: "4px 0" }}>Sin actividad todavía.</div>
                ) : (
                  logs.map((entry) => (
                    <div key={entry.seq} style={{ padding: "2px 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      <span style={{ color: palette.inkFaint, opacity: 0.6 }}>
                        [{new Date(entry.ts * 1000).toLocaleTimeString()}]
                      </span>{" "}
                      <span style={{ color: palette.inkMuted }}>{entry.msg}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
