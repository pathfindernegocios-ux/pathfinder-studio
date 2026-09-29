// src/components/ConfirmDialog.tsx
//
// Cuadro de confirmación custom — reemplaza window.confirm().
// Estética Pathfinder: fondo oscuro, borde sutil, botón danger rojo.
// Se cierra con ESC o click afuera (cuando no está en loading).

import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, loading, onCancel]);

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const accent = danger
    ? { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)", color: "#F87171" }
    : { bg: "rgba(99, 102, 241, 0.12)", border: "rgba(99, 102, 241, 0.3)", color: "#A5B4FC" };

  return (
    <div
      onClick={!loading ? onCancel : undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        animation: "pf-confirm-fade 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--pf-bg-elevated, #0A0A0A)",
          border: "1px solid var(--pf-border-default, #1F1F1F)",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255,255,255,0.03) inset",
          animation: "pf-confirm-scale 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: accent.bg,
            border: `1px solid ${accent.border}`,
            color: accent.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "18px",
          }}
        >
          <AlertTriangle size={20} strokeWidth={2} />
        </div>

        <h3
          style={{
            fontFamily: "var(--pf-font-display, system-ui)",
            fontSize: "1.0625rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--pf-text-primary, #F5F5F5)",
            margin: 0,
            marginBottom: description ? "8px" : "24px",
          }}
        >
          {title}
        </h3>

        {description && (
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.875rem",
              lineHeight: 1.55,
              color: "var(--pf-text-secondary, #A1A1AA)",
              margin: 0,
              marginBottom: "24px",
            }}
          >
            {description}
          </p>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "1px solid var(--pf-border-default, #2A2A2A)",
              borderRadius: "10px",
              color: "var(--pf-text-secondary, #A1A1AA)",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.color = "var(--pf-text-primary, #F5F5F5)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--pf-text-secondary, #A1A1AA)";
            }}
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: danger ? "#EF4444" : "var(--pf-text-primary, #F5F5F5)",
              color: danger ? "#FFFFFF" : "var(--pf-bg-primary, #0A0A0A)",
              border: "none",
              borderRadius: "10px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.875rem",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.75 : 1,
              transition: "opacity 0.15s, transform 0.1s",
            }}
            onMouseDown={(e) => {
              if (!loading) e.currentTarget.style.transform = "scale(0.97)";
            }}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
