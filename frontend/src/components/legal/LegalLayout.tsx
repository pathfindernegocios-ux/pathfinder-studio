// src/components/legal/LegalLayout.tsx
import React from "react";
import { Link } from "react-router-dom";

interface LegalLayoutProps {
  title: string;
  version: string;
  lastUpdate: string;
  children: React.ReactNode;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  version,
  lastUpdate,
  children,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        background: "var(--pf-bg-primary, #FFFFFF)",
      }}
    >
      {/* Header sticky */}
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--pf-border-subtle, #F4F4F5)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <Link
            to="/auth"
            style={{
              textDecoration: "none",
              color: "var(--pf-text-secondary, #525252)",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.875rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Volver
          </Link>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--pf-text-muted, #A1A1AA)",
              fontFamily: "var(--pf-font-ui, system-ui)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {version} · {lastUpdate}
          </span>
        </div>
      </header>

      {/* Contenido */}
      <main
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--pf-font-display, system-ui)",
            fontSize: "2.25rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--pf-text-primary, #0A0A0A)",
            margin: 0,
            marginBottom: "32px",
          }}
        >
          {title}
        </h1>

        <div className="pf-legal-body">{children}</div>
      </main>

      {/* Estilos del contenido */}
      <style>{`
        .pf-legal-body {
          font-family: var(--pf-font-ui, system-ui);
          font-size: 1rem;
          line-height: 1.7;
          color: var(--pf-text-secondary, #525252);
        }
        .pf-legal-body h2 {
          font-family: var(--pf-font-display, system-ui);
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--pf-text-primary, #0A0A0A);
          margin: 40px 0 16px 0;
          scroll-margin-top: 80px;
        }
        .pf-legal-body h2:first-child {
          margin-top: 0;
        }
        .pf-legal-body h3 {
          font-family: var(--pf-font-display, system-ui);
          font-size: 1.0625rem;
          font-weight: 600;
          color: var(--pf-text-primary, #0A0A0A);
          margin: 24px 0 8px 0;
        }
        .pf-legal-body p {
          margin: 0 0 16px 0;
        }
        .pf-legal-body ul {
          margin: 0 0 16px 0;
          padding-left: 20px;
        }
        .pf-legal-body li {
          margin-bottom: 6px;
        }
        .pf-legal-body strong {
          color: var(--pf-text-primary, #0A0A0A);
          font-weight: 600;
        }
        .pf-legal-body a {
          color: var(--pf-text-primary, #0A0A0A);
          text-decoration: underline;
        }
        .pf-legal-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 0.875rem;
        }
        .pf-legal-body th,
        .pf-legal-body td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid var(--pf-border-subtle, #F4F4F5);
        }
        .pf-legal-body th {
          font-weight: 600;
          color: var(--pf-text-primary, #0A0A0A);
          background: var(--pf-bg-secondary, #FAFAFA);
        }
      `}</style>
    </div>
  );
};

export default LegalLayout;
