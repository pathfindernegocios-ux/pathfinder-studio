// src/pages/AccountSettingsPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useModels } from "../hooks/useModels";
import { supabase } from "../lib/supabaseClient";

type Tab = "profile" | "account" | "security";

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

function validateUsername(value: string): string | null {
  if (value.length < 3) return "Mínimo 3 caracteres.";
  if (value.length > 24) return "Máximo 24 caracteres.";
  if (!USERNAME_REGEX.test(value)) {
    return "Solo se permiten letras minúsculas, números y guion bajo (_).";
  }
  if (/^[0-9]/.test(value)) return "No puede empezar con un número.";
  return null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

// ---------------------------------------------------------------------------
// Tab Button
// ---------------------------------------------------------------------------
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: "10px 20px",
      background: active ? "var(--pf-bg-elevated)" : "transparent",
      color: active ? "var(--pf-text-primary)" : "var(--pf-text-secondary, #525252)",
      border: "none",
      borderRadius: "8px",
      fontFamily: "var(--pf-font-ui, system-ui)",
      fontSize: "0.875rem",
      fontWeight: active ? 600 : 500,
      cursor: "pointer",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
    }}
  >
    {children}
  </button>
);

// ---------------------------------------------------------------------------
// InfoRow (para la tab Cuenta)
// ---------------------------------------------------------------------------
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      padding: "14px 0",
      borderBottom: "1px solid var(--pf-border-subtle, #F4F4F5)",
    }}
  >
    <span
      style={{
        fontSize: "0.875rem",
        color: "var(--pf-text-secondary, #525252)",
        fontFamily: "var(--pf-font-ui, system-ui)",
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: "0.9375rem",
        color: "var(--pf-text-primary, #0A0A0A)",
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontWeight: 500,
      }}
    >
      {value}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// AccountSettingsPage
// ---------------------------------------------------------------------------
const AccountSettingsPage: React.FC = () => {
  const { profile, session } = useAuth();
  const { allModels, unlockedIds } = useModels();

  const [tab, setTab] = useState<Tab>("profile");

  // -- Perfil: estado
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // -- Cuenta: conteo de creaciones
  const [activeCreations, setActiveCreations] = useState<number | null>(null);

  // -- Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // -- Security: cerrar otras sesiones
  const [revoking, setRevoking] = useState(false);
  const [securityMsg, setSecurityMsg] = useState<string | null>(null);

  // Sincronizar inputs con profile
  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? "");
      setFullName(profile.full_name ?? "");
    }
  }, [profile?.id, profile?.username, profile?.full_name]);

  // Cargar conteo de creaciones activas (una vez al montar)
  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    const fetchCount = async () => {
      const { count } = await supabase
        .from("creations")
        .select("id", { count: "exact", head: true })
        .gt("expires_at", new Date().toISOString());
      if (!cancelled) setActiveCreations(count ?? 0);
    };
    fetchCount();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const usernameError = username.length > 0 ? validateUsername(username) : null;
  const usernameChanged = username !== (profile?.username ?? "");
  const fullNameChanged = fullName !== (profile?.full_name ?? "");
  const hasChanges = usernameChanged || fullNameChanged;
  const canSaveProfile =
    hasChanges &&
    !usernameError &&
    !savingProfile &&
    username.trim().length > 0;

  // -- Guardar perfil
  const handleSaveProfile = useCallback(async () => {
    if (!canSaveProfile || !session?.user?.id) return;
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const updates: { username?: string; full_name?: string } = {};
      if (usernameChanged) updates.username = username;
      if (fullNameChanged) updates.full_name = fullName.trim() || "";

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", session.user.id);

      if (error) {
        if (error.code === "23505") {
          setProfileMsg({ type: "err", text: "Ese username ya está tomado." });
        } else {
          setProfileMsg({
            type: "err",
            text: error.message || "No pudimos guardar los cambios.",
          });
        }
        setSavingProfile(false);
        return;
      }

      setProfileMsg({ type: "ok", text: "Cambios guardados." });
      setSavingProfile(false);
    } catch (err) {
      console.error("[Settings] save profile error:", err);
      setProfileMsg({ type: "err", text: "Ocurrió un error. Intentá de nuevo." });
      setSavingProfile(false);
    }
  }, [canSaveProfile, session?.user?.id, username, fullName, usernameChanged, fullNameChanged]);

  // -- Cerrar otras sesiones
  const handleRevokeOthers = useCallback(async () => {
    setRevoking(true);
    setSecurityMsg(null);
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) {
        setSecurityMsg(`Error: ${error.message}`);
      } else {
        setSecurityMsg("Se cerraron todas las demás sesiones.");
      }
    } catch (err) {
      console.error("[Settings] revoke sessions error:", err);
      setSecurityMsg("Ocurrió un error inesperado.");
    } finally {
      setRevoking(false);
    }
  }, []);

  // -- Eliminar cuenta
  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirm !== "ELIMINAR") return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const { data, error } = await supabase.rpc("soft_delete_account");

      if (error) {
        setDeleteError(error.message || "No pudimos eliminar tu cuenta.");
        setDeleting(false);
        return;
      }

      const result = data as { ok: boolean; error?: string; status?: string } | null;
      if (!result?.ok) {
        const msg =
          result?.error === "not_active"
            ? `Tu cuenta no está activa (estado: ${result.status}).`
            : "No pudimos eliminar tu cuenta.";
        setDeleteError(msg);
        setDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch (err) {
      console.error("[Settings] delete account error:", err);
      setDeleteError("Ocurrió un error inesperado.");
      setDeleting(false);
    }
  }, [deleteConfirm]);

  if (!profile) {
    return null;
  }

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "var(--pf-bg-primary, #FFFFFF)",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "48px 32px 80px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--pf-text-primary, #0A0A0A)",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Configuración
          </h1>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.9375rem",
              color: "var(--pf-text-secondary, #525252)",
              margin: 0,
            }}
          >
            Administrá tu cuenta, perfil y seguridad.
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "inline-flex",
            background: "var(--pf-bg-secondary, #FAFAFA)",
            padding: "6px",
            borderRadius: "12px",
            border: "1px solid var(--pf-border-default, #E5E5E5)",
            gap: "6px",
            marginBottom: "32px",
          }}
        >
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
            Perfil
          </TabButton>
          <TabButton active={tab === "account"} onClick={() => setTab("account")}>
            Cuenta
          </TabButton>
          <TabButton active={tab === "security"} onClick={() => setTab("security")}>
            Seguridad
          </TabButton>
        </div>

        {/* ============ TAB: PERFIL ============ */}
        {tab === "profile" && (
          <div
            style={{
              background: "var(--pf-bg-elevated)",
              border: "1px solid var(--pf-border-subtle, #F4F4F5)",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "32px",
                paddingBottom: "32px",
                borderBottom: "1px solid var(--pf-border-subtle, #F4F4F5)",
              }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid var(--pf-border-default, #E5E5E5)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "var(--pf-bg-elevated)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    fontFamily: "var(--pf-font-ui, system-ui)",
                  }}
                >
                  {(profile.email || "U")[0].toUpperCase()}
                </div>
              )}
              <div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--pf-text-primary, #0A0A0A)",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    marginBottom: "4px",
                  }}
                >
                  {profile.full_name || profile.username}
                </div>
                <div
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--pf-text-muted, #A1A1AA)",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                  }}
                >
                  Avatar gestionado por Google
                </div>
              </div>
            </div>

            {/* Email (read-only) */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--pf-text-primary, #0A0A0A)",
                  marginBottom: "8px",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={profile.email ?? ""}
                disabled
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--pf-bg-secondary, #FAFAFA)",
                  border: "1px solid var(--pf-border-default, #E5E5E5)",
                  borderRadius: "8px",
                  fontSize: "0.9375rem",
                  color: "var(--pf-text-muted, #A1A1AA)",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  cursor: "not-allowed",
                }}
              />
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "0.75rem",
                  color: "var(--pf-text-muted, #A1A1AA)",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                }}
              >
                Gestionado por Google. No se puede cambiar en esta versión.
              </div>
            </div>

            {/* Username */}
            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="settings-username"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--pf-text-primary, #0A0A0A)",
                  marginBottom: "8px",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                }}
              >
                Nombre de usuario
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${
                    usernameError
                      ? "#EF4444"
                      : "var(--pf-border-default, #E5E5E5)"
                  }`,
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "var(--pf-bg-elevated)",
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
                  id="settings-username"
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
                  disabled={savingProfile}
                  autoComplete="off"
                  spellCheck={false}
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
              {usernameError && (
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "0.75rem",
                    color: "#EF4444",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                  }}
                >
                  {usernameError}
                </div>
              )}
            </div>

            {/* Full name */}
            <div style={{ marginBottom: "32px" }}>
              <label
                htmlFor="settings-fullname"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--pf-text-primary, #0A0A0A)",
                  marginBottom: "8px",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                }}
              >
                Nombre completo
              </label>
              <input
                id="settings-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.slice(0, 80))}
                disabled={savingProfile}
                autoComplete="name"
                placeholder="Ej: Juan Pérez"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--pf-bg-elevated)",
                  border: "1px solid var(--pf-border-default, #E5E5E5)",
                  borderRadius: "8px",
                  fontSize: "0.9375rem",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  color: "var(--pf-text-primary, #0A0A0A)",
                  outline: "none",
                }}
              />
            </div>

            {/* Message */}
            {profileMsg && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  background:
                    profileMsg.type === "ok" ? "#ECFDF5" : "#FEF2F2",
                  color: profileMsg.type === "ok" ? "#059669" : "#EF4444",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  border: `1px solid ${
                    profileMsg.type === "ok" ? "#D1FAE5" : "#FEE2E2"
                  }`,
                  fontFamily: "var(--pf-font-ui, system-ui)",
                }}
              >
                {profileMsg.text}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSaveProfile}
              disabled={!canSaveProfile}
              style={{
                padding: "12px 28px",
                background: !canSaveProfile
                  ? "var(--pf-bg-tertiary, #F5F5F5)"
                  : "var(--pf-text-primary, #0A0A0A)",
                color: !canSaveProfile
                  ? "var(--pf-text-muted, #A1A1AA)"
                  : "var(--pf-bg-elevated)",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.9375rem",
                fontWeight: 600,
                fontFamily: "var(--pf-font-ui, system-ui)",
                cursor: !canSaveProfile ? "not-allowed" : "pointer",
              }}
            >
              {savingProfile ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}

        {/* ============ TAB: CUENTA ============ */}
        {tab === "account" && (
          <div>
            {/* Plan + Modelos */}
            <div
              style={{
                background: "var(--pf-bg-elevated)",
                border: "1px solid var(--pf-border-subtle, #F4F4F5)",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "var(--pf-text-primary, #0A0A0A)",
                  fontFamily: "var(--pf-font-display, system-ui)",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: "20px",
                }}
              >
                Plan y modelos
              </h2>

              <InfoRow
                label="Plan"
                value={
                  <span
                    style={{
                      padding: "4px 10px",
                      background:
                        profile.plan === "free"
                          ? "rgba(107,114,128,0.1)"
                          : "rgba(16,185,129,0.1)",
                      color:
                        profile.plan === "free" ? "var(--pf-text-muted)" : "#10B981",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {profile.plan}
                  </span>
                }
              />

              <InfoRow
                label="Modelos disponibles"
                value={
                  <span style={{ fontSize: "0.875rem" }}>
                    {unlockedIds.size} de {allModels.length}
                  </span>
                }
              />

              {/* Model cards mini */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                {allModels.map((m) => {
                  const owned = unlockedIds.has(m.id);
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: "12px",
                        background: owned
                          ? "var(--pf-bg-secondary, #FAFAFA)"
                          : "var(--pf-bg-tertiary, #F5F5F5)",
                        border: `1px solid ${
                          owned
                            ? "var(--pf-border-default, #E5E5E5)"
                            : "var(--pf-border-subtle, #F4F4F5)"
                        }`,
                        borderRadius: "10px",
                        opacity: owned ? 1 : 0.6,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "var(--pf-text-primary, #0A0A0A)",
                          fontFamily: "var(--pf-font-ui, system-ui)",
                          marginBottom: "4px",
                        }}
                      >
                        {m.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.6875rem",
                          color: owned ? "#10B981" : "var(--pf-text-muted, #A1A1AA)",
                          fontFamily: "var(--pf-font-ui, system-ui)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: 600,
                        }}
                      >
                        {owned ? "● Activo" : "○ Bloqueado"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Uso */}
            <div
              style={{
                background: "var(--pf-bg-elevated)",
                border: "1px solid var(--pf-border-subtle, #F4F4F5)",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "var(--pf-text-primary, #0A0A0A)",
                  fontFamily: "var(--pf-font-display, system-ui)",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: "20px",
                }}
              >
                Actividad
              </h2>
              <InfoRow
                label="Creaciones activas"
                value={activeCreations === null ? "…" : String(activeCreations)}
              />
              <InfoRow
                label="Miembro desde"
                value={formatDate(profile.created_at)}
              />
            </div>

            {/* Danger zone */}
            <div
              style={{
                background: "var(--pf-bg-elevated)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#EF4444",
                  fontFamily: "var(--pf-font-display, system-ui)",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: "8px",
                }}
              >
                Zona de peligro
              </h2>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--pf-text-secondary, #525252)",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  lineHeight: 1.5,
                  margin: 0,
                  marginBottom: "20px",
                }}
              >
                Una vez eliminada, tu cuenta se programará para borrado. Tenés
                30 días para recuperarla iniciando sesión.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: "12px 24px",
                  background: "rgba(239,68,68,0.1)",
                  color: "#EF4444",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  cursor: "pointer",
                }}
              >
                Eliminar cuenta
              </button>
            </div>
          </div>
        )}

        {/* ============ TAB: SEGURIDAD ============ */}
        {tab === "security" && (
          <div
            style={{
              background: "var(--pf-bg-elevated)",
              border: "1px solid var(--pf-border-subtle, #F4F4F5)",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--pf-text-primary, #0A0A0A)",
                fontFamily: "var(--pf-font-display, system-ui)",
                letterSpacing: "-0.02em",
                margin: 0,
                marginBottom: "20px",
              }}
            >
              Método de acceso
            </h2>
            <InfoRow label="Proveedor" value="Google" />
            <InfoRow label="Email" value={profile.email ?? "—"} />

            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--pf-text-primary, #0A0A0A)",
                fontFamily: "var(--pf-font-display, system-ui)",
                letterSpacing: "-0.02em",
                margin: 0,
                marginBottom: "12px",
                marginTop: "40px",
              }}
            >
              Sesiones
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--pf-text-secondary, #525252)",
                fontFamily: "var(--pf-font-ui, system-ui)",
                lineHeight: 1.5,
                margin: 0,
                marginBottom: "20px",
              }}
            >
              Si cerraste sesión en otro dispositivo y querés invalidar todas
              las demás sesiones, usá este botón. Vas a mantener la sesión
              actual activa.
            </p>

            {securityMsg && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  background: "#ECFDF5",
                  color: "#059669",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  border: "1px solid #D1FAE5",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                }}
              >
                {securityMsg}
              </div>
            )}

            <button
              onClick={handleRevokeOthers}
              disabled={revoking}
              style={{
                padding: "12px 24px",
                background: "var(--pf-text-primary, #0A0A0A)",
                color: "var(--pf-bg-elevated)",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
                fontFamily: "var(--pf-font-ui, system-ui)",
                cursor: revoking ? "not-allowed" : "pointer",
                opacity: revoking ? 0.6 : 1,
              }}
            >
              {revoking ? "Cerrando..." : "Cerrar otras sesiones"}
            </button>
          </div>
        )}
      </div>

      {/* ============ DELETE MODAL ============ */}
      {showDeleteModal && (
        <div
          onClick={() => !deleting && setShowDeleteModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
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
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--pf-text-primary, #0A0A0A)",
                fontFamily: "var(--pf-font-display, system-ui)",
                letterSpacing: "-0.02em",
                margin: 0,
                marginBottom: "12px",
              }}
            >
              ¿Eliminar tu cuenta?
            </h3>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--pf-text-secondary, #525252)",
                fontFamily: "var(--pf-font-ui, system-ui)",
                lineHeight: 1.5,
                margin: 0,
                marginBottom: "20px",
              }}
            >
              Tu cuenta se programará para eliminación. Tenés{" "}
              <strong>30 días</strong> para recuperarla iniciando sesión. Escribí{" "}
              <strong>ELIMINAR</strong> para confirmar.
            </p>

            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
              placeholder="ELIMINAR"
              disabled={deleting}
              autoFocus
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "var(--pf-bg-elevated)",
                border: "1px solid var(--pf-border-default, #E5E5E5)",
                borderRadius: "8px",
                fontSize: "0.9375rem",
                fontFamily: "var(--pf-font-ui, system-ui)",
                color: "var(--pf-text-primary, #0A0A0A)",
                outline: "none",
                marginBottom: "16px",
                letterSpacing: "0.05em",
              }}
            />

            {deleteError && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  background: "#FEF2F2",
                  color: "#EF4444",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  border: "1px solid #FEE2E2",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                }}
              >
                {deleteError}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                  setDeleteError(null);
                }}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "transparent",
                  color: "var(--pf-text-secondary, #525252)",
                  border: "1px solid var(--pf-border-default, #E5E5E5)",
                  borderRadius: "8px",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "ELIMINAR" || deleting}
                style={{
                  flex: 1,
                  padding: "12px",
                  background:
                    deleteConfirm === "ELIMINAR" && !deleting
                      ? "#EF4444"
                      : "rgba(239,68,68,0.4)",
                  color: "var(--pf-bg-elevated)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  cursor:
                    deleteConfirm === "ELIMINAR" && !deleting
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsPage;
