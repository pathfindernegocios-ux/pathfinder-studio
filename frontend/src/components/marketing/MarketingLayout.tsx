// src/components/marketing/MarketingLayout.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { ChevronDown } from "lucide-react";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    navigate("/");
  };

  const displayName =
    profile?.full_name?.split(" ")[0] ||
    profile?.username ||
    profile?.email?.split("@")[0] ||
    "Usuario";

  const avatarInitial = (
    profile?.username?.[0] ||
    profile?.full_name?.[0] ||
    profile?.email?.[0] ||
    "U"
  ).toUpperCase();

  const avatarUrl = profile?.avatar_url || null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        background: "var(--pf-bg-primary, #FFFFFF)",
        color: "var(--pf-text-primary, #0A0A0A)",
      }}
    >
      {/* Header sticky */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px) saturate(180%)",
          borderBottom: "1px solid var(--pf-border-subtle, #F4F4F5)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: "none",
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "1.125rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--pf-text-primary, #0A0A0A)",
            }}
          >
            Pathfinder
          </Link>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.875rem",
            }}
          >
            <Link
              to="/pricing"
              style={{
                textDecoration: "none",
                color: "var(--pf-text-secondary, #525252)",
                fontWeight: 500,
              }}
            >
              Precios
            </Link>
            {session ? (
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px 6px 6px",
                    background: menuOpen
                      ? "var(--pf-bg-secondary, #FAFAFA)"
                      : "transparent",
                    border: "1px solid var(--pf-border-default, #E5E5E5)",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--pf-font-ui, system-ui)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--pf-font-ui, system-ui)",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      color: "var(--pf-text-primary, #0A0A0A)",
                      maxWidth: "120px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayName}
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: "var(--pf-text-muted, #A1A1AA)",
                      transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.15s",
                      flexShrink: 0,
                    }}
                  />
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      minWidth: "200px",
                      background: "#FFFFFF",
                      border: "1px solid var(--pf-border-default, #E5E5E5)",
                      borderRadius: "12px",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                      padding: "6px",
                      zIndex: 200,
                    }}
                  >
                    <Link
                      to="/studio"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 12px",
                        textDecoration: "none",
                        fontFamily: "var(--pf-font-ui, system-ui)",
                        fontSize: "0.875rem",
                        color: "var(--pf-text-secondary, #525252)",
                        borderRadius: "8px",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--pf-bg-secondary, #FAFAFA)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      Ir al Studio
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 12px",
                        textDecoration: "none",
                        fontFamily: "var(--pf-font-ui, system-ui)",
                        fontSize: "0.875rem",
                        color: "var(--pf-text-secondary, #525252)",
                        borderRadius: "8px",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--pf-bg-secondary, #FAFAFA)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      Configuración
                    </Link>
                    <div
                      style={{
                        height: "1px",
                        background: "var(--pf-border-subtle, #F4F4F5)",
                        margin: "6px 0",
                      }}
                    />
                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        background: "transparent",
                        border: "none",
                        borderRadius: "8px",
                        fontFamily: "var(--pf-font-ui, system-ui)",
                        fontSize: "0.875rem",
                        color: "#EF4444",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(239, 68, 68, 0.08)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                style={{
                  textDecoration: "none",
                  padding: "8px 16px",
                  background: "var(--pf-text-primary, #0A0A0A)",
                  color: "#FFFFFF",
                  borderRadius: "9999px",
                  fontWeight: 600,
                }}
              >
                Iniciar sesión
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main>{children}</main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
          padding: "48px 24px 32px",
          background: "var(--pf-bg-secondary, #FAFAFA)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "32px",
            marginBottom: "40px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--pf-font-display, system-ui)",
                fontSize: "1rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: "8px",
              }}
            >
              Pathfinder
            </div>
            <div
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.8125rem",
                color: "var(--pf-text-muted, #A1A1AA)",
                lineHeight: 1.5,
              }}
            >
              Infraestructura profesional para crear con IA.
            </div>
          </div>

          <div>
            <div
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--pf-text-primary, #0A0A0A)",
                marginBottom: "12px",
              }}
            >
              Producto
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><Link to="/auth" style={{ textDecoration: "none", color: "var(--pf-text-secondary, #525252)", fontSize: "0.875rem", fontFamily: "var(--pf-font-ui, system-ui)" }}>Empezar gratis</Link></li>
              <li><Link to="/pricing" style={{ textDecoration: "none", color: "var(--pf-text-secondary, #525252)", fontSize: "0.875rem", fontFamily: "var(--pf-font-ui, system-ui)" }}>Precios</Link></li>
            </ul>
          </div>

          <div>
            <div
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--pf-text-primary, #0A0A0A)",
                marginBottom: "12px",
              }}
            >
              Empresa
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><a href="mailto:pathfinder.contacto@gmail.com" style={{ textDecoration: "none", color: "var(--pf-text-secondary, #525252)", fontSize: "0.875rem", fontFamily: "var(--pf-font-ui, system-ui)" }}>Contacto</a></li>
            </ul>
          </div>

          <div>
            <div
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--pf-text-primary, #0A0A0A)",
                marginBottom: "12px",
              }}
            >
              Legal
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><Link to="/legal/terms" style={{ textDecoration: "none", color: "var(--pf-text-secondary, #525252)", fontSize: "0.875rem", fontFamily: "var(--pf-font-ui, system-ui)" }}>Términos</Link></li>
              <li><Link to="/legal/privacy" style={{ textDecoration: "none", color: "var(--pf-text-secondary, #525252)", fontSize: "0.875rem", fontFamily: "var(--pf-font-ui, system-ui)" }}>Privacidad</Link></li>
            </ul>
          </div>
        </div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            paddingTop: "24px",
            borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.75rem",
            color: "var(--pf-text-muted, #A1A1AA)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span>© 2026 Pathfinder Studio S.A. de C.V.</span>
          <span>Hecho en México</span>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
