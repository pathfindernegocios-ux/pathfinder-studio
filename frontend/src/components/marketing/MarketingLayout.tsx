// src/components/marketing/MarketingLayout.tsx
// Header flotante + Footer — FUTURISMO · ISOLATED SYSTEM · VOID
import { markVoluntaryLogout } from "../../lib/voluntaryLogout";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { CaretDown, SignOut, UserCircle, Gear } from "@phosphor-icons/react";
import PathfinderLogo from "../PathfinderLogo";

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
    markVoluntaryLogout();
    await supabase.auth.signOut({ scope: "local" });
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

  const NAV = [
    { to: "/how-it-works", label: "Cómo funciona" },
    { to: "/academy", label: "Modelos" },
    { to: "/pricing", label: "Precios" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        background: "#000000",
        color: "#F5F5F7",
      }}
    >
      {/* ═══════ HEADER — floating, blur on scroll ═══════ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(0, 0, 0, 0.72)",
          backdropFilter: "blur(16px) saturate(140%)",
          WebkitBackdropFilter: "blur(16px) saturate(140%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <PathfinderLogo size={32} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontFamily: "var(--pf-font-display)",
                  fontSize: "1.0625rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "#F5F5F7",
                  lineHeight: 1,
                }}
              >
                Pathfinder
              </span>
              <span
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.5625rem",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.32)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                STUDIO
              </span>
            </div>
          </Link>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.8125rem",
            }}
            className="pf-nav-desktop"
          >
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  textDecoration: "none",
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 500,
                  padding: "8px 12px",
                  borderRadius: 6,
                  transition: "color 150ms, background 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#F5F5F7";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {item.label}
              </Link>
            ))}

            {session ? (
              <div ref={menuRef} style={{ position: "relative", marginLeft: 8 }}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 10px 5px 5px",
                    background: menuOpen
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "background 150ms",
                    fontFamily: "var(--pf-font-ui)",
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--pf-font-mono)",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      color: "#F5F5F7",
                      maxWidth: 110,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayName}
                  </span>
                  <CaretDown
                    size={12}
                    weight="bold"
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 150ms",
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
                      minWidth: 220,
                      background: "#141418",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      boxShadow: "0 24px 64px -12px rgba(0,0,0,0.8)",
                      padding: 6,
                      zIndex: 200,
                    }}
                  >
                    <Link
                      to="/studio"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        textDecoration: "none",
                        fontFamily: "var(--pf-font-ui)",
                        fontSize: "0.8125rem",
                        color: "rgba(255,255,255,0.75)",
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <UserCircle size={16} />
                      Ir al Studio
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        textDecoration: "none",
                        fontFamily: "var(--pf-font-ui)",
                        fontSize: "0.8125rem",
                        color: "rgba(255,255,255,0.75)",
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Gear size={16} />
                      Configuración
                    </Link>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 0" }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textAlign: "left",
                        padding: "9px 12px",
                        background: "transparent",
                        border: "none",
                        borderRadius: 4,
                        fontFamily: "var(--pf-font-ui)",
                        fontSize: "0.8125rem",
                        color: "#EB5757",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(235,87,87,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <SignOut size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/auth"
                  style={{
                    textDecoration: "none",
                    color: "rgba(255,255,255,0.55)",
                    fontWeight: 500,
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.8125rem",
                  }}
                >
                  Ingresar
                </Link>
                <Link
                  to="/auth"
                  className="pf-cta-glow"
                  style={{
                    textDecoration: "none",
                    padding: "9px 18px",
                    marginLeft: 4,
                    background: "#8B5CF6",
                    color: "#FFFFFF",
                    borderRadius: 6,
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    transition: "box-shadow 200ms",
                  }}
                >
                  Empezar gratis
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ═══════ CONTENT ═══════ */}
      <main>{children}</main>

      {/* ═══════ FOOTER — módulo aislado ═══════ */}
      <footer style={{ background: "#000000", padding: "0 32px 40px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div
            className="pf-module pf-module--crosshair"
            style={{ padding: 0, position: "relative" }}
          >
            <div
              style={{
                padding: "48px 40px 32px",
                display: "grid",
                gridTemplateColumns: "2fr repeat(3, 1fr)",
                gap: 40,
              }}
              className="pf-footer-grid"
            >
              {/* Brand */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <PathfinderLogo size={28} />
                  <span
                    style={{
                      fontFamily: "var(--pf-font-display)",
                      fontSize: "1rem",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      color: "#F5F5F7",
                    }}
                  >
                    Pathfinder
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.4)",
                    lineHeight: 1.6,
                    maxWidth: 260,
                    marginBottom: 20,
                  }}
                >
                  Infraestructura profesional para crear con IA.
                </div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.625rem",
                    letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  SYS.UPTIME ● 99.9%
                </div>
              </div>

              {/* Columns */}
              {[
                {
                  title: "PRODUCT",
                  links: [
                    { label: "Empezar gratis", to: "/auth" },
                    { label: "Precios", to: "/pricing" },
                    { label: "Modelos", to: "/academy" },
                  ],
                },
                {
                  title: "RESOURCES",
                  links: [
                    { label: "Cómo funciona", to: "/how-it-works" },
                    { label: "Qué es Pathfinder", to: "/what-is-pathfinder" },
                  ],
                },
                {
                  title: "LEGAL",
                  links: [
                    { label: "Términos", to: "/legal/terms" },
                    { label: "Privacidad", to: "/legal/privacy" },
                  ],
                },
              ].map((col) => (
                <div key={col.title}>
                  <div
                    style={{
                      fontFamily: "var(--pf-font-mono)",
                      fontSize: "0.625rem",
                      fontWeight: 500,
                      letterSpacing: "0.14em",
                      color: "rgba(255,255,255,0.32)",
                      marginBottom: 14,
                    }}
                  >
                    {col.title}
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {col.links.map((l) => (
                      <li key={l.to}>
                        <Link
                          to={l.to}
                          style={{
                            textDecoration: "none",
                            color: "rgba(255,255,255,0.55)",
                            fontSize: "0.8125rem",
                            fontFamily: "var(--pf-font-ui)",
                            transition: "color 150ms",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F5F7")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "20px 40px 24px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
                fontFamily: "var(--pf-font-mono)",
                fontSize: "0.6875rem",
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              <span>© 2026 PATHFINDER.STUDIO</span>
              <span>MEX.01 · ALL SYSTEMS NOMINAL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
