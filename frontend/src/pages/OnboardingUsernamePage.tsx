import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { consumePostAuthRedirect } from "../lib/postAuthRedirect";

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

function deriveBaseFromEmail(email: string | null | undefined): string {
  if (!email) return "";
  const local = email.split("@")[0] || "";
  return local
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

function validateUsername(value: string): string | null {
  if (value.length < 3) return "Mínimo 3 caracteres.";
  if (value.length > 24) return "Máximo 24 caracteres.";
  if (!USERNAME_REGEX.test(value)) {
    return "Solo se permiten letras minúsculas, números y guion bajo (_).";
  }
  if (/^[0-9]/.test(value)) return "No puede empezar con un número.";
  return null;
}

const OnboardingUsernamePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile, isProfileLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => validateUsername(username), [username]);
  const canSubmit =
    !isSubmitting && username.length > 0 && validationError === null;

  // Guard 1: sin sesión → /login
  useEffect(() => {
    if (!isProfileLoading && !session) {
      navigate("/login", { replace: true });
    }
  }, [session, isProfileLoading, navigate]);

  // Guard 2: con username ya seteado → /studio
  useEffect(() => {
    if (!isProfileLoading && profile?.username) {
      navigate("/studio", { replace: true });
    }
  }, [profile?.username, isProfileLoading, navigate]);

  // Guard 3: cuenta no activa/provisional → redirigir según estado
  useEffect(() => {
    if (!isProfileLoading && profile) {
      if (profile.account_status === "deletion_pending") {
        navigate("/account/restore", { replace: true });
      } else if (profile.account_status === "suspended") {
        navigate("/account/suspended", { replace: true });
      }
    }
  }, [profile, isProfileLoading, navigate]);

  // Fetch sugerencia al montar
  useEffect(() => {
    if (!session || isProfileLoading) return;

    const base = deriveBaseFromEmail(profile?.email ?? session.user?.email);

    let cancelled = false;

    const fetchSuggestion = async () => {
      setIsFetchingSuggestion(true);
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const token = currentSession?.access_token;
        if (!token) {
          if (!cancelled) {
            setSuggestion(base || "user");
            setUsername(base || "user");
            setIsFetchingSuggestion(false);
          }
          return;
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const res = await fetch(`${supabaseUrl}/functions/v1/suggest-username`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ base }),
        });

        if (!res.ok) {
          if (!cancelled) {
            setSuggestion(base || "user");
            setUsername(base || "user");
            setIsFetchingSuggestion(false);
          }
          return;
        }

        const data = (await res.json()) as { suggestion?: string };
        const sugg = data.suggestion || base || "user";

        if (!cancelled) {
          setSuggestion(sugg);
          setUsername(sugg);
          setIsFetchingSuggestion(false);
        }
      } catch (err) {
        console.error("[Onboarding] suggest-username failed:", err);
        if (!cancelled) {
          setSuggestion(base || "user");
          setUsername(base || "user");
          setIsFetchingSuggestion(false);
        }
      }
    };

    fetchSuggestion();

    return () => {
      cancelled = true;
    };
  }, [session, isProfileLoading, profile?.email]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || !session) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ username })
          .eq("id", session.user.id);

        if (updateError) {
          // 23505 = unique_violation
          if (updateError.code === "23505") {
            setError("Ese nombre de usuario acaba de ser tomado. Prueba con otro.");
          } else if (updateError.code === "23514") {
            setError("El formato del nombre de usuario no es válido.");
          } else {
            setError(
              updateError.message ||
                "No pudimos guardar tu nombre de usuario. Intenta de nuevo.",
            );
          }
          setIsSubmitting(false);
          return;
        }

        // Éxito: la DB ya tiene el username y los triggers corrieron.
        // Full reload porque useAuth de App.tsx mantiene el profile stale
        // (no refetchea al UPDATE). Sin reload, el guard de "/" vería
        // username=null y devolvería al usuario a /onboarding → loop.
        // Primera vez: enviar a /how-it-works.
        // Si ya tenía un redirect pendiente (ej: venía de /pricing), respetarlo.
        const pending = consumePostAuthRedirect();
        if (pending) {
          window.location.href = pending;
        } else {
          window.location.href = "/how-it-works";
        }
      } catch (err) {
        console.error("[Onboarding] update failed:", err);
        setError("Ocurrió un error inesperado. Intenta de nuevo.");
        setIsSubmitting(false);
      }
    },
    [canSubmit, session, username, navigate],
  );

  const showLoading = isProfileLoading || isFetchingSuggestion;

  const greetingName =
    profile?.full_name?.split(" ")[0] ||
    profile?.email?.split("@")[0] ||
    "hola";

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
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              fontFamily: "var(--pf-font-display, system-ui)",
              letterSpacing: "-0.03em",
              color: "var(--pf-text-primary, #0A0A0A)",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            ¡Hola, {greetingName}!
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--pf-text-secondary, #525252)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Elige tu nombre de usuario. Podrás cambiarlo después.
          </p>
        </div>

        {showLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "var(--pf-text-muted, #A1A1AA)",
              fontSize: "0.9375rem",
              padding: "40px 0",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid var(--pf-border-default, #E5E5E5)",
                borderTopColor: "var(--pf-text-primary, #0A0A0A)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <span>Preparando tu nombre de usuario...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "8px" }}>
              <label
                htmlFor="username"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--pf-text-primary, #0A0A0A)",
                  marginBottom: "8px",
                }}
              >
                Nombre de usuario
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${
                    validationError && username.length > 0
                      ? "#EF4444"
                      : "var(--pf-border-default, #E5E5E5)"
                  }`,
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "#FFFFFF",
                  transition: "border-color 0.15s",
                }}
              >
                <span
                  style={{
                    padding: "0 12px",
                    color: "var(--pf-text-muted, #A1A1AA)",
                    fontSize: "0.9375rem",
                    userSelect: "none",
                  }}
                >
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "")
                        .slice(0, 24),
                    )
                  }
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  autoFocus
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "12px 12px 12px 0",
                    border: "none",
                    outline: "none",
                    fontSize: "0.9375rem",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    color: "var(--pf-text-primary, #0A0A0A)",
                    background: "transparent",
                  }}
                />
              </div>

              {/* Helper / error de validación */}
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "0.75rem",
                  color:
                    validationError && username.length > 0
                      ? "#EF4444"
                      : "var(--pf-text-muted, #A1A1AA)",
                  minHeight: "16px",
                }}
              >
                {username.length > 0 && validationError
                  ? validationError
                  : suggestion && username === suggestion
                    ? `Sugerido: @${suggestion}`
                    : "\u00A0"}
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  background: "#FEF2F2",
                  color: "#EF4444",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  border: "1px solid #FEE2E2",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                marginTop: "24px",
                width: "100%",
                padding: "14px",
                background: !canSubmit
                  ? "var(--pf-bg-tertiary, #F5F5F5)"
                  : "var(--pf-text-primary, #0A0A0A)",
                color: !canSubmit ? "var(--pf-text-muted, #A1A1AA)" : "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 600,
                fontFamily: "var(--pf-font-ui, system-ui)",
                cursor: !canSubmit ? "not-allowed" : "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {isSubmitting ? "Guardando..." : "Continuar"}
            </button>
          </form>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default OnboardingUsernamePage;
