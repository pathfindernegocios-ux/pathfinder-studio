// src/components/AvatarPicker.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, Upload, Loader2, Check } from "lucide-react";
import {
  AVATAR_PRESETS,
  uploadAvatarFile,
  saveAvatarUrl,
} from "../lib/avatar";

type Tab = "upload" | "presets";

interface AvatarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentAvatarUrl: string | null;
  onSaved: (newUrl: string) => void;
}

const MAX_FILE_MB = 2;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const AvatarPicker: React.FC<AvatarPickerProps> = ({
  isOpen,
  onClose,
  userId,
  onSaved,
}) => {
  const [tab, setTab] = useState<Tab>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset del estado cada vez que se abre
  useEffect(() => {
    if (isOpen) {
      setTab("upload");
      setPreviewUrl(null);
      setSelectedPreset(null);
      setIsSaving(false);
      setError(null);
    }
  }, [isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, isSaving, onClose]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Formato no válido. Usá JPG, PNG o WebP.";
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return `La imagen supera los ${MAX_FILE_MB} MB.`;
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      setPreviewUrl(null);
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedPreset(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSave = useCallback(async () => {
    setError(null);

    // Caso 1: subió archivo
    if (tab === "upload" && previewUrl) {
      // Necesitamos el File, no la URL. Lo tomamos del input.
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        setError("No hay archivo seleccionado.");
        return;
      }
      setIsSaving(true);
      try {
        const url = await uploadAvatarFile(userId, file);
        await saveAvatarUrl(userId, url);
        onSaved(url);
        onClose();
      } catch (e) {
        console.error("[AvatarPicker] upload failed:", e);
        setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
        setIsSaving(false);
      }
      return;
    }

    // Caso 2: eligió preset
    if (tab === "presets" && selectedPreset) {
      setIsSaving(true);
      try {
        await saveAvatarUrl(userId, selectedPreset);
        onSaved(selectedPreset);
        onClose();
      } catch (e) {
        console.error("[AvatarPicker] preset save failed:", e);
        setError(e instanceof Error ? e.message : "No se pudo guardar el preset.");
        setIsSaving(false);
      }
      return;
    }

    setError("Elegí una imagen o un preset antes de guardar.");
  }, [tab, previewUrl, selectedPreset, userId, onSaved, onClose]);

  const canSave =
    (tab === "upload" && previewUrl !== null) ||
    (tab === "presets" && selectedPreset !== null);

  if (!isOpen) return null;

  return (
    <div
      onClick={() => !isSaving && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--pf-overlay-backdrop)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--pf-bg-elevated)",
          border: "1px solid var(--pf-border-subtle)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--pf-shadow-floating)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--pf-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--pf-text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Cambiar avatar
          </h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: "transparent",
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
              color: "var(--pf-text-secondary)",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            padding: "12px 24px 0",
            borderBottom: "1px solid var(--pf-border-subtle)",
          }}
        >
          {[
            { id: "upload" as const, label: "Subir" },
            { id: "presets" as const, label: "Predeterminados" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => !isSaving && setTab(t.id)}
              disabled={isSaving}
              style={{
                background: "transparent",
                border: "none",
                padding: "10px 14px",
                borderBottom:
                  tab === t.id
                    ? "2px solid var(--pf-text-primary)"
                    : "2px solid transparent",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.875rem",
                fontWeight: tab === t.id ? 600 : 500,
                color:
                  tab === t.id
                    ? "var(--pf-text-primary)"
                    : "var(--pf-text-muted)",
                cursor: isSaving ? "not-allowed" : "pointer",
                marginBottom: "-1px",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* TAB: UPLOAD */}
          {tab === "upload" && (
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !isSaving && fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--pf-border-default)",
                  borderRadius: "12px",
                  padding: "40px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  background: "var(--pf-bg-secondary)",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--pf-text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--pf-border-default)")
                }
              >
                <Upload size={24} style={{ color: "var(--pf-text-muted)" }} />
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "var(--pf-font-ui, system-ui)",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      color: "var(--pf-text-primary)",
                      marginBottom: "4px",
                    }}
                  >
                    Arrastra una imagen aquí
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--pf-font-ui, system-ui)",
                      fontSize: "0.8125rem",
                      color: "var(--pf-text-muted)",
                    }}
                  >
                    o haz clic para elegir un archivo
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.75rem",
                    color: "var(--pf-text-muted)",
                    marginTop: "4px",
                  }}
                >
                  JPG, PNG o WebP · Máx {MAX_FILE_MB} MB
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileInput}
                disabled={isSaving}
                style={{ display: "none" }}
              />

              {previewUrl && (
                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid var(--pf-border-default)",
                      background: "var(--pf-bg-secondary)",
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PRESETS */}
          {tab === "presets" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "10px",
              }}
            >
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => !isSaving && setSelectedPreset(preset)}
                    disabled={isSaving}
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: isSelected
                        ? "3px solid var(--pf-text-primary)"
                        : "1px solid var(--pf-border-default)",
                      background: "var(--pf-bg-secondary)",
                      cursor: isSaving ? "not-allowed" : "pointer",
                      padding: 0,
                      position: "relative",
                      transition: "all 0.15s",
                    }}
                  >
                    <img
                      src={preset}
                      alt="Preset"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FFFFFF",
                        }}
                      >
                        <Check size={20} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                fontSize: "0.875rem",
                color: "#EF4444",
                fontFamily: "var(--pf-font-ui, system-ui)",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--pf-border-subtle)",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: "var(--pf-text-secondary)",
              border: "1px solid var(--pf-border-default)",
              borderRadius: "10px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            style={{
              padding: "10px 20px",
              background: !canSave || isSaving
                ? "var(--pf-bg-tertiary)"
                : "var(--pf-text-primary)",
              color: !canSave || isSaving
                ? "var(--pf-text-muted)"
                : "var(--pf-text-inverse, #FFFFFF)",
              border: "none",
              borderRadius: "10px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: !canSave || isSaving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AvatarPicker;
