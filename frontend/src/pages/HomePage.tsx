// src/pages/HomePage.tsx
// Landing — editorial, asimétrico, media-first
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  GoogleLogo,
  Lightning,
  Stack,
  Broadcast,
} from "@phosphor-icons/react";
import { ArrowRight } from "iconoir-react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import SpaceWarp from "../components/marketing/SpaceWarp";
import { useAuth } from "../hooks/useAuth";
import { fadeInUp, staggerContainer } from "../design/motion";
import { LANDING_MEDIA } from "../config/marketing-assets";

// ═══════════════════════════════════════════════════════════════════════════
// HERO SLIDER
// ═══════════════════════════════════════════════════════════════════════════
const HERO_SLIDES = [
  {
    id: "images",
    text: "Crea imágenes con referencias",
    image: LANDING_MEDIA.hero.image,
  },
  {
    id: "videos",
    text: "Crea videos con audio",
    image: LANDING_MEDIA.hero.video,
  },
  {
    id: "voice",
    text: "Clona voces",
    image: LANDING_MEDIA.hero.voice,
  },
];

const HeroSlider: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[index];

  return (
    <div style={{
      position: "relative",
      aspectRatio: "1 / 1",
      width: "100%",
      borderRadius: 12,
      overflow: "hidden",
      background: "#141416",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={slide.id}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          style={{ position: "absolute", inset: 0 }}
        >
          <img
            src={slide.image}
            alt={slide.text}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)",
            pointerEvents: "none",
          }} />
          <div style={{ position: "absolute", left: 28, right: 28, bottom: 28 }}>
            <h3 style={{
              fontFamily: "var(--pf-font-display-alt)",
              fontSize: "clamp(1.125rem, 1.8vw, 1.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "#FFFFFF",
              margin: 0,
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}>
              {slide.text}
            </h3>
          </div>
        </motion.div>
      </AnimatePresence>

      <div style={{
        position: "absolute",
        bottom: 14,
        left: 28,
        display: "flex",
        gap: 6,
        zIndex: 2,
      }}>
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: i === index ? 22 : 6,
              height: 6,
              borderRadius: 9999,
              border: "none",
              background: i === index ? "#FFFFFF" : "rgba(255,255,255,0.35)",
              cursor: "pointer",
              padding: 0,
              transition: "all 300ms ease-out",
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CAPABILITY SHOWCASE — bloques alternados con imagen grande
// ═══════════════════════════════════════════════════════════════════════════
interface Capability {
  id: string;
  label: string;
  title: string;
  body: string;
  image: string;
  aspectRatio: string;
  reversed: boolean;
}

const CAPABILITIES: Capability[] = [
  {
    id: "image",
    label: "IMAGEN",
    title: "Crea imágenes con referencias",
    body: "Sube hasta 3 imágenes de referencia y describe qué quieres cambiar. El sujeto se mantiene consistente entre generaciones, sin perder detalle.",
    image: LANDING_MEDIA.capability.image,
    aspectRatio: "16 / 9",
    reversed: false,
  },
  {
    id: "video",
    label: "VIDEO",
    title: "Crea videos con audio",
    body: "Encadena hasta 5 escenas visualmente. El End Frame de una escena es el Start Frame de la siguiente. Audio sincronizado en cada toma.",
    image: LANDING_MEDIA.capability.video,
    aspectRatio: "16 / 9",
    reversed: true,
  },
  {
    id: "audio",
    label: "AUDIO",
    title: "Clona voces y crea diálogos",
    body: "Con 10 segundos de audio limpio produces todo tu contenido en tu propia voz. Control de emoción, 13 idiomas, diálogos entre personajes.",
    image: LANDING_MEDIA.capability.audio,
    aspectRatio: "1 / 1",
    reversed: false,
  },
];

const CapabilityShowcase: React.FC = () => (
  <section style={{ background: "#0A0A0B", padding: "120px 80px" }}>
    <div style={{ maxWidth: 1240, margin: "0 auto" }}>
      <motion.h2
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="pf-h2"
        style={{ marginBottom: 16 }}
      >
        Todo lo que necesitas
        <br />
        para crear.
      </motion.h2>

      <motion.p
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="pf-lead"
        style={{ marginBottom: 100, maxWidth: 560 }}
      >
        Tres capacidades, un solo lugar. Del prompt a la pieza final sin salir del Studio.
      </motion.p>

      <div style={{ display: "flex", flexDirection: "column", gap: 120 }}>
        {CAPABILITIES.map((cap) => (
          <motion.div
            key={cap.id}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 80,
              alignItems: "center",
              direction: cap.reversed ? "rtl" : "ltr",
            }}
            className="pf-capability-row"
          >
            {/* Imagen grande */}
            <motion.div
              variants={fadeInUp}
              style={{
                direction: "ltr",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#141416",
                aspectRatio: cap.aspectRatio,
                position: "relative",
              }}
            >
              <img
                src={cap.image}
                alt={cap.title}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {/* Overlay sutil */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.35) 100%)",
                pointerEvents: "none",
              }} />
            </motion.div>

            {/* Texto */}
            <motion.div variants={fadeInUp} style={{ direction: "ltr" }}>
              <div style={{
                fontFamily: "var(--pf-font-mono)",
                fontSize: "0.6875rem",
                fontWeight: 500,
                letterSpacing: "0.18em",
                color: "#8B5CF6",
                marginBottom: 20,
              }}>
                {cap.label}
              </div>

              <h3 style={{
                fontFamily: "var(--pf-font-display-alt)",
                fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 20,
              }}>
                {cap.title}
              </h3>

              <p style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.55)",
                margin: 0,
                marginBottom: 32,
                maxWidth: 480,
              }}>
                {cap.body}
              </p>

              <Link
                to="/academy"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "#F5F5F7",
                  textDecoration: "none",
                  transition: "gap 200ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.gap = "14px")}
                onMouseLeave={(e) => (e.currentTarget.style.gap = "8px")}
              >
                Ver modelos
                <ArrowRight width={16} height={16} strokeWidth={2} />
              </Link>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════
// PRICING TEASER — 2 mini cards
// ═══════════════════════════════════════════════════════════════════════════
const PricingTeaser: React.FC<{ session: boolean }> = ({ session }) => (
  <section style={{ background: "#0A0A0B", padding: "140px 80px" }}>
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <motion.h2 variants={fadeInUp} className="pf-h2" style={{ marginBottom: 20 }}>
          Empieza gratis.
          <br />
          Escala cuando quieras.
        </motion.h2>

        <motion.p variants={fadeInUp} className="pf-lead" style={{ marginBottom: 60, maxWidth: 560 }}>
          Plan Free con 3 modelos, sin tarjeta. Creator para el Estudio completo.
        </motion.p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }} className="pf-pricing-teaser">
          {/* Free */}
          <motion.div
            variants={fadeInUp}
            style={{
              padding: "36px 32px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              background: "#0F0F11",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div>
              <div style={{
                fontFamily: "var(--pf-font-mono)",
                fontSize: "0.6875rem",
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.4)",
                marginBottom: 12,
              }}>
                FREE
              </div>
              <div style={{
                fontFamily: "var(--pf-font-display-alt)",
                fontSize: "2.5rem",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "#F5F5F7",
                marginBottom: 16,
              }}>
                $0
              </div>
              <p style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.5)",
                margin: 0,
              }}>
                3 modelos de entrada. Studio completo. Sin fecha de vencimiento.
              </p>
            </div>
            <Link
              to={session ? "/studio" : "/auth"}
              style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 20px",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 9999,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#F5F5F7",
                textDecoration: "none",
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
              {session ? "Ir al Studio" : "Empezar gratis"}
            </Link>
          </motion.div>

          {/* Creator */}
          <motion.div
            variants={fadeInUp}
            style={{
              padding: "36px 32px",
              border: "1px solid rgba(139,92,246,0.30)",
              borderRadius: 12,
              background: "linear-gradient(180deg, rgba(139,92,246,0.06), rgba(139,92,246,0.02))",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              position: "relative",
            }}
          >
            <div>
              <div style={{
                fontFamily: "var(--pf-font-mono)",
                fontSize: "0.6875rem",
                letterSpacing: "0.18em",
                color: "#A78BFA",
                marginBottom: 12,
              }}>
                CREATOR
              </div>
              <div style={{
                fontFamily: "var(--pf-font-display-alt)",
                fontSize: "2.5rem",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "#F5F5F7",
                marginBottom: 16,
              }}>
                $249
                <span style={{
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.45)",
                  marginLeft: 8,
                }}>/mes</span>
              </div>
              <p style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.6)",
                margin: 0,
              }}>
                10 modelos. Kaggle + Colab en paralelo. Sin créditos por generación.
              </p>
            </div>
            <Link
              to="/pricing"
              style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 20px",
                background: "#8B5CF6",
                borderRadius: 9999,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#FFFFFF",
                textDecoration: "none",
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
              Ver planes
              <ArrowRight width={16} height={16} strokeWidth={2} />
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════
// HOMEPAGE
// ═══════════════════════════════════════════════════════════════════════════
const HomePage: React.FC = () => {
  const { session } = useAuth();

  return (
    <MarketingLayout>
      {/* ═══════════════ HERO — split 60/40 + Deep Field ═══════════════ */}
      <section style={{
        position: "relative",
        background: "#000000",
        padding: "140px 80px 120px",
        overflow: "hidden",
      }}>
        <SpaceWarp density={1400} intensity={1} />

        {/* Overlay de legibilidad — oscurece el lado izquierdo */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.10) 68%, rgba(0,0,0,0) 100%)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          style={{
            position: "relative",
            maxWidth: 1240,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 460px",
            gap: 80,
            alignItems: "start",
          }}
          className="pf-hero-split"
        >
          <div>
            <motion.h1
              variants={fadeInUp}
              className="pf-h1"
              style={{ marginBottom: 32 }}
            >
              Tu estación creativa de IA
              <br />
              para imagen, video y audio.
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="pf-lead"
              style={{ maxWidth: 580, marginBottom: 48 }}
            >
              Imagen, video y audio en un mismo lugar. Elige tu modelo,
              enciende tu estación y crea sin créditos por generación —
              con workflows ya preparados, listos para usar.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}
            >
              <Link
                to={session ? "/studio" : "/auth"}
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 26px",
                  background: "#FFFFFF",
                  color: "#0A0A0A",
                  borderRadius: 9999,
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  transition: "transform 150ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {session ? "Ir al Studio" : "Empezar gratis"}
                <ArrowRight width={16} height={16} strokeWidth={2} />
              </Link>
              <Link
                to="/what-is-pathfinder"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "14px 26px",
                  background: "transparent",
                  color: "#F5F5F7",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 9999,
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
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
                Qué es Pathfinder
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} style={{ marginBottom: 24 }}>
              <Link
                to="/pricing"
                style={{
                  textDecoration: "none",
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.5)",
                  transition: "color 150ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F5F7")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
              >
                Ver planes →
              </Link>
            </motion.div>

            <motion.p
              variants={fadeInUp}
              style={{
                fontFamily: "var(--pf-font-mono)",
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.35)",
                margin: 0,
              }}
            >
              Sin tarjeta · Sin créditos por generación · Registro en 20 segundos con Google
            </motion.p>
          </div>

          <motion.div variants={fadeInUp}>
            <HeroSlider />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ QUÉ ES PATHFINDER — split editorial ═══════════════ */}
      <section style={{ background: "#0A0A0B", padding: "140px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Título grande a la izquierda */}
            <motion.h2
              variants={fadeInUp}
              style={{
                fontFamily: "var(--pf-font-display-alt)",
                fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                fontWeight: 600,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 64,
                maxWidth: 720,
              }}
            >
              Pathfinder es tu estudio
              <br />
              de creación con IA.
            </motion.h2>

            {/* Quote indentada a la derecha — Satoshi italic */}
            <motion.div
              variants={fadeInUp}
              style={{
                marginLeft: "auto",
                marginRight: 0,
                maxWidth: 640,
                paddingLeft: 40,
                borderLeft: "2px solid rgba(139,92,246,0.4)",
                marginBottom: 32,
              }}
            >
              <p
                style={{
                  fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
                  fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                  fontWeight: 500,
                  fontStyle: "italic",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                  color: "#F5F5F7",
                  margin: 0,
                }}
              >
                Diez modelos curados para imagen, video y audio.
              </p>
            </motion.div>

            {/* Párrafos indentados */}
            <motion.div
              variants={fadeInUp}
              style={{
                marginLeft: "auto",
                marginRight: 0,
                maxWidth: 640,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                marginBottom: 80,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "1.0625rem",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.55)",
                  margin: 0,
                }}
              >
                Diseñados, probados y mantenidos por nosotros para
                que te concentres solo en crear.
              </p>

              <p
                style={{
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "1.0625rem",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.55)",
                  margin: 0,
                }}
              >
                Los enciendes cuando los necesitas, los apagas cuando terminas.
                Sin tarjetas gráficas, sin configurar entornos, sin sorpresas
                al final del mes.
              </p>

              <p
                style={{
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "1.0625rem",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.55)",
                  margin: 0,
                }}
              >
                Diseñamos cada workflow. Probamos cada modelo. Mantenemos
                toda la infraestructura — para que tú solo tengas que abrir
                el Studio y crear.
              </p>
            </motion.div>

            {/* Fila de datos mono */}
            <motion.div
              variants={fadeInUp}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "32px 56px",
                paddingTop: 40,
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {[
                "10 MODELOS CURADOS",
                "CERO COSTO DE HARDWARE",
                "SIN CRÉDITOS POR GENERACIÓN",
                "MULTI-RUNTIME",
              ].map((item) => (
                <span
                  key={item}
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ CAPABILITY SHOWCASE ═══════════════ */}
      <CapabilityShowcase />

      {/* ═══════════════ ASÍ FUNCIONA ═══════════════ */}
      <section style={{ background: "#0A0A0B", padding: "140px 80px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="pf-h2" style={{ marginBottom: 16 }}>
              Empezar toma menos de un minuto.
            </motion.h2>

            <motion.p variants={fadeInUp} className="pf-lead" style={{ marginBottom: 80, maxWidth: 620 }}>
              De la idea al resultado en cuatro pasos. La primera vez incluye
              preparar tu estación; después es directo.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 40,
              }}
              className="pf-steps-grid"
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 11,
                  left: 11,
                  right: 11,
                  height: 1,
                  background: "linear-gradient(90deg, rgba(139,92,246,0.5) 0%, rgba(139,92,246,0.5) 100%)",
                  zIndex: 0,
                }}
              />

              {[
                { Icon: GoogleLogo, title: "Crea tu cuenta", body: "Regístrate con Google en 20 segundos. Sin formularios largos." },
                { Icon: Stack, title: "Elige tu modelo", body: "Imagen, video o audio. Diez modelos curados, cada uno con su workflow listo." },
                { Icon: Broadcast, title: "Enciende tu estación", body: "Descarga el workflow, actívalo en tu cómputo y conecta. La primera vez tarda unos minutos; después arranca más rápido." },
                { Icon: Lightning, title: "Crea y descarga", body: "Genera todo lo que quieras dentro de tu cuota. Descarga tus resultados desde Mis Creaciones." },
              ].map((step) => (
                <div
                  key={step.title}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#0A0A0B",
                    border: "1px solid rgba(139,92,246,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 12px rgba(139,92,246,0.35)",
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8B5CF6" }} />
                  </div>
                  <step.Icon size={28} weight="regular" style={{ color: "rgba(255,255,255,0.7)" }} />
                  <h3 className="pf-h3" style={{ fontSize: "1.0625rem" }}>{step.title}</h3>
                  <p className="pf-body" style={{ fontSize: "0.875rem" }}>{step.body}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ PRICING TEASER ═══════════════ */}
      <PricingTeaser session={!!session} />

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section style={{
        position: "relative",
        background: "#000000",
        padding: "180px 80px",
        overflow: "hidden",
      }}>
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
          style={{ position: "relative", maxWidth: 780, margin: "0 auto" }}
        >
          <motion.h2
            variants={fadeInUp}
            className="pf-h2"
            style={{ fontSize: "clamp(2.25rem, 4vw, 3.25rem)", marginBottom: 24 }}
          >
            Empieza gratis hoy.
          </motion.h2>

          <motion.p variants={fadeInUp} className="pf-lead" style={{ marginBottom: 40, maxWidth: 560 }}>
            Plan Free con 3 modelos, sin tarjeta y sin fecha de vencimiento.
            Cuando quieras el Estudio completo, Creator o Founder están a un clic.
          </motion.p>

          <motion.div variants={fadeInUp}>
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
          </motion.div>
        </motion.div>
      </section>
    </MarketingLayout>
  );
};

export default HomePage;
