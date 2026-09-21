import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";

const RESTORE_WINDOW_DAYS = 30;

const AccountRestorePage: React.FC = () => {
  const { profile } = useAuth();
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    if (!profile?.deleted_at) return;
    const deletedAt = new Date(profile.deleted_at).getTime();
    const elapsedDays = (Date.now() - deletedAt) / (1000 * 60 * 60 * 24);
    const remaining = Math.max(0, Math.ceil(RESTORE_WINDOW_DAYS - elapsedDays));
    setDaysRemaining(remaining);
  }, [profile?.deleted_at]);

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc("restore_account");

      if (error) {
        setError(error.message || "No pudimos recuperar tu cuenta.");
        setIsRestoring(false);
        return;
      }

      const result = data as {
        ok: boolean;
        error?: string;
        days_since_deletion?: number;
        status?: string;
      } | null;

      if (!result?.ok) {
        if (result?.error === "window_expired") {
          setError("El plazo de recuperación de 30 días expiró. La cuenta se eliminará permanentemente.");
        } else if (result?.error === "not_pending_deletion") {
          setError(`Tu cuenta no está pendiente de eliminación (estado: ${result.status}).`);
        } else {
          setError("No pudimos recuperar tu cuenta.");
        }
        setIsRestoring(false);
        return;
      }

      window.location.href = "/studio";
    } catch (err) {
      console.error("[AccountRestore] error:", err);
      setError("Ocurrió un error. Intentá de nuevo.");
      setIsRestoring(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--pf-bg-primary, #FFFFFF)",
        padding: "40px 20px",
        fontFamily: "var(--pf-font-ui, system-ui)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px", opacity: 0.6 }}>⏳</div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            fontFamily: "var(--pf-font-display, system-ui)",
            color: "var(--pf-text-primary, #0A0A0A)",
            marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}
        >
          Tu cuenta está programada para eliminación
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--pf-text-secondary, #525252)",
            lineHeight: 1.6,
            marginBottom: "8px",
          }}
        >
          La eliminación se va a completar en {daysRemaining}{" "}
          {daysRemaining === 1 ? "día" : "días"}.
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--pf-text-muted, #A1A1AA)",
            lineHeight: 1.5,
            marginBottom: "32px",
          }}
        >
          Si querés recuperarla, podés hacerlo ahora. Después de ese plazo, la
          cuenta y sus datos se eliminarán permanentemente.
        </p>

        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              background: "#FEF2F2",
              color: "#EF4444",
              borderRadius: "8px",
              fontSize: "0.875rem",
              border: "1px solid #FEE2E2",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleRestore}
          disabled={isRestoring}
          style={{
            width: "100%",
            padding: "14px",
            background: isRestoring
              ? "#E5E5E5"
              : "var(--pf-text-primary, #0A0A0A)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: 600,
            fontFamily: "var(--pf-font-ui, system-ui)",
            cursor: isRestoring ? "not-allowed" : "pointer",
            marginBottom: "12px",
          }}
        >
          {isRestoring ? "Recuperando..." : "Recuperar cuenta"}
        </button>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "12px",
            background: "transparent",
            color: "var(--pf-text-secondary, #525252)",
            border: "1px solid var(--pf-border-default, #E5E5E5)",
            borderRadius: "8px",
            fontSize: "0.9375rem",
            fontWeight: 500,
            fontFamily: "var(--pf-font-ui, system-ui)",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default AccountRestorePage;
