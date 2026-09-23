// src/components/marketing/MarketingLayout.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  const { session } = useAuth();

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
              <Link
                to="/studio"
                style={{
                  textDecoration: "none",
                  padding: "8px 16px",
                  background: "var(--pf-text-primary, #0A0A0A)",
                  color: "var(--pf-bg-elevated)",
                  borderRadius: "9999px",
                  fontWeight: 600,
                }}
              >
                Ir al Studio →
              </Link>
            ) : (
              <Link
                to="/auth"
                style={{
                  textDecoration: "none",
                  padding: "8px 16px",
                  background: "var(--pf-text-primary, #0A0A0A)",
                  color: "var(--pf-bg-elevated)",
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
