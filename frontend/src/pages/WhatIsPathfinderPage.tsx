// src/pages/WhatIsPathfinderPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Palette } from '@phosphor-icons/react/dist/csr/Palette';
import { Stack } from '@phosphor-icons/react/dist/csr/Stack';
import { Cloud } from '@phosphor-icons/react/dist/csr/Cloud';
import { Power } from '@phosphor-icons/react/dist/csr/Power';
import { Cpu } from '@phosphor-icons/react/dist/csr/Cpu';
import { Desktop } from '@phosphor-icons/react/dist/csr/Desktop';
import { Image as ImageIcon } from '@phosphor-icons/react/dist/csr/Image';
import { VideoCamera } from '@phosphor-icons/react/dist/csr/VideoCamera';
import { MusicNotes } from '@phosphor-icons/react/dist/csr/MusicNotes';
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning';
import { ArrowRight } from "iconoir-react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import SpaceWarp from "../components/marketing/SpaceWarp";
import { useAuth } from "../hooks/useAuth";
import { fadeInUp, staggerContainer } from "../design/motion";

// ============================================================
// SECTION
// ============================================================
const Section: React.FC<{
  children: React.ReactNode;
  padding?: string;
  borderTop?: boolean;
}> = ({ children, padding = "140px 80px", borderTop }) => (
  <section
    style={{
      padding,
      background: "#0A0A0B",
      borderTop: borderTop ? "1px solid rgba(255,255,255,0.06)" : undefined,
    }}
  >
    <div style={{ maxWidth: "1240px", margin: "0 auto" }}>{children}</div>
  </section>
);

// ============================================================
// SECTION HEADER
// ============================================================
const SectionHeader: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}> = ({ eyebrow, title, subtitle, center }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={staggerContainer}
    style={{
      marginBottom: 64,
      textAlign: center ? "center" : "left",
      maxWidth: center ? 720 : 800,
      margin: center ? "0 auto 64px" : "0 0 64px",
    }}
  >
    {eyebrow && (
      <motion.div
        variants={fadeInUp}
        style={{
          fontFamily: "var(--pf-font-mono)",
          fontSize: "0.6875rem",
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          marginBottom: 20,
        }}
      >
        {eyebrow}
      </motion.div>
    )}
    <motion.h2
      variants={fadeInUp}
      style={{
        fontFamily: "var(--pf-font-display-alt)",
        fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
        fontWeight: 600,
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
        color: "#F5F5F7",
        margin: 0,
        marginBottom: subtitle ? 16 : 0,
      }}
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p
        variants={fadeInUp}
        style={{
          fontFamily: "var(--pf-font-ui)",
          fontSize: "1rem",
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.55)",
          margin: 0,
        }}
      >
        {subtitle}
      </motion.p>
    )}
  </motion.div>
);

// ============================================================
// FEATURE CARD
// ============================================================
const FeatureCard: React.FC<{
  Icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold" }>;
  title: string;
  body: string;
}> = ({ Icon, title, body }) => (
  <motion.div
    variants={fadeInUp}
    style={{
      padding: "28px 26px",
      background: "rgba(255,255,255,0.015)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        borderRadius: 8,
        background: "rgba(139,92,246,0.10)",
        border: "1px solid rgba(139,92,246,0.25)",
        color: "#A78BFA",
        marginBottom: 20,
      }}
    >
      <Icon size={18} weight="regular" />
    </div>
    <h3
      style={{
        fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
        fontSize: "1rem",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        margin: 0,
        marginBottom: 8,
        color: "#F5F5F7",
      }}
    >
      {title}
    </h3>
    <p
      style={{
        fontFamily: "var(--pf-font-ui)",
        fontSize: "0.875rem",
        lineHeight: 1.6,
        color: "rgba(255,255,255,0.55)",
        margin: 0,
      }}
    >
      {body}
    </p>
  </motion.div>
);

// ============================================================
// CAPABILITY CARD
// ============================================================
const CapabilityCard: React.FC<{
  Icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold" }>;
  title: string;
  body: string;
  models: string;
}> = ({ Icon, title, body, models }) => (
  <motion.div
    variants={fadeInUp}
    style={{
      padding: "32px 28px",
      background: "rgba(255,255,255,0.015)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 16,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Glow sutil arriba */}
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: -60,
        right: -60,
        width: 180,
        height: 180,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)",
        filter: "blur(30px)",
        pointerEvents: "none",
      }}
    />

    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: 10,
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,238,0.08))",
          border: "1px solid rgba(139,92,246,0.28)",
          color: "#A78BFA",
          marginBottom: 24,
        }}
      >
        <Icon size={22} weight="regular" />
      </div>
      <h3
        style={{
          fontFamily: "var(--pf-font-display-alt)",
          fontSize: "1.5rem",
          fontWeight: 600,
          letterSpacing: "-0.025em",
          margin: 0,
          marginBottom: 12,
          color: "#F5F5F7",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "var(--pf-font-ui)",
          fontSize: "0.9375rem",
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.6)",
          margin: 0,
          marginBottom: 24,
          flex: 1,
        }}
      >
        {body}
      </p>
      <div
        style={{
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          fontFamily: "var(--pf-font-mono)",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.4)",
          lineHeight: 1.5,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>MODELOS · </span>
        {models}
      </div>
    </div>
  </motion.div>
);

// ============================================================
// COMPARE TABLE
// ============================================================
const CompareTable: React.FC<{
  rows: { label: string; a: string; b: string; c: string }[];
}> = ({ rows }) => (
  <motion.div
    variants={fadeInUp}
    style={{
      overflowX: "auto",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      background: "rgba(255,255,255,0.015)",
    }}
  >
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: "var(--pf-font-ui)",
        fontSize: "0.875rem",
        minWidth: "720px",
      }}
    >
      <thead>
        <tr>
          <th
            style={{
              width: "16%",
              padding: "18px 20px",
              textAlign: "left",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          />
          <th
            style={{
              padding: "18px 20px",
              textAlign: "left",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontWeight: 500,
              color: "rgba(255,255,255,0.4)",
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Plataformas de créditos
          </th>
          <th
            style={{
              padding: "18px 20px",
              textAlign: "left",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontWeight: 500,
              color: "rgba(255,255,255,0.4)",
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            ComfyUI o GPU alquilada
          </th>
          <th
            style={{
              padding: "18px 20px",
              textAlign: "left",
              borderBottom: "2px solid rgba(139,92,246,0.6)",
              fontWeight: 600,
              color: "#A78BFA",
              background: "rgba(139,92,246,0.05)",
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Pathfinder
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td
              style={{
                padding: "16px 20px",
                borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                fontWeight: 600,
                color: "#F5F5F7",
                fontSize: "0.8125rem",
              }}
            >
              {r.label}
            </td>
            <td
              style={{
                padding: "16px 20px",
                borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {r.a}
            </td>
            <td
              style={{
                padding: "16px 20px",
                borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {r.b}
            </td>
            <td
              style={{
                padding: "16px 20px",
                borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                color: "#F5F5F7",
                fontWeight: 500,
                background: "rgba(139,92,246,0.04)",
              }}
            >
              {r.c}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </motion.div>
);

// ============================================================
// HIGHLIGHT CARD
// ============================================================
const HighlightCard: React.FC<{
  Icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold" }>;
  title: string;
  body: string;
}> = ({ Icon, title, body }) => (
  <motion.div
    variants={fadeInUp}
    style={{
      display: "flex",
      gap: 24,
      alignItems: "flex-start",
      padding: 32,
      marginTop: 32,
      background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.04))",
      border: "1px solid rgba(139,92,246,0.25)",
      borderRadius: 16,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        borderRadius: 10,
        background: "rgba(139,92,246,0.15)",
        border: "1px solid rgba(139,92,246,0.35)",
        color: "#A78BFA",
        flexShrink: 0,
      }}
    >
      <Icon size={22} weight="regular" />
    </div>
    <div style={{ flex: 1 }}>
      <h3
        style={{
          fontFamily: "var(--pf-font-display-alt)",
          fontSize: "1.25rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: 0,
          marginBottom: 10,
          color: "#F5F5F7",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "var(--pf-font-ui)",
          fontSize: "0.9375rem",
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.6)",
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  </motion.div>
);

// ============================================================
// PAGE
// ============================================================
const WhatIsPathfinderPage: React.FC = () => {
  const { session } = useAuth();

  const tableRows = [
    { label: "Cobro", a: "Créditos por generación", b: "Pago por hora de GPU", c: "Acceso mensual fijo" },
    { label: "Cómputo", a: "Compartido", b: "Tuyo, con setup manual", c: "Dedicado durante tu sesión" },
    { label: "Tu equipo", a: "Nada especial", b: "GPU propia o alquiler", c: "Cualquier PC con internet" },
    { label: "Setup", a: "Inmediato", b: "Alto: CUDA, nodos, LoRAs", c: "Workflow listo para activar" },
    { label: "Persistencia", a: "En la plataforma", b: "Manual, en tu disco", c: "En la nube, desde cualquier dispositivo" },
  ];

  const whatYouCanDo = [
    {
      Icon: ImageIcon,
      title: "Imagen",
      body: "Genera ilustraciones desde una descripción, edita fotos con referencias, crea variaciones de un mismo concepto.",
      models: "Krea 2 Turbo · Flux 2 Klein 4B",
    },
    {
      Icon: VideoCamera,
      title: "Video",
      body: "Crea videos desde texto, anima una imagen, genera escenas con audio sincronizado y lipsync.",
      models: "LTX 2.3 · LTX 2.5 MSR · Wan 2.1 (i2v + t2v)",
    },
    {
      Icon: MusicNotes,
      title: "Audio",
      body: "Genera voces sintéticas, clona una voz desde un audio de referencia, narra textos largos.",
      models: "OmniVoice · Index TTS",
    },
  ];

  const steps = [
    { n: "01", title: "Elige tu modelo", body: "Imagen, video o audio. Cada modelo viene con su workflow ya preparado." },
    { n: "02", title: "Activa tu estación", body: "Descarga el workflow desde Pathfinder, ábrelo en Kaggle y actívalo. Kaggle es gratuito y solo necesitas una cuenta — sin pagar, sin tarjeta. Cuando esté listo, vuelves a Pathfinder Studio y generas desde ahí. La primera vez tarda unos minutos; después, cada sesión arranca más rápido." },
    { n: "03", title: "Crea y descarga", body: "Ya de vuelta en Pathfinder Studio, escribe tu prompt, ajusta los parámetros que quieras y genera. Tus resultados quedan en Mis Creaciones, listos para descargar cuando quieras." },
  ];

  return (
    <MarketingLayout>
      {/* ═══════════ HERO ═══════════ */}
      <section
        style={{
          position: "relative",
          background: "#000000",
          minHeight: "100vh",
          padding: "180px 80px 120px",
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <SpaceWarp variant="startrails" density={2000} intensity={1} centerX={0.5} centerY={0.3} />

        {/* Overlay de legibilidad */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 65% 60% at 50% 45%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 100%)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          style={{
            position: "relative",
            maxWidth: 900,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <motion.div
            variants={fadeInUp}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "rgba(139,92,246,0.10)",
              border: "1px solid rgba(139,92,246,0.28)",
              borderRadius: 9999,
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#A78BFA",
              marginBottom: 32,
            }}
          >
            Qué es Pathfinder
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-display)",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#F5F5F7",
              margin: 0,
              marginBottom: 28,
            }}
          >
            Tu estación creativa de IA
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "1.125rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.65)",
              margin: 0,
              marginBottom: 40,
              maxWidth: 640,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Una estación con workflows curados para imagen, video y audio. Eliges tu modelo, activas tu estación y creas sin créditos por generación.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to={session ? "/studio" : "/auth"}
              style={{
                textDecoration: "none",
                padding: "14px 28px",
                background: "#FFFFFF",
                color: "#0A0A0A",
                borderRadius: 9999,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "transform 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {session ? "Ir al Studio" : "Empezar gratis"}
              <ArrowRight width={16} height={16} strokeWidth={2} />
            </Link>
            <Link
              to="/pricing"
              style={{
                textDecoration: "none",
                padding: "14px 28px",
                background: "transparent",
                color: "#F5F5F7",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 9999,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                display: "inline-block",
                transition: "border-color 150ms, background 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Ver planes
            </Link>
          </motion.div>

          {/* ¿Qué es Pathfinder? — info compacta debajo de los CTAs */}
          <motion.div
            variants={fadeInUp}
            style={{
              marginTop: 72,
              maxWidth: 820,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <p
              style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.55)",
                margin: 0,
                marginBottom: 28,
              }}
            >
              Pathfinder es una plataforma para crear imágenes, videos y audio
              con inteligencia artificial. Eliges el modelo, describes lo que
              quieres y generas desde tu navegador. Cada sesión corre en una
              estación dedicada que activas cuando la necesitas, con workflows
              ya preparados y sin créditos por generación.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {[
                "Estación dedicada bajo demanda. Tu cómputo responde solo a ti mientras trabajas.",
                "Workflows listos para activar. Descargas, conectas y vuelves al Studio a crear.",
                "Sin créditos por generación. Pagas por acceso, no por cada imagen o video.",
              ].map((text, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    textAlign: "left",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  <CheckCircle
                    size={16}
                    weight="regular"
                    style={{ color: "#A78BFA", flexShrink: 0, marginTop: 3 }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--pf-font-ui)",
                      fontSize: "0.8125rem",
                      lineHeight: 1.55,
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>


      {/* ═══════════ QUÉ PUEDES HACER ═══════════ */}
      <Section borderTop>
        <SectionHeader
          eyebrow="Capacidades"
          title="¿Qué puedes hacer en Pathfinder?"
          subtitle="Tres tipos de contenido, un mismo lugar."
          center
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          {whatYouCanDo.map((c, i) => (
            <CapabilityCard key={i} Icon={c.Icon} title={c.title} body={c.body} models={c.models} />
          ))}
        </motion.div>
      </Section>

      {/* ═══════════ QUÉ SOLUCIONA ═══════════ */}
      <Section padding="160px 80px">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          style={{
            maxWidth: 780,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 800,
              height: 400,
              background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 65%)",
              filter: "blur(80px)",
              pointerEvents: "none",
            }}
          />

          <motion.h2
            variants={fadeInUp}
            style={{
              position: "relative",
              fontFamily: "var(--pf-font-display-alt)",
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: 0,
              marginBottom: 24,
              color: "#F5F5F7",
            }}
          >
            ¿Qué soluciona Pathfinder?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            style={{
              position: "relative",
              fontFamily: "var(--pf-font-ui)",
              fontSize: "1.0625rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            Crear con IA de calidad solía requerir dos caminos: pagar créditos caros en plataformas cerradas, o montar tu propio entorno técnico con una GPU costosa. Pathfinder ofrece un tercer camino: acceso a modelos curados, workflows listos y cómputo dedicado, desde cualquier computadora.
          </motion.p>
        </motion.div>
      </Section>

      {/* ═══════════ CÓMO SE COMPARA ═══════════ */}
      <Section borderTop>
        <SectionHeader
          eyebrow="Comparativa"
          title="Cómo se compara Pathfinder"
          subtitle="Tres formas de crear con IA. Tres modelos distintos."
          center
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <CompareTable rows={tableRows} />

          <HighlightCard
            Icon={Desktop}
            title="No necesitas una computadora potente"
            body="Tu estación corre sobre Kaggle, una plataforma gratuita de cómputo. Tú trabajas siempre desde Pathfinder Studio, en tu navegador. Cualquier computadora con acceso a internet funciona — sin comprar hardware, sin configurar drivers, sin pagar por cómputo."
          />

          <motion.p
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 720,
              margin: "32px auto 0",
              textAlign: "center",
            }}
          >
            Si ya usas ComfyUI, Pathfinder se siente familiar. Si vienes de plataformas de créditos, el modelo es distinto: aquí pagas por acceso, no por generación.
          </motion.p>
        </motion.div>
      </Section>

      {/* ═══════════ QUÉ INCLUYE ═══════════ */}
      <Section borderTop>
        <SectionHeader
          eyebrow="Ecosistema"
          title="Qué incluye tu estación"
          center
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <FeatureCard
            Icon={Palette}
            title="Diez modelos curados"
            body="Krea 2 Turbo, Flux 2 Klein 4B, LTX 2.3, LTX 2.5 MSR, Wan 2.1 Dual y TTS Dual. Cada uno con su workflow listo para usar."
          />
          <FeatureCard
            Icon={Stack}
            title="Workers duales"
            body="Wan i2v + t2v en un mismo workflow. OmniVoice + Index TTS en otro. Cambia entre tareas sin reiniciar la estación."
          />
          <FeatureCard
            Icon={Lightning}
            title="Sin créditos por generación"
            body="Dentro de tus horas de estación, generas lo que quieras. Sin tokens, sin unidades, sin sorpresas al final del mes."
          />
          <FeatureCard
            Icon={Cpu}
            title="Selección automática de modelo"
            body="El Studio detecta qué modelo está activo en tu estación y lo selecciona solo. Sin configuración manual."
          />
          <FeatureCard
            Icon={Cloud}
            title="Persistencia en la nube"
            body="Tus creaciones se guardan y quedan accesibles desde cualquier dispositivo, no solo desde el navegador donde generaste."
          />
          <FeatureCard
            Icon={Power}
            title="Apagado automático por inactividad"
            body="Si no generas nada durante una hora, la estación se apaga sola para no consumir tus horas."
          />
        </motion.div>
      </Section>

      {/* ═══════════ CÓMO SE USA ═══════════ */}
      <Section borderTop>
        <SectionHeader
          eyebrow="Flujo"
          title="Cómo se usa"
          subtitle="De la idea al resultado en tres pasos. La primera vez incluye preparar tu estación; después, cada sesión arranca en segundos."
          center
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 32,
          }}
        >
          {steps.map((s) => (
            <motion.div key={s.n} variants={fadeInUp}>
              <div
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  letterSpacing: "0.18em",
                  color: "#A78BFA",
                  marginBottom: 16,
                }}
              >
                {s.n}
              </div>
              <h3
                style={{
                  fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
                  fontSize: "1.0625rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: 10,
                  color: "#F5F5F7",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.55)",
                  margin: 0,
                }}
              >
                {s.body}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          style={{ textAlign: "center", marginTop: 64 }}
        >
          <Link
            to="/how-it-works"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 26px",
              background: "transparent",
              color: "#F5F5F7",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 9999,
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.875rem",
              fontWeight: 600,
              transition: "border-color 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
          >
            Ver la guía paso a paso
            <ArrowRight width={14} height={14} strokeWidth={2} />
          </Link>
        </motion.div>
      </Section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section
        style={{
          position: "relative",
          background: "#000000",
          padding: "160px 80px",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 900,
            height: 500,
            background: "radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, transparent 65%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          style={{
            position: "relative",
            maxWidth: 700,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <motion.h2
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-display-alt)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 20,
              color: "#F5F5F7",
            }}
          >
            Empieza gratis hoy
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.6)",
              marginBottom: 40,
              lineHeight: 1.6,
              maxWidth: 520,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Plan Free con 3 modelos, sin tarjeta y sin fecha de vencimiento. Cuando quieras el Estudio completo, Creator o Founder están a un clic.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link
              to={session ? "/studio" : "/auth"}
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "15px 32px",
                background: "#8B5CF6",
                color: "#FFFFFF",
                borderRadius: 9999,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                transition: "background 150ms, transform 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#7C66DD";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#8B5CF6";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {session ? "Ir al Studio" : "Empezar gratis"}
              <ArrowRight width={16} height={16} strokeWidth={2} />
            </Link>
            <Link
              to="/pricing"
              style={{
                textDecoration: "none",
                display: "inline-block",
                padding: "15px 32px",
                background: "transparent",
                color: "#F5F5F7",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 9999,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
              }}
            >
              Ver planes
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </MarketingLayout>
  );
};

export default WhatIsPathfinderPage;
