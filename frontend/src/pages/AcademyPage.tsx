// src/pages/AcademyPage.tsx
// Catálogo premium — espacio + inteligencia + marketing puro
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Lock } from '@phosphor-icons/react/dist/csr/Lock';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { Fire } from '@phosphor-icons/react/dist/csr/Fire';
import MarketingLayout from "../components/marketing/MarketingLayout";
import { useAuth } from "../hooks/useAuth";
import { fadeInUp, staggerContainer } from "../design/motion";

// ---------------------------------------------------------------------------
// AURORA ATMOSPHERE
// ---------------------------------------------------------------------------
const AuroraAtmosphere: React.FC = () => (
  <>
    <div
      aria-hidden
      className="pf-aurora-1"
      style={{
        position: "absolute",
        top: "-20%",
        left: "-15%",
        width: "900px",
        height: "900px",
        background: "radial-gradient(circle, rgba(139,92,246,0.16) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)",
        filter: "blur(80px)",
        pointerEvents: "none",
      }}
    />
    <div
      aria-hidden
      className="pf-aurora-2"
      style={{
        position: "absolute",
        bottom: "-25%",
        right: "-10%",
        width: "800px",
        height: "800px",
        background: "radial-gradient(circle, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0.03) 40%, transparent 70%)",
        filter: "blur(90px)",
        pointerEvents: "none",
      }}
    />
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.025,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
      }}
    />
  </>
);

// ---------------------------------------------------------------------------
// HOOK: mouse tilt 3D
// ---------------------------------------------------------------------------
function useMouseTilt(maxTilt = 2) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (y - 0.5) * -maxTilt,
      y: (x - 0.5) * maxTilt,
    });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return { ref, tilt, handleMouseMove, handleMouseLeave };
}

// ---------------------------------------------------------------------------
// COUNT-UP
// ---------------------------------------------------------------------------
const CountUp: React.FC<{ value: number; duration?: number; suffix?: string }> = ({
  value,
  duration = 800,
  suffix = "",
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (hasAnimated || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {count}
      {suffix}
    </span>
  );
};

// ---------------------------------------------------------------------------
// STATUS DOT
// ---------------------------------------------------------------------------
const StatusDot: React.FC<{ color?: string }> = ({ color = "#10B981" }) => (
  <span
    aria-hidden
    className="pf-status-dot"
    style={{
      display: "inline-block",
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 8px ${color}99`,
    }}
  />
);

// ---------------------------------------------------------------------------
// DATA — 10 modelos
// ---------------------------------------------------------------------------
interface ModelData {
  id: string;
  name: string;
  capability: "image" | "video" | "audio";
  tagline: string;
  isFree: boolean;
  thumbnail: string;
  specs: string;
  metrics: { active: number; speed: string; today: number };
}

const BASE_URL = "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/model-thumbnails/";

const MODELS: ModelData[] = [
  // SPOTLIGHT
  {
    id: "qwen-image-2.1",
    name: "Qwen Image 2.1",
    capability: "image",
    tagline: "Imagen sin censura. El modelo más rápido del catálogo.",
    isFree: false,
    thumbnail: `${BASE_URL}qwen-image-2.1.png`,
    specs: "7B · 40 steps · 1024px · Multi-ref",
    metrics: { active: 3, speed: "0.8s", today: 47 },
  },
  // BENTO
  {
    id: "ltx-2.3",
    name: "LTX 2.3",
    capability: "video",
    tagline: "Video con audio sincronizado y storyboard multi-escena. El caballo de guerra del catálogo.",
    isFree: false,
    thumbnail: `${BASE_URL}ltx-2.3.png`,
    specs: "22B · 5 escenas · Audio nativo · 9:16",
    metrics: { active: 2, speed: "8-10 min", today: 12 },
  },
  {
    id: "flux-2-klein-4b",
    name: "Flux 2 Klein 4B",
    capability: "image",
    tagline: "Máxima calidad con referencias visuales y composición quirúrgica.",
    isFree: false,
    thumbnail: `${BASE_URL}flux-2.png`,
    specs: "4B · 4 steps · 4 refs · Apache 2.0",
    metrics: { active: 2, speed: "2.4s", today: 22 },
  },
  {
    id: "krea-2-turbo",
    name: "Krea 2 Turbo",
    capability: "image",
    tagline: "Imágenes en segundos con estilos predefinidos. El punto de entrada fácil.",
    isFree: true,
    thumbnail: `${BASE_URL}krea-2.png`,
    specs: "12B · 8 steps · 1K-2K · 5 estilos",
    metrics: { active: 8, speed: "0.6s", today: 89 },
  },
  {
    id: "ltx-2.3-msr",
    name: "LTX 2.3 MSR",
    capability: "video",
    tagline: "Video multi-referencia con el modelo 22B más pesado.",
    isFree: false,
    thumbnail: `${BASE_URL}ltx-2.3-msr.png`,
    specs: "22B MSR · 4 subjects + bg",
    metrics: { active: 1, speed: "10-12 min", today: 5 },
  },
  {
    id: "ltx-2.5-msr",
    name: "LTX 2.5 MSR",
    capability: "video",
    tagline: "La generación 2.5 de multi-referencia. Más rápido que 2.3.",
    isFree: false,
    thumbnail: `${BASE_URL}ltx-2.5-msr.png`,
    specs: "LTX 2.5 · 5 refs · Two-Speaker",
    metrics: { active: 1, speed: "6-8 min", today: 8 },
  },
  {
    id: "wan-dual-i2v",
    name: "Wan 2.1 Image-to-Video",
    capability: "video",
    tagline: "Anima una imagen estática con movimiento coherente.",
    isFree: true,
    thumbnail: `${BASE_URL}wan-dual.png`,
    specs: "14B · 5s · 480p · LoRAs",
    metrics: { active: 4, speed: "3-4 min", today: 31 },
  },
  {
    id: "wan-dual-t2v",
    name: "Wan 2.1 Text-to-Video",
    capability: "video",
    tagline: "Video desde texto en un solo modelo. Rápido y liviano.",
    isFree: true,
    thumbnail: `${BASE_URL}wan-dual.png`,
    specs: "1.3B · 5s · 8.19 GB VRAM",
    metrics: { active: 5, speed: "2-3 min", today: 44 },
  },
  {
    id: "tts-dual-omnivoice",
    name: "OmniVoice",
    capability: "audio",
    tagline: "Voz sintética con 4 modos: diseño, clonación, diálogos, auto voice.",
    isFree: false,
    thumbnail: `${BASE_URL}tts-dual.png`,
    specs: "13 idiomas · 24 kHz · 32 steps",
    metrics: { active: 2, speed: "78s", today: 19 },
  },
  {
    id: "tts-dual-index",
    name: "Index TTS 2.5",
    capability: "audio",
    tagline: "Clonación de voz con control de emoción. Dos referencias.",
    isFree: false,
    thumbnail: `${BASE_URL}tts-dual.png`,
    specs: "6 idiomas · 22 kHz · Cross-lingual",
    metrics: { active: 1, speed: "62s", today: 11 },
  },
];

const CAPABILITY_META = {
  image: { label: "Imagen", color: "#8B5CF6" },
  video: { label: "Video", color: "#EC4899" },
  audio: { label: "Audio", color: "#F59E0B" },
} as const;

const SPOTLIGHT_MODEL = MODELS[0];

// ---------------------------------------------------------------------------
// HERO THUMBNAIL (con tilt 3D)
// ---------------------------------------------------------------------------
const HeroThumbnail: React.FC<{ model: ModelData }> = ({ model }) => {
  const { ref, tilt, handleMouseMove, handleMouseLeave } = useMouseTilt(3);
  const [hover, setHover] = useState(false);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        handleMouseLeave();
      }}
      style={{
        position: "relative",
        aspectRatio: "16/10",
        borderRadius: 12,
        overflow: "hidden",
        background: "#0F0F11",
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer",
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${hover ? -3 : 0}px)`,
        transition: hover ? "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)" : "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: hover ? "0 20px 40px -12px rgba(139,92,246,0.30)" : "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <img
        src={model.thumbnail}
        alt={model.name}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      {/* Overlay */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)`,
          pointerEvents: "none",
        }}
      />
      {/* Info abajo */}
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#F5F5F7",
          }}
        >
          {model.name}
        </span>
        <StatusDot
          color={
            model.isFree
              ? "#10B981"
              : "#A78BFA"
          }
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// LOCK BADGE
// ---------------------------------------------------------------------------
const LockBadge: React.FC = () => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "4px 8px",
      background: "rgba(15,15,18,0.85)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(139,92,246,0.40)",
      borderRadius: 6,
      fontFamily: "var(--pf-font-mono)",
      fontSize: "0.5625rem",
      fontWeight: 600,
      letterSpacing: "0.10em",
      textTransform: "uppercase",
      color: "#A78BFA",
    }}
  >
    <Lock size={10} weight="regular" />
    Creator
  </div>
);

// ---------------------------------------------------------------------------
// MODEL TILE (bento)
// ---------------------------------------------------------------------------
const ModelTile: React.FC<{
  model: ModelData;
  span?: number;
  isUnlocked: boolean;
}> = ({ model, span = 1, isUnlocked }) => {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  const meta = CAPABILITY_META[model.capability];
  const locked = !model.isFree && !isUnlocked;

  return (
    <motion.div
      variants={fadeInUp}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/academy/${model.id}`)}
      style={{
        gridColumn: `span ${span}`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        borderRadius: 14,
        overflow: "hidden",
        background: "#0F0F11",
        border: `1px solid ${hover ? `${meta.color}40` : "rgba(255,255,255,0.06)"}`,
        transition: "border-color 200ms, transform 200ms",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        cursor: "pointer",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: "relative",
          aspectRatio: span === 2 ? "16/9" : "16/10",
          overflow: "hidden",
          background: "#08080A",
        }}
      >
        <img
          src={model.thumbnail}
          alt={model.name}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)",
            transform: hover ? "scale(1.04)" : "scale(1)",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Capability chip */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: "rgba(15,15,18,0.85)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${meta.color}40`,
            borderRadius: 9999,
            fontFamily: "var(--pf-font-mono)",
            fontSize: "0.5625rem",
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: meta.color,
          }}
        >
          {meta.label}
        </div>
        {/* Lock badge o dot */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {model.isFree && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 8px",
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.40)",
                borderRadius: 6,
                fontFamily: "var(--pf-font-mono)",
                fontSize: "0.5625rem",
                fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "#34D399",
              }}
            >
              Free
            </span>
          )}
          {locked && <LockBadge />}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: "20px 20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "var(--pf-font-display-alt)",
              fontSize: span === 2 ? "1.5rem" : "1rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#F5F5F7",
              margin: 0,
              marginBottom: 6,
            }}
          >
            {model.name}
          </h3>
          <p
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: span === 2 ? "0.9375rem" : "0.8125rem",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.55)",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: span === 2 ? 2 : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {model.tagline}
          </p>
        </div>

        {/* Specs mono */}
        <div
          style={{
            fontFamily: "var(--pf-font-mono)",
            fontSize: "0.6875rem",
            fontWeight: 500,
            letterSpacing: "0.04em",
            color: "rgba(255,255,255,0.35)",
            marginTop: "auto",
          }}
        >
          {model.specs}
        </div>
      </div>

      {/* Hover CTA */}
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
            }}
          >
            {locked ? (
              <Link
                to="/pricing"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: "#8B5CF6",
                  color: "#FFFFFF",
                  borderRadius: 9999,
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 8px 20px -6px rgba(139,92,246,0.6)",
                }}
              >
                Desbloquear
                <ArrowRight size={12} weight="regular" />
              </Link>
            ) : (
              <Link
                to={`/academy/${model.id}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.10)",
                  backdropFilter: "blur(8px)",
                  color: "#F5F5F7",
                  borderRadius: 9999,
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Ver ficha
                <ArrowRight size={12} weight="regular" />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// SPOTLIGHT CARD (Qwen)
// ---------------------------------------------------------------------------
const SpotlightCard: React.FC<{ model: ModelData; isUnlocked: boolean }> = ({ model, isUnlocked }) => {
  const locked = !model.isFree && !isUnlocked;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(34,211,238,0.02))",
        border: "1px solid rgba(139,92,246,0.25)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 65%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          alignItems: "stretch",
        }}
        className="pf-spotlight-grid"
      >
        {/* Thumbnail */}
        <motion.div
          variants={fadeInUp}
          style={{
            position: "relative",
            minHeight: 360,
            background: "#08080A",
            overflow: "hidden",
          }}
        >
          <img
            src={model.thumbnail}
            alt={model.name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, rgba(0,0,0,0) 60%, rgba(15,15,18,0.5) 100%)",
              pointerEvents: "none",
            }}
          />
        </motion.div>

        {/* Info */}
        <motion.div
          variants={fadeInUp}
          style={{
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#A78BFA",
              marginBottom: 18,
            }}
          >
            Punto de entrada · Imagen
          </div>

          <h3
            style={{
              fontFamily: "var(--pf-font-display-alt)",
              fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#F5F5F7",
              margin: 0,
              marginBottom: 16,
            }}
          >
            {model.name}
          </h3>

          <p
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "1.0625rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.6)",
              margin: 0,
              marginBottom: 32,
              maxWidth: 480,
            }}
          >
            {model.tagline}
          </p>

          {/* Métricas en vivo */}
          <div
            style={{
              display: "flex",
              gap: 32,
              paddingTop: 24,
              paddingBottom: 32,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              marginBottom: 32,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--pf-font-display-alt)",
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "#F5F5F7",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                <CountUp value={model.metrics.active} />
              </div>
              <div
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.5625rem",
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Activos ahora
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--pf-font-display-alt)",
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "#F5F5F7",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {model.metrics.speed}
              </div>
              <div
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.5625rem",
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Velocidad
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--pf-font-display-alt)",
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "#F5F5F7",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                <CountUp value={model.metrics.today} />
              </div>
              <div
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.5625rem",
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Generaciones hoy
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {locked ? (
              <Link
                to="/pricing"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 26px",
                  background: "#8B5CF6",
                  color: "#FFFFFF",
                  borderRadius: 9999,
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 12px 32px -8px rgba(139,92,246,0.6)",
                }}
              >
                Desbloquear con Creator
                <ArrowRight size={14} weight="regular" />
              </Link>
            ) : (
              <Link
                to={`/academy/${model.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 26px",
                  background: "#8B5CF6",
                  color: "#FFFFFF",
                  borderRadius: 9999,
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Ver ficha completa
                <ArrowRight size={14} weight="regular" />
              </Link>
            )}
            <Link
              to={`/academy/${model.id}`}
              style={{
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
                textDecoration: "none",
              }}
            >
              Ver detalles
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// CREATOR CTA BLOCK
// ---------------------------------------------------------------------------
const CreatorCTABlock: React.FC = () => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={staggerContainer}
    style={{
      position: "relative",
      marginTop: 80,
      padding: "44px 40px",
      background: "linear-gradient(135deg, rgba(139,92,246,0.10), rgba(236,72,153,0.06))",
      border: "1px solid rgba(139,92,246,0.28)",
      borderRadius: 20,
      overflow: "hidden",
    }}
  >
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: -80,
        right: -80,
        width: 320,
        height: 320,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(236,72,153,0.30), transparent 70%)",
        filter: "blur(50px)",
        pointerEvents: "none",
      }}
    />

    <div style={{ position: "relative", maxWidth: 780 }}>
      <motion.div
        variants={fadeInUp}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 12px",
          background: "rgba(220,38,38,0.18)",
          border: "1px solid rgba(220,38,38,0.50)",
          borderRadius: 9999,
          fontFamily: "var(--pf-font-mono)",
          fontSize: "0.6875rem",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          color: "#FCA5A5",
          marginBottom: 16,
        }}
      >
        <Fire size={12} weight="fill" />
        Precio de lanzamiento · Quedan 80 días
      </motion.div>

      <motion.h3
        variants={fadeInUp}
        style={{
          fontFamily: "var(--pf-font-display-alt)",
          fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          color: "#F5F5F7",
          margin: 0,
          marginBottom: 16,
        }}
      >
        6 de 10 modelos requieren Creator.
      </motion.h3>

      <motion.div
        variants={fadeInUp}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 12px",
          marginBottom: 20,
          fontFamily: "var(--pf-font-mono)",
          fontSize: "0.75rem",
          fontWeight: 500,
          letterSpacing: "0.06em",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        {["Qwen Image 2.1", "Flux 2 Klein 4B", "LTX 2.3", "LTX 2.3 MSR", "LTX 2.5 MSR", "TTS Dual"].map((m) => (
          <span key={m}>· {m}</span>
        ))}
      </motion.div>

      <motion.p
        variants={fadeInUp}
        style={{
          fontFamily: "var(--pf-font-ui)",
          fontSize: "0.9375rem",
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.6)",
          margin: 0,
          marginBottom: 24,
          maxWidth: 620,
        }}
      >
        Todos los modelos del catálogo. Workflows completos. Colab + Multi-Runtime
        desde el primer día.{" "}
        <strong style={{ color: "#F5F5F7" }}>$249/mes hasta el 31 dic</strong>{" "}
        — después sube a <s style={{ opacity: 0.6 }}>$399/mes</s>.
      </motion.p>

      <motion.div
        variants={fadeInUp}
        style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}
      >
        <Link
          to="/pricing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 28px",
            background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
            color: "#FFFFFF",
            borderRadius: 9999,
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.9375rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 12px 32px -8px rgba(139,92,246,0.6)",
          }}
        >
          Suscribirme — $249/mes
          <ArrowRight size={14} weight="regular" />
        </Link>
        <div
          style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          14 días de reembolso. Cancela cuando quieras.
        </div>
      </motion.div>
    </div>
  </motion.div>
);

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------
export const AcademyContent: React.FC = () => {
  const { profile } = useAuth();

  const plan = profile?.plan || "free";
  const hasCreator = plan === "creator" || plan === "founder" || plan === "pro";
  const isUnlocked = (model: ModelData) => model.isFree || hasCreator;

  return (
    <div style={{ background: "#000000", position: "relative", overflow: "hidden" }}>
      <AuroraAtmosphere />

      {/* ═══════════ HERO ═══════════ */}
      <section style={{ position: "relative", padding: "140px 80px 80px", textAlign: "center" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 900,
            height: 500,
            background: "radial-gradient(ellipse, rgba(139,92,246,0.16) 0%, transparent 65%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          style={{ position: "relative", maxWidth: 780, margin: "0 auto" }}
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
            Catálogo · v2.1
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
              marginBottom: 24,
            }}
          >
            Conoce tus modelos
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "1.125rem",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.6)",
              margin: 0,
              marginBottom: 60,
              maxWidth: 560,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Diez modelos curados. Uno para cada tipo de proyecto.
          </motion.p>

          {/* Showcase 3 thumbnails con tilt 3D */}
          <motion.div
            variants={fadeInUp}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
            className="pf-hero-thumbs"
          >
            <HeroThumbnail model={MODELS.find((m) => m.id === "qwen-image-2.1")!} />
            <HeroThumbnail model={MODELS.find((m) => m.id === "ltx-2.3")!} />
            <HeroThumbnail model={MODELS.find((m) => m.id === "krea-2-turbo")!} />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ SPOTLIGHT QWEN ═══════════ */}
      <section style={{ position: "relative", padding: "60px 80px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <SpotlightCard model={SPOTLIGHT_MODEL} isUnlocked={isUnlocked(SPOTLIGHT_MODEL)} />
        </div>
      </section>

      {/* ═══════════ BENTO GRID ═══════════ */}
      <section style={{ position: "relative", padding: "60px 80px 60px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              style={{
                fontFamily: "var(--pf-font-display-alt)",
                fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 40,
              }}
            >
              Los 10 modelos del catálogo
            </motion.h2>

            {/* Grid: LTX 2.3 destacado + resto */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
              }}
              className="pf-bento-grid"
            >
              {/* Fila 1: LTX 2.3 (span 2) + Flux + Krea */}
              <ModelTile model={MODELS.find((m) => m.id === "ltx-2.3")!} span={2} isUnlocked={isUnlocked(MODELS.find((m) => m.id === "ltx-2.3")!)} />
              <ModelTile model={MODELS.find((m) => m.id === "flux-2-klein-4b")!} span={1} isUnlocked={isUnlocked(MODELS.find((m) => m.id === "flux-2-klein-4b")!)} />
              <ModelTile model={MODELS.find((m) => m.id === "krea-2-turbo")!} span={1} isUnlocked={isUnlocked(MODELS.find((m) => m.id === "krea-2-turbo")!)} />

              {/* Fila 2: 4 tiles */}
              <ModelTile model={MODELS.find((m) => m.id === "ltx-2.3-msr")!} span={1} isUnlocked={isUnlocked(MODELS.find((m) => m.id === "ltx-2.3-msr")!)} />
              <ModelTile model={MODELS.find((m) => m.id === "ltx-2.5-msr")!} span={1} isUnlocked={isUnlocked(MODELS.find((m) => m.id === "ltx-2.5-msr")!)} />
              <ModelTile model={MODELS.find((m) => m.id === "wan-dual-i2v")!} span={1} isUnlocked={isUnlocked(MODELS.find((m) => m.id === "wan-dual-i2v")!)} />
              <ModelTile model={MODELS.find((m) => m.id === "wan-dual-t2v")!} span={1} isUnlocked={isUnlocked(MODELS.find((m) => m.id === "wan-dual-t2v")!)} />

              {/* Fila 3: 2 tiles centrados */}
              <ModelTile model={MODELS.find((m) => m.id === "tts-dual-omnivoice")!} span={2} isUnlocked={isUnlocked(MODELS.find((m) => m.id === "tts-dual-omnivoice")!)} />
              <ModelTile model={MODELS.find((m) => m.id === "tts-dual-index")!} span={2} isUnlocked={isUnlocked(MODELS.find((m) => m.id === "tts-dual-index")!)} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CREATOR CTA ═══════════ */}
      <section style={{ position: "relative", padding: "0 80px 140px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <CreatorCTABlock />
        </div>
      </section>
    </div>
  );
};

// ---------------------------------------------------------------------------
// WRAPPER
// ---------------------------------------------------------------------------
const AcademyPage: React.FC = () => (
  <MarketingLayout>
    <AcademyContent />
  </MarketingLayout>
);

export default AcademyPage;
