// src/pages/HomePage.tsx
import React from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "../components/marketing/MarketingLayout";
import HeroMediaWall from "../components/marketing/HeroMediaWall";
import { useAuth } from "../hooks/useAuth";

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
  const { session } = useAuth();

  return (
    <MarketingLayout>
      {/* ============ HERO ============ */}
      <HeroMediaWall>
        <div>

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
            Tu estación creativa de IA
            <br />
            para imagen, video y audio
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
            Imagen, video y audio en un mismo lugar. Elige tu modelo, enciende
            tu estación y crea sin créditos por generación — con workflows ya
            preparados, listos para usar.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <Link
              to={session ? "/studio" : "/auth"}
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
              {session ? "Ir al Studio" : "Empezar gratis"}
            </Link>
            <Link
              to="/what-is-pathfinder"
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
              Qué es Pathfinder
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <Link
              to="/pricing"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "9999px",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "rgba(255,255,255,0.9)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Ver planes
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
            Sin tarjeta · Sin créditos por generación · Registro en 20 segundos con Google
          </p>
        </div>
      </HeroMediaWall>

      {/* ============ FEATURES ============ */}
      <Section bg="#000000">
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: "12px",
              color: "#FFFFFF",
            }}
          >
            Todo lo que necesitas para crear
          </h2>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.65)",
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            Modelos curados, workflows listos y una estación que responde solo a ti.
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
              title: "Estudio completo",
              body: "Seis modelos curados para imagen, video y audio. Krea 2 Turbo, Flux 2 Klein 4B, LTX 2.3, LTX 2.5 MSR, Wan 2.1 Dual y TTS Dual.",
            },
            {
              icon: <IconVideo />,
              title: "Workers duales",
              body: "Cambia entre tareas sin reiniciar la estación. Wan i2v + t2v en un mismo notebook. OmniVoice + Index TTS en otro.",
            },
            {
              icon: <IconSparkles />,
              title: "Sin créditos por generación",
              body: "Dentro de tu cuota mensual, generas lo que quieras. Sin tokens, sin unidades, sin sorpresas al final del mes.",
            },
            {
              icon: <IconZap />,
              title: "Tu propia estación",
              body: "Enciendes tu cómputo cuando lo necesitas y lo apagas cuando terminas. Dedicado solo para ti durante tu sesión.",
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                background: "rgba(139, 92, 246, 0.04)",
                border: "1px solid rgba(139, 92, 246, 0.15)",
                borderRadius: "16px",
                padding: "28px",
                transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(139, 92, 246, 0.15)";
                e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.15)";
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(34, 211, 238, 0.08)",
                  border: "1px solid rgba(34, 211, 238, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#67E8F9",
                  marginBottom: "16px",
                  boxShadow: "0 0 20px -8px rgba(34, 211, 238, 0.5)",
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
                  color: "#FFFFFF",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.875rem",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.6)",
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
      <Section bg="#000000">
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: "12px",
              color: "#FFFFFF",
            }}
          >
            Así de simple
          </h2>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.65)",
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            De la idea al resultado en cuatro pasos. La primera vez incluye preparar tu estación; después es directo.
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
            { n: "01", title: "Crea tu cuenta", body: "Regístrate con Google en 20 segundos. Sin formularios largos." },
            { n: "02", title: "Elige tu modelo", body: "Imagen, video o audio. Seis modelos curados, cada uno con su workflow listo." },
            { n: "03", title: "Enciende tu estación", body: "Descarga el workflow, actívalo en tu cómputo y conecta. La primera vez tarda unos minutos; después, cada sesión arranca más rápido." },
            { n: "04", title: "Crea y descarga", body: "Genera todo lo que quieras dentro de tu cuota. Descarga tus resultados desde Mis Creaciones." },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "left" }}>
              <div
                style={{
                  fontFamily: "var(--pf-font-display, system-ui)",
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#67E8F9",
                  letterSpacing: "-0.04em",
                  marginBottom: "12px",
                  textShadow: "0 0 24px rgba(34, 211, 238, 0.45)",
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
                  color: "#FFFFFF",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.875rem",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.6)",
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
          background: "#0A0A0A",
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
            Empieza gratis hoy
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
            Plan Free con 3 modelos, sin tarjeta y sin fecha de vencimiento. Cuando quieras el Estudio completo, Creator o Founder están a un clic.
          </p>
          <Link
            to="/auth"
            style={{
              textDecoration: "none",
              display: "inline-block",
              padding: "16px 40px",
              background: "#FFFFFF",
              color: "#0A0A0A",
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
