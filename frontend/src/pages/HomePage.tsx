// src/pages/HomePage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Image as ImageIcon,
  VideoCamera,
  Lightning,
  Cube,
} from "@phosphor-icons/react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import HeroMediaWall from "../components/marketing/HeroMediaWall";
import { useAuth } from "../hooks/useAuth";
import { fadeInUp, staggerContainer } from "../design/motion";

// ═══════════════════════════════════════════════════════════════════════════
// SECTION — secciones internas
// ═══════════════════════════════════════════════════════════════════════════
const Section: React.FC<{
  children: React.ReactNode;
  pt?: number;
  pb?: number;
}> = ({ children, pt = 96, pb = 96 }) => (
  <section style={{ background: "#000000", padding: `${pt}px 32px ${pb}px` }}>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
  </section>
);

const HomePage: React.FC = () => {
  const { session } = useAuth();

  return (
    <MarketingLayout>
      {/* ═══════════════ HERO — MEDIA WALL ═══════════════ */}
      <HeroMediaWall>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-display)",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              margin: 0,
              marginBottom: 24,
              color: "#FFFFFF",
              textShadow: "0 2px 24px rgba(0,0,0,0.6)",
            }}
          >
            Tu estación creativa de IA
            <br />
            para imagen, video y audio
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "clamp(1rem, 1.5vw, 1.1875rem)",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.85)",
              maxWidth: 620,
              margin: "0 auto 40px",
              textShadow: "0 1px 12px rgba(0,0,0,0.5)",
            }}
          >
            Imagen, video y audio en un mismo lugar. Elige tu modelo, enciende
            tu estación y crea sin créditos por generación — con workflows ya
            preparados, listos para usar.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <Link
              to={session ? "/studio" : "/auth"}
              style={{
                textDecoration: "none",
                padding: "14px 32px",
                background: "#FFFFFF",
                color: "#0A0A0A",
                borderRadius: 6,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                fontWeight: 700,
                display: "inline-block",
                transition: "transform 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {session ? "Ir al Studio" : "Empezar gratis"}
            </Link>
            <Link
              to="/what-is-pathfinder"
              style={{
                textDecoration: "none",
                padding: "14px 32px",
                background: "rgba(255,255,255,0.10)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.32)",
                borderRadius: 6,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                display: "inline-block",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              Qué es Pathfinder
            </Link>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            style={{ marginBottom: 20 }}
          >
            <Link
              to="/pricing"
              style={{
                textDecoration: "none",
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.75)",
                transition: "color 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
            >
              Ver planes →
            </Link>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            Sin tarjeta · Sin créditos por generación · Registro en 20 segundos con Google
          </motion.p>
        </motion.div>
      </HeroMediaWall>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <Section>
        <div style={{ marginBottom: 48 }}>
          <h2 style={{
            fontFamily: "var(--pf-font-display)",
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#F5F5F7",
            margin: 0,
            marginBottom: 12,
            maxWidth: 720,
          }}>
            Todo lo que necesitas para crear
          </h2>
          <p style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.5)",
            maxWidth: 560,
            margin: 0,
          }}>
            Modelos curados, workflows listos y una estación que responde solo a ti.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 1,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          overflow: "hidden",
        }}>
          {[
            {
              Icon: ImageIcon,
              title: "Estudio completo",
              body: "Seis modelos curados para imagen, video y audio. Krea 2 Turbo, Flux 2 Klein 4B, LTX 2.3, LTX 2.5 MSR, Wan 2.1 Dual y TTS Dual.",
            },
            {
              Icon: VideoCamera,
              title: "Workers duales",
              body: "Cambia entre tareas sin reiniciar la estación. Wan i2v + t2v en un mismo workflow. OmniVoice + Index TTS en otro.",
            },
            {
              Icon: Lightning,
              title: "Sin créditos por generación",
              body: "Dentro de tu cuota mensual, generas lo que quieras. Sin tokens, sin unidades, sin sorpresas al final del mes.",
            },
            {
              Icon: Cube,
              title: "Tu propia estación",
              body: "Enciendes tu cómputo cuando lo necesitas y lo apagas cuando terminas. Dedicado solo para ti durante tu sesión.",
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                padding: "32px 28px",
                background: "#000000",
                transition: "background 200ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#000000")}
            >
              <div style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6,
                color: "#8B5CF6",
                marginBottom: 20,
              }}>
                <f.Icon size={18} weight="regular" />
              </div>
              <h3 style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 8,
              }}>
                {f.title}
              </h3>
              <p style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.5)",
                margin: 0,
              }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <Section>
        <div style={{ marginBottom: 48 }}>
          <h2 style={{
            fontFamily: "var(--pf-font-display)",
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#F5F5F7",
            margin: 0,
            marginBottom: 12,
            maxWidth: 720,
          }}>
            Así de simple
          </h2>
          <p style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.5)",
            maxWidth: 560,
            margin: 0,
          }}>
            De la idea al resultado en cuatro pasos. La primera vez incluye preparar tu estación; después es directo.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 40,
        }}>
          {[
            { n: "01", title: "Crea tu cuenta", body: "Regístrate con Google en 20 segundos. Sin formularios largos." },
            { n: "02", title: "Elige tu modelo", body: "Imagen, video o audio. Seis modelos curados, cada uno con su workflow listo." },
            { n: "03", title: "Enciende tu estación", body: "Descarga el workflow, actívalo en tu cómputo y conecta. La primera vez tarda unos minutos; después, cada sesión arranca más rápido." },
            { n: "04", title: "Crea y descarga", body: "Genera todo lo que quieras dentro de tu cuota. Descarga tus resultados desde Mis Creaciones." },
          ].map((s) => (
            <div key={s.n}>
              <div style={{
                fontFamily: "var(--pf-font-mono)",
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 16,
              }}>
                {s.n}
              </div>
              <h3 style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 8,
              }}>
                {s.title}
              </h3>
              <p style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.5)",
                margin: 0,
              }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <Section pt={64} pb={120}>
        <div style={{
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          padding: "64px 40px",
          textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: "var(--pf-font-display)",
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#F5F5F7",
            margin: 0,
            marginBottom: 16,
          }}>
            Empieza gratis hoy
          </h2>
          <p style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.55)",
            margin: 0,
            marginBottom: 32,
            maxWidth: 520,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Plan Free con 3 modelos, sin tarjeta y sin fecha de vencimiento. Cuando quieras el Estudio completo, Creator o Founder están a un clic.
          </p>
          <Link
            to="/auth"
            style={{
              textDecoration: "none",
              display: "inline-block",
              padding: "14px 32px",
              background: "#FFFFFF",
              color: "#0A0A0A",
              borderRadius: 6,
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.9375rem",
              fontWeight: 700,
              transition: "transform 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Empezar gratis
          </Link>
        </div>
      </Section>
    </MarketingLayout>
  );
};

export default HomePage;
