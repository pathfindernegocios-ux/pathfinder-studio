// src/pages/HomePage.tsx
// Landing — editorial, asimétrico, media-first
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Image as ImageIcon,
  VideoCamera,
  MusicNotes,
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

// ═══════════════════════════════════════════════════════════════════════════
// HERO SLIDER — imagen con texto, auto-rotación cada 4s
// ═══════════════════════════════════════════════════════════════════════════
const HERO_SLIDES = [
  {
    id: "images",
    text: "Crea imágenes con referencias",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80",
  },
  {
    id: "videos",
    text: "Crea videos con audio",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80",
  },
  {
    id: "voice",
    text: "Clona voces",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&q=80",
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
          <div style={{
            position: "absolute",
            left: 28,
            right: 28,
            bottom: 28,
          }}>
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
// CARRUSEL FOTOGRÁFICO — marquee full-width
// ═══════════════════════════════════════════════════════════════════════════
const CAROUSEL_PHOTOS = [
  "1470071459604-3b5ec3a7fe05",
  "1493514789931-586cb221d7a7",
  "1506744038136-46273834b3fb",
  "1519681393784-d120267933ba",
  "1493246507139-91e8fad9978e",
  "1441974231531-c6227db76b6e",
  "1506905925346-21bda4d32df4",
  "1518791841217-8f162f1e1131",
];

const CarouselSection: React.FC = () => (
  <section style={{
    background: "#0A0A0B",
    padding: "80px 0",
    overflow: "hidden",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  }}>
    <div style={{
      display: "flex",
      gap: 20,
      animation: "pf-marquee 60s linear infinite",
      willChange: "transform",
    }}>
      {[...CAROUSEL_PHOTOS, ...CAROUSEL_PHOTOS].map((id, i) => (
        <div
          key={i}
          style={{
            flexShrink: 0,
            width: 320,
            height: 220,
            borderRadius: 8,
            overflow: "hidden",
            background: "#141416",
          }}
        >
          <img
            src={`https://images.unsplash.com/photo-${id}?w=640&q=80&auto=format&fit=crop`}
            alt=""
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: 0.85,
            }}
          />
        </div>
      ))}
    </div>
    <style>{`
      @keyframes pf-marquee {
        from { transform: translate3d(0, 0, 0); }
        to   { transform: translate3d(calc(-50% - 10px), 0, 0); }
      }
    `}</style>
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════
// HOMEPAGE
// ═══════════════════════════════════════════════════════════════════════════
const HomePage: React.FC = () => {
  const { session } = useAuth();

  return (
    <MarketingLayout>
      {/* ═══════════════ HERO — split 60/40 ═══════════════ */}
      <section style={{
        position: "relative",
        background: "#000000",
        padding: "140px 80px 120px",
        overflow: "hidden",
      }}>
        {/* Distorsión espacial — canvas con star trails */}
        <SpaceWarp density={1400} intensity={1} />

        {/* Overlay para legibilidad del texto (oscurece el lado izquierdo) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.10) 68%, rgba(0,0,0,0) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Radial violeta detrás del texto (izquierda) para elevar contraste */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "25%",
            left: "-10%",
            width: "700px",
            height: "700px",
            background: "radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)",
            filter: "blur(70px)",
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

      {/* ═══════════════ CARRUSEL FOTOGRÁFICO ═══════════════ */}
      <CarouselSection />

      {/* ═══════════════ QUÉ ES PATHFINDER ═══════════════ */}
      <section style={{ background: "#0A0A0B", padding: "140px 80px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="pf-h2" style={{ marginBottom: 32 }}>
              Pathfinder es tu estudio
              <br />
              de creación con IA.
            </motion.h2>

            <motion.p variants={fadeInUp} className="pf-lead" style={{ marginBottom: 24 }}>
              Diez modelos curados para imagen, video y audio. Diseñados,
              probados y mantenidos por nosotros para que te concentres
              solo en crear.
            </motion.p>

            <motion.p variants={fadeInUp} className="pf-lead" style={{ marginBottom: 24 }}>
              Los enciendes cuando los necesitas, los apagas cuando terminas.
              Sin tarjetas gráficas, sin configurar entornos, sin sorpresas
              al final del mes.
            </motion.p>

            <motion.p variants={fadeInUp} className="pf-lead" style={{ marginBottom: 64 }}>
              Diseñamos cada workflow. Probamos cada modelo. Mantenemos
              toda la infraestructura — para que tú solo tengas que abrir
              el Studio y crear.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px 40px",
                paddingTop: 32,
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {[
                "Cero costo de hardware",
                "10 modelos curados",
                "Sin créditos por generación",
                "Multi-runtime",
              ].map((item) => (
                <span
                  key={item}
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ LO QUE PUEDES HACER ═══════════════ */}
      <section style={{ background: "#0A0A0B", padding: "140px 80px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="pf-h2" style={{ marginBottom: 64 }}>
              Todo lo que necesitas
              <br />
              para crear.
            </motion.h2>

            {[
              {
                Icon: ImageIcon,
                title: "Imagen",
                body: "Krea 2 Turbo, Flux 2 Klein 4B, Qwen Image 2.1. Estilos predefinidos, edición, remoción de fondos, multi-referencia.",
              },
              {
                Icon: VideoCamera,
                title: "Video",
                body: "LTX 2.3, LTX 2.5 MSR, Wan 2.1 Dual. Multi-escena, audio sincronizado, animación de imágenes con coherencia visual.",
              },
              {
                Icon: MusicNotes,
                title: "Audio",
                body: "OmniVoice, Index TTS 2.5. Clonación de voz, diálogos entre personajes, 13 idiomas, control de emoción.",
              },
            ].map((f, i, arr) => (
              <motion.div
                key={f.title}
                variants={fadeInUp}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr",
                  gap: 40,
                  padding: "48px 0",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  borderBottom: i === arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  alignItems: "flex-start",
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8B5CF6",
                }}>
                  <f.Icon size={32} weight="regular" />
                </div>
                <div>
                  <h3 className="pf-h3" style={{ marginBottom: 12 }}>{f.title}</h3>
                  <p className="pf-body" style={{ maxWidth: 620 }}>{f.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ ASÍ FUNCIONA ═══════════════ */}
      <section style={{ background: "#0A0A0B", padding: "140px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
      <section style={{ background: "#0A0A0B", padding: "120px 80px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
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

            <motion.p variants={fadeInUp} className="pf-lead" style={{ marginBottom: 40, maxWidth: 560 }}>
              Plan Free con 3 modelos, sin tarjeta. Creator para el Estudio completo.
            </motion.p>

            <motion.div variants={fadeInUp}>
              <Link
                to="/pricing"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 24px",
                  background: "transparent",
                  color: "#F5F5F7",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 9999,
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  transition: "border-color 150ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
              >
                Ver todos los planes
                <ArrowRight width={16} height={16} strokeWidth={2} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section style={{
        position: "relative",
        background: "#0A0A0B",
        padding: "160px 80px",
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
            background: "radial-gradient(ellipse, rgba(139,92,246,0.14) 0%, transparent 65%)",
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
