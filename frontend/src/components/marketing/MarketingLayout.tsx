// src/components/marketing/MarketingLayout.tsx
// Header flotante + Footer — FUTURISMO · ISOLATED SYSTEM · VOID
import { markVoluntaryLogout } from "../../lib/voluntaryLogout";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { SignOut } from '@phosphor-icons/react/dist/csr/SignOut';
import { UserCircle } from '@phosphor-icons/react/dist/csr/UserCircle';
import { Gear } from '@phosphor-icons/react/dist/csr/Gear';
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
      {/* ═══════ HEADER — floating pill ═══════ */}
      <div
        style={{
          position: "sticky",
          top: 16,
          zIndex: 100,
          padding: "0 24px",
        }}
      >
        <header
          style={{
            maxWidth: 960,
            margin: "0 auto",
            background: "rgba(10, 10, 11, 0.65)",
            backdropFilter: "blur(20px) saturate(140%)",
            WebkitBackdropFilter: "blur(20px) saturate(140%)",
            border: "1px solid rgba(139, 92, 246, 0.18)",
            borderRadius: 9999,
            padding: "10px 14px 10px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            boxShadow: "0 8px 32px -8px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
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
            <PathfinderLogo size={28} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span
                style={{
                  fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
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
                  fontSize: "0.5rem",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.32)",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  lineHeight: 1,
                  marginTop: 4,
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
                  color: "rgba(255,255,255,0.65)",
                  fontWeight: 500,
                  padding: "8px 14px",
                  borderRadius: 9999,
                  transition: "color 150ms, background 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#F5F5F7";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {item.label}
              </Link>
            ))}

            {session ? (
              <div ref={menuRef} style={{ position: "relative", marginLeft: 6 }}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 10px 4px 4px",
                    background: menuOpen
                      ? "rgba(139, 92, 246, 0.15)"
                      : "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(139, 92, 246, 0.28)",
                    borderRadius: 9999,
                    cursor: "pointer",
                    transition: "background 150ms, border-color 150ms",
                    fontFamily: "var(--pf-font-ui)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.45)";
                  }}
                  onMouseLeave={(e) => {
                    if (!menuOpen) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.28)";
                    }
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 9999,
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
                      <img
                        src={avatarUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                  <CaretDown
                    size={11}
                    weight="bold"
                    style={{
                      color: "rgba(255,255,255,0.5)",
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
                      top: "calc(100% + 12px)",
                      right: 0,
                      minWidth: 240,
                      background: "rgba(15, 15, 18, 0.95)",
                      backdropFilter: "blur(20px) saturate(140%)",
                      WebkitBackdropFilter: "blur(20px) saturate(140%)",
                      border: "1px solid rgba(139, 92, 246, 0.20)",
                      borderRadius: 14,
                      boxShadow: "0 24px 64px -12px rgba(0,0,0,0.85), 0 0 0 1px rgba(139,92,246,0.08)",
                      padding: 8,
                      zIndex: 200,
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 12px 12px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--pf-font-ui)",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "#F5F5F7",
                        }}
                      >
                        {displayName}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--pf-font-mono)",
                          fontSize: "0.6875rem",
                          color: "rgba(255,255,255,0.4)",
                          marginTop: 2,
                        }}
                      >
                        {profile?.email}
                      </div>
                    </div>
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
                        borderRadius: 8,
                        transition: "background 150ms",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <UserCircle size={15} />
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
                        borderRadius: 8,
                        transition: "background 150ms",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Gear size={15} />
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
                        borderRadius: 8,
                        fontFamily: "var(--pf-font-ui)",
                        fontSize: "0.8125rem",
                        color: "#EB5757",
                        cursor: "pointer",
                        transition: "background 150ms",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(235,87,87,0.10)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <SignOut size={15} />
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
                    color: "rgba(255,255,255,0.65)",
                    fontWeight: 500,
                    padding: "8px 14px",
                    borderRadius: 9999,
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.8125rem",
                    transition: "color 150ms, background 150ms",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#F5F5F7";
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Ingresar
                </Link>
                <Link
                  to="/auth"
                  style={{
                    textDecoration: "none",
                    padding: "8px 18px",
                    marginLeft: 4,
                    background: "#FFFFFF",
                    color: "#0A0A0A",
                    borderRadius: 9999,
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    transition: "transform 150ms",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  Empezar gratis
                </Link>
              </>
            )}
          </nav>
        </header>
      </div>

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
