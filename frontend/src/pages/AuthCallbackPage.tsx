import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { Profile } from "../types";
import { consumePostAuthRedirect } from "../lib/postAuthRedirect";

type CallbackState =
  | { status: "waiting" }
  | { status: "redirecting"; to: string }
  | { status: "error"; message: string };

const REDIRECT_TIMEOUT_MS = 10000;

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>({ status: "waiting" });

  useEffect(() => {
    let cancelled = false;
    let resolved = false;

    const resolveDestination = async (userId: string): Promise<string> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single<Profile>();

      if (error || !data) {
        console.error("[AuthCallback] profile fetch failed:", error);
        return "/login";
      }

      const p = data;

      if (p.account_status === "deletion_pending") return "/account/restore";
      if (p.account_status === "suspended") return "/account/suspended";
      if (p.account_status === "purged") return "/login";
      if (!p.username || p.account_status === "provisional") return "/onboarding/username";
      // Preservar la intención de redirect (ej: venía de /pricing)
      return consumePostAuthRedirect() || "/studio";
    };

    const handleSignedIn = async (userId: string) => {
      if (cancelled || resolved) return;
      resolved = true;

      const to = await resolveDestination(userId);
      if (cancelled) return;
      setState({ status: "redirecting", to });
      // pequeño delay para mostrar el estado "redirigiendo"
      setTimeout(() => {
        if (!cancelled) navigate(to, { replace: true });
      }, 200);
    };

    // 1. Si ya hay sesión (por ejemplo, usuario volvió atrás), resolver directo
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || resolved) return;
      if (session?.user?.id) {
        handleSignedIn(session.user.id);
      }
    });

    // 2. Escuchar cambios de auth (SIGNED_IN después del PKCE exchange)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled || resolved) return;
        if (event === "SIGNED_IN" && session?.user?.id) {
          await handleSignedIn(session.user.id);
        }
      }
    );

    // 3. Timeout: si en 10s no pasó nada, error
    const timer = setTimeout(() => {
      if (cancelled || resolved) return;
      resolved = true;
      setState({
        status: "error",
        message:
          "No pudimos completar el inicio de sesión. Vuelve a intentarlo.",
      });
    }, REDIRECT_TIMEOUT_MS);

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--pf-bg-primary, #FFFFFF)",
        color: "var(--pf-text-primary, #0A0A0A)",
        fontFamily: "var(--pf-font-ui, system-ui)",
        padding: "40px 20px",
        textAlign: "center",
        gap: "24px",
      }}
    >
      {state.status !== "error" && (
        <>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid var(--pf-border-default, #E5E5E5)",
              borderTopColor: "var(--pf-text-primary, #0A0A0A)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <div style={{ fontSize: "0.9375rem", color: "var(--pf-text-secondary, #525252)" }}>
            {state.status === "redirecting"
              ? "Redirigiendo..."
              : "Conectando con Google..."}
          </div>
        </>
      )}

      {state.status === "error" && (
        <>
          <div style={{ fontSize: "3rem", opacity: 0.5 }}>⚠️</div>
          <div
            style={{
              fontSize: "1.0625rem",
              fontWeight: 500,
              maxWidth: "400px",
              lineHeight: 1.5,
            }}
          >
            {state.message}
          </div>
          <button
            onClick={() => navigate("/login", { replace: true })}
            style={{
              padding: "12px 28px",
              background: "var(--pf-text-primary, #0A0A0A)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "9999px",
              fontSize: "0.9375rem",
              fontWeight: 600,
              fontFamily: "var(--pf-font-ui, system-ui)",
              cursor: "pointer",
            }}
          >
            Volver al inicio de sesión
          </button>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AuthCallbackPage;
