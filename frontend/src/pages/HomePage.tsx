// src/pages/HomePage.tsx
import React from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "../components/marketing/MarketingLayout";
import HeroMediaWall from "../components/marketing/HeroMediaWall";

// --- Icons (inline, stroke style) ---
const IconImage = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);
const IconVideo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="14" height="12" rx="3" />
    <path d="M22 8l-6 4 6 4V8z" />
  </svg>
);
const IconSparkles = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);
const IconZap = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
  </svg>
);

const Section: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg }) => (
  <section style={{ padding: "80px 24px", background: bg }}>
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>{children}</div>
  </section>
);

const HomePage: React.FC = () => {
  return (
    <MarketingLayout>
      {/* ============ HERO ============ */}
      <HeroMediaWall>
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: "9999px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#059669",
              marginBottom: "24px",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
            Beta pública ya disponible
          </div>

          <h1
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              margin: 0,
              marginBottom: "24px",
              color: "#FFFFFF",
              textShadow: "0 2px 24px rgba(0,0,0,0.5)",
            }}
          >
            Crea imágenes y videos
            <br />
            con IA de última generación
          </h1>

          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "clamp(1.0625rem, 1.5vw, 1.25rem)",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.85)",
              maxWidth: "620px",
              margin: "0 auto 40px",
            }}
          >
            Pathfinder te da acceso a los modelos de inteligencia artificial
            más avanzados en una interfaz simple, profesional y sin tarjeta de
            crédito.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <Link
              to="/auth"
              style={{
                textDecoration: "none",
                padding: "14px 32px",
                background: "#FFFFFF",
                color: "#0A0A0A",
                borderRadius: "9999px",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.9375rem",
                fontWeight: 700,
                transition: "transform 0.15s",
                display: "inline-block",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              }}
            >
              Empezar gratis
            </Link>
            <Link
              to="/pricing"
              style={{
                textDecoration: "none",
                padding: "14px 32px",
                background: "rgba(255,255,255,0.1)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: "9999px",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                display: "inline-block",
                backdropFilter: "blur(8px)",
              }}
            >
              Ver precios
            </Link>
          </div>

          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.7)",
              margin: 0,
            }}
          >
            Sin tarjeta · Sin compromiso · Registro en 20 segundos con Google
          </p>
        </div>
      </HeroMediaWall>

      {/* ============ FEATURES ============ */}
      <Section bg="var(--pf-bg-secondary, #FAFAFA)">
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: "12px",
            }}
          >
            Todo lo que necesitás para crear
          </h2>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              color: "var(--pf-text-secondary, #525252)",
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            Modelos de última generación, infraestructura profesional y una
            interfaz que no estorba.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            {
              icon: <IconImage />,
              title: "Generación de imágenes",
              body: "Krea 2 Turbo y Flux 2 Klein 4B. Dos modelos de última generación para texto-a-imagen y edición.",
            },
            {
              icon: <IconVideo />,
              title: "Video con audio",
              body: "LTX 2.3 genera videos con audio sincronizado. Sin configuración, sin curva de aprendizaje.",
            },
            {
              icon: <IconSparkles />,
              title: "Interfaz simple",
              body: "Todo en el navegador. Sin descargas, sin instalar nada, sin complicaciones técnicas.",
            },
            {
              icon: <IconZap />,
              title: "Cómputo profesional",
              body: "Infraestructura optimizada en GPUs NVIDIA T4. Rendimiento real, sin tiempos de espera absurdos.",
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--pf-border-subtle, #F4F4F5)",
                borderRadius: "16px",
                padding: "28px",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "var(--pf-bg-secondary, #FAFAFA)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--pf-text-primary, #0A0A0A)",
                  marginBottom: "16px",
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: "var(--pf-font-display, system-ui)",
                  fontSize: "1.0625rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: "8px",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.875rem",
                  lineHeight: 1.55,
                  color: "var(--pf-text-secondary, #525252)",
                  margin: 0,
                }}
              >
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============ HOW IT WORKS ============ */}
      <Section>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: "12px",
            }}
          >
            Así de simple
          </h2>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              color: "var(--pf-text-secondary, #525252)",
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            De la idea al resultado en cuatro pasos.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            { n: "01", title: "Crear tu cuenta", body: "Registrate con Google en 20 segundos. Sin formularios largos." },
            { n: "02", title: "Elegir un modelo", body: "Krea para imágenes rápidas, Flux para edición, LTX para video." },
            { n: "03", title: "Describir tu idea", body: "Escribí un prompt y ajustá parámetros si querés. O dejalo simple." },
            { n: "04", title: "Generar y descargar", body: "En segundos tenés tu resultado listo para usar donde quieras." },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "left" }}>
              <div
                style={{
                  fontFamily: "var(--pf-font-display, system-ui)",
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "var(--pf-text-muted, #A1A1AA)",
                  letterSpacing: "-0.04em",
                  marginBottom: "12px",
                }}
              >
                {s.n}
              </div>
              <h3
                style={{
                  fontFamily: "var(--pf-font-display, system-ui)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: "6px",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.875rem",
                  lineHeight: 1.55,
                  color: "var(--pf-text-secondary, #525252)",
                  margin: 0,
                }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============ FINAL CTA ============ */}
      <section
        style={{
          padding: "100px 24px",
          background: "var(--pf-text-primary, #0A0A0A)",
          color: "#FFFFFF",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: "16px",
              color: "#FFFFFF",
            }}
          >
            ¿Listo para empezar?
          </h2>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "32px",
              lineHeight: 1.5,
            }}
          >
            Pathfinder Free es gratis, no requiere tarjeta y se activa en
            segundos.
          </p>
          <Link
            to="/auth"
            style={{
              textDecoration: "none",
              display: "inline-block",
              padding: "16px 40px",
              background: "#FFFFFF",
              color: "var(--pf-text-primary, #0A0A0A)",
              borderRadius: "9999px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              fontWeight: 700,
            }}
          >
            Empezar gratis
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default HomePage;
