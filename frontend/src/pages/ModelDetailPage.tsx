// src/pages/ModelDetailPage.tsx
// Detalle dinámico de modelo — /academy/:id
// Hermano visual de /academy, /how-it-works y /what-is-pathfinder.
import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { Lock } from '@phosphor-icons/react/dist/csr/Lock';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { Lightning } from '@phosphor-icons/react/dist/csr/Lightning';
import { Image as ImageIcon } from '@phosphor-icons/react/dist/csr/Image';
import { Palette } from '@phosphor-icons/react/dist/csr/Palette';
import { Lightbulb } from '@phosphor-icons/react/dist/csr/Lightbulb';
import { ShoppingBag } from '@phosphor-icons/react/dist/csr/ShoppingBag';
import { User } from '@phosphor-icons/react/dist/csr/User';
import { MagicWand } from '@phosphor-icons/react/dist/csr/MagicWand';
import { Scissors } from '@phosphor-icons/react/dist/csr/Scissors';
import { Megaphone } from '@phosphor-icons/react/dist/csr/Megaphone';
import { FilmSlate } from '@phosphor-icons/react/dist/csr/FilmSlate';
import { DeviceMobile } from '@phosphor-icons/react/dist/csr/DeviceMobile';
import { FilmStrip } from '@phosphor-icons/react/dist/csr/FilmStrip';
import { MusicNotes } from '@phosphor-icons/react/dist/csr/MusicNotes';
import { Microphone } from '@phosphor-icons/react/dist/csr/Microphone';
import { Layout } from '@phosphor-icons/react/dist/csr/Layout';
import { Users } from '@phosphor-icons/react/dist/csr/Users';
import { BookOpen } from '@phosphor-icons/react/dist/csr/BookOpen';
import { Globe } from '@phosphor-icons/react/dist/csr/Globe';
import { MaskHappy } from '@phosphor-icons/react/dist/csr/MaskHappy';
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle';
import { Package } from '@phosphor-icons/react/dist/csr/Package';
import { Camera } from '@phosphor-icons/react/dist/csr/Camera';
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { Cpu } from '@phosphor-icons/react/dist/csr/Cpu';
import MarketingLayout from "../components/marketing/MarketingLayout";
import { useAuth } from "../hooks/useAuth";
import { fadeInUp, staggerContainer } from "../design/motion";
import {
  getAcademyModel,
  type AcademyModel,
  type Capability,
  type ModelExample,
} from "../config/academy-models";

// ---------------------------------------------------------------------------
// AURORA ATMOSPHERE (idéntico a AcademyPage)
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
// CAPABILITY META
// ---------------------------------------------------------------------------
const CAPABILITY_META: Record<Capability, { label: string; color: string }> = {
  image: { label: "Imagen", color: "#8B5CF6" },
  video: { label: "Video", color: "#EC4899" },
  audio: { label: "Audio", color: "#F59E0B" },
};

// ---------------------------------------------------------------------------
// ICON MAP (Lucide-style string → Phosphor component)
// ---------------------------------------------------------------------------
type PhosphorIcon = React.ComponentType<{
  size?: number;
  weight?: "regular" | "bold" | "fill" | "duotone" | "thin" | "light";
}>;

const ICON_MAP: Record<string, PhosphorIcon> = {
  Zap: Lightning,
  Image: ImageIcon,
  Palette: Palette,
  Lightbulb: Lightbulb,
  ShoppingBag: ShoppingBag,
  User: User,
  Wand2: MagicWand,
  Scissors: Scissors,
  Megaphone: Megaphone,
  Clapperboard: FilmSlate,
  Smartphone: DeviceMobile,
  Film: FilmStrip,
  Music: MusicNotes,
  Mic: Microphone,
  Layout: Layout,
  Users: Users,
  BookOpen: BookOpen,
  Globe: Globe,
  Drama: MaskHappy,
  Sparkle: Sparkle,
  Package: Package,
  Camera: Camera,
  Edit: PencilSimple,
  Cpu: Cpu,
};

const resolveIcon = (name: string): PhosphorIcon => ICON_MAP[name] ?? Sparkle;

// ---------------------------------------------------------------------------
// SECTION HEADER
// ---------------------------------------------------------------------------
const SectionHeader: React.FC<{ eyebrow: string; title: string; subtitle?: string }> = ({
  eyebrow,
  title,
  subtitle,
}) => (
  <motion.div variants={fadeInUp} style={{ marginBottom: 40 }}>
    <div
      style={{
        fontFamily: "var(--pf-font-mono)",
        fontSize: "0.6875rem",
        fontWeight: 500,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
        marginBottom: 14,
      }}
    >
      {eyebrow}
    </div>
    <h2
      style={{
        fontFamily: "var(--pf-font-display-alt)",
        fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
        fontWeight: 600,
        letterSpacing: "-0.025em",
        color: "#F5F5F7",
        margin: 0,
        marginBottom: subtitle ? 14 : 0,
        lineHeight: 1.15,
      }}
    >
      {title}
    </h2>
    {subtitle && (
      <p
        style={{
          fontFamily: "var(--pf-font-ui)",
          fontSize: "1rem",
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.55)",
          margin: 0,
          maxWidth: 680,
        }}
      >
        {subtitle}
      </p>
    )}
  </motion.div>
);

// ---------------------------------------------------------------------------
// DIVIDER
// ---------------------------------------------------------------------------
const Divider: React.FC = () => (
  <div
    style={{
      height: 1,
      background:
        "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.30) 50%, transparent 100%)",
      margin: "80px 0",
    }}
  />
);

// ---------------------------------------------------------------------------
// WAVEFORM PLACEHOLDER (para audio)
// ---------------------------------------------------------------------------
const WaveformPlaceholder: React.FC<{ label: string; context: string }> = ({ label, context }) => {
  const bars = Array.from({ length: 72 }, (_, i) => 20 + Math.abs(Math.sin(i * 0.7)) * 55 + (i % 4) * 4);
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(139,92,246,0.04))",
        border: "1px solid rgba(245,158,11,0.18)",
        padding: "36px 24px 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 2, height: 90, marginBottom: 24 }}>
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background: "#F59E0B",
              borderRadius: 1,
              opacity: 0.55 + (i % 3) * 0.15,
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: "var(--pf-font-ui)",
          fontSize: "0.9375rem",
          fontWeight: 600,
          color: "#F5F5F7",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--pf-font-ui)",
          fontSize: "0.8125rem",
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.45,
        }}
      >
        {context}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// MEDIA PLACEHOLDER (para imagen/video)
// ---------------------------------------------------------------------------
const MediaPlaceholder: React.FC<{
  capability: Capability;
  label: string;
  context: string;
}> = ({ capability, label, context }) => {
  const aspect = capability === "video" ? "16 / 9" : "1 / 1";
  const meta = CAPABILITY_META[capability];
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: aspect,
        borderRadius: 12,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${meta.color}10 0%, rgba(15,15,17,1) 55%, #0F0F11 100%)`,
        border: `1px solid ${meta.color}22`,
      }}
    >
      {/* Grid sutil de fondo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />
      {/* Radial de acento en la esquina */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-30%",
          right: "-20%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${meta.color}30, transparent 65%)`,
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      {/* Icono centrado */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: meta.color,
          opacity: 0.35,
        }}
      >
        {capability === "video" ? (
          <FilmStrip size={64} weight="thin" />
        ) : (
          <ImageIcon size={64} weight="thin" />
        )}
      </div>
      {/* Overlay gradient */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.88) 100%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
        <div
          style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "#F5F5F7",
            marginBottom: 3,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.4,
          }}
        >
          {context}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// OUTPUT CARD (elige media o waveform)
// ---------------------------------------------------------------------------
const OutputCard: React.FC<{
  capability: Capability;
  example: ModelExample;
}> = ({ capability, example }) => {
  if (capability === "audio") {
    return <WaveformPlaceholder label={example.label} context={example.context} />;
  }
  return (
    <MediaPlaceholder capability={capability} label={example.label} context={example.context} />
  );
};

// ---------------------------------------------------------------------------
// CAPABILITY CHIP
// ---------------------------------------------------------------------------
const CapabilityChip: React.FC<{ capability: Capability }> = ({ capability }) => {
  const meta = CAPABILITY_META[capability];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 12px",
        background: "rgba(15,15,18,0.85)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${meta.color}40`,
        borderRadius: 9999,
        fontFamily: "var(--pf-font-mono)",
        fontSize: "0.625rem",
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: meta.color,
      }}
    >
      {meta.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------
const ModelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const model: AcademyModel | undefined = id ? getAcademyModel(id) : undefined;

  if (!model) return <Navigate to="/academy" replace />;

  const plan = profile?.plan || "free";
  const hasCreator = plan === "creator" || plan === "founder" || plan === "pro";
  const isUnlocked = model.isFree || hasCreator;
  const isLocked = !isUnlocked;
  const ctaLabel = isLocked ? "Desbloquear con Creator" : "Abrir el Studio";
  const ctaTo = isLocked ? "/pricing" : "/studio";

  return (
    <MarketingLayout>
      <div style={{ background: "#000000", position: "relative", overflow: "hidden" }}>
        <AuroraAtmosphere />

        {/* ═══════════ HERO ═══════════ */}
        <section
          style={{
            position: "relative",
            padding: "140px 80px 80px",
            maxWidth: 1240,
            margin: "0 auto",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "30%",
              left: "40%",
              transform: "translate(-50%, -50%)",
              width: 900,
              height: 500,
              background: "radial-gradient(ellipse, rgba(139,92,246,0.16) 0%, transparent 65%)",
              filter: "blur(80px)",
              pointerEvents: "none",
            }}
          />

          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} style={{ marginBottom: 32 }}>
              <Link
                to="/academy"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={12} weight="regular" />
                Volver al catálogo
              </Link>
            </motion.div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.15fr 1fr",
                gap: 64,
                alignItems: "center",
              }}
              className="pf-detail-hero"
            >
              <motion.div variants={fadeInUp}>
                <div style={{ marginBottom: 20 }}>
                  <CapabilityChip capability={model.capability} />
                </div>

                <h1
                  style={{
                    fontFamily: "var(--pf-font-display)",
                    fontSize: "clamp(2.5rem, 5vw, 4rem)",
                    fontWeight: 400,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                    color: "#F5F5F7",
                    margin: 0,
                    marginBottom: 20,
                  }}
                >
                  {model.name}
                </h1>

                <p
                  style={{
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "1.125rem",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.6)",
                    margin: 0,
                    marginBottom: 24,
                    maxWidth: 560,
                  }}
                >
                  {model.tagline}
                </p>

                <p
                  style={{
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.9375rem",
                    lineHeight: 1.7,
                    color: "rgba(255,255,255,0.5)",
                    margin: 0,
                    marginBottom: 28,
                    maxWidth: 620,
                  }}
                >
                  {model.description}
                </p>

                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 32,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px 14px",
                  }}
                >
                  {model.specs.slice(0, 4).map((s, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span style={{ opacity: 0.35 }}>·</span>}
                      <span>{s.value}</span>
                    </React.Fragment>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Link
                    to={ctaTo}
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
                    {ctaLabel}
                    <ArrowRight size={14} weight="regular" />
                  </Link>
                  <Link
                    to="/academy"
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
                    Volver al catálogo
                  </Link>
                </div>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                style={{
                  position: "relative",
                  aspectRatio: "4 / 3",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "#0F0F11",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <img
                  src={model.thumbnail}
                  alt={model.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    display: "flex",
                    gap: 8,
                  }}
                >
                  {model.isFree ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "5px 10px",
                        background: "rgba(16,185,129,0.18)",
                        border: "1px solid rgba(16,185,129,0.45)",
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
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 10px",
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
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════ CONTENIDO ═══════════ */}
        <section
          style={{
            position: "relative",
            padding: "0 80px 140px",
            maxWidth: 1240,
            margin: "0 auto",
          }}
        >
          {/* ─── OUTPUT ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <SectionHeader eyebrow="Output" title="Lo que genera" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {model.examples.map((ex, i) => (
                <motion.div key={i} variants={fadeInUp}>
                  <OutputCard capability={model.capability} example={ex} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          <Divider />

          {/* ─── POR QUÉ ELEGIRLO ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <SectionHeader eyebrow="Por qué elegirlo" title={`Por qué ${model.name}`} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {model.useCases.slice(0, 3).map((uc, i) => {
                const Icon = resolveIcon(uc.icon);
                return (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    style={{
                      padding: "26px 24px",
                      background: "rgba(255,255,255,0.015)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: "rgba(139,92,246,0.10)",
                        border: "1px solid rgba(139,92,246,0.25)",
                        color: "#A78BFA",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 16,
                      }}
                    >
                      <Icon size={18} weight="regular" />
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: "#F5F5F7",
                        margin: 0,
                        marginBottom: 8,
                      }}
                    >
                      {uc.title}
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
                      {uc.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <Divider />

          {/* ─── ESPECIFICACIONES ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <SectionHeader eyebrow="Especificaciones" title="Ficha técnica" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 1,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {model.specs.map((s, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  style={{
                    padding: "24px 24px",
                    background: "#000000",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--pf-font-mono)",
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: 10,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--pf-font-ui)",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "#F5F5F7",
                      marginBottom: s.detail ? 6 : 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {s.value}
                  </div>
                  {s.detail && (
                    <div
                      style={{
                        fontFamily: "var(--pf-font-ui)",
                        fontSize: "0.8125rem",
                        color: "rgba(255,255,255,0.45)",
                        lineHeight: 1.45,
                      }}
                    >
                      {s.detail}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <Divider />

          {/* ─── CASOS DE USO ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <SectionHeader eyebrow="Casos de uso" title="Para qué sirve" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {model.useCases.map((uc, i) => {
                const Icon = resolveIcon(uc.icon);
                return (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    style={{
                      padding: "22px 22px",
                      background: "rgba(255,255,255,0.015)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: "rgba(139,92,246,0.10)",
                          border: "1px solid rgba(139,92,246,0.25)",
                          color: "#A78BFA",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={15} weight="regular" />
                      </div>
                      <span
                        style={{
                          fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "#F5F5F7",
                        }}
                      >
                        {uc.title}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--pf-font-ui)",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        color: "rgba(255,255,255,0.55)",
                        margin: 0,
                      }}
                    >
                      {uc.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <Divider />

          {/* ─── LIMITACIONES ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <SectionHeader eyebrow="Limitaciones" title="Lo que debes saber" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {model.limitations.map((lim, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "18px 0",
                    borderBottom:
                      i < model.limitations.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      marginTop: 2,
                      color: "#F59E0B",
                    }}
                  >
                    <Warning size={16} weight="regular" />
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--pf-font-ui)",
                      fontSize: "0.9375rem",
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.6)",
                      margin: 0,
                    }}
                  >
                    {lim}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <Divider />

          {/* ─── GUÍA DE PROMPT ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <SectionHeader eyebrow="Guía de prompt" title="Cómo escribir tu prompt" />

            <motion.div variants={fadeInUp} style={{ marginBottom: 32 }}>
              <div
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 12,
                }}
              >
                Estructura
              </div>
              <div
                style={{
                  padding: "20px 22px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.75)",
                  wordBreak: "break-word",
                }}
              >
                {model.promptGuide.structure}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} style={{ marginBottom: 40 }}>
              <div
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 12,
                }}
              >
                Negative prompt
              </div>
              <div
                style={{
                  padding: "20px 22px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {model.promptGuide.negativePrompt}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <div
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 16,
                }}
              >
                Tips
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {model.promptGuide.tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div
                      style={{
                        fontFamily: "var(--pf-font-mono)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#A78BFA",
                        letterSpacing: "0.08em",
                        flexShrink: 0,
                        marginTop: 3,
                        minWidth: 24,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--pf-font-ui)",
                        fontSize: "0.9375rem",
                        lineHeight: 1.65,
                        color: "rgba(255,255,255,0.6)",
                        margin: 0,
                      }}
                    >
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <Divider />

          {/* ─── EJEMPLOS ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <SectionHeader eyebrow="Ejemplos" title="Prompts que funcionan" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
                gap: 16,
              }}
            >
              {model.examples.map((ex, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  style={{
                    padding: "24px 24px",
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--pf-font-mono)",
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#A78BFA",
                      marginBottom: 8,
                    }}
                  >
                    {ex.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--pf-font-ui)",
                      fontSize: "0.8125rem",
                      color: "rgba(255,255,255,0.45)",
                      marginBottom: 14,
                      lineHeight: 1.45,
                    }}
                  >
                    {ex.context}
                  </div>
                  <div
                    style={{
                      padding: "16px 18px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 8,
                      fontFamily: "var(--pf-font-mono)",
                      fontSize: "0.75rem",
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.7)",
                      wordBreak: "break-word",
                    }}
                  >
                    {ex.prompt}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <Divider />

          {/* ─── CONTRATO CON EL STUDIO ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <SectionHeader
              eyebrow="Contrato con el Studio"
              title="Qué encontrarás en el FCM"
              subtitle="Los modos, parámetros y archivos que este modelo expone en el Floating Command Center."
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              <motion.div
                variants={fadeInUp}
                style={{
                  padding: "24px 22px",
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 14,
                  }}
                >
                  Modos
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {model.fcmContract.modes.map((mode, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-flex",
                        padding: "5px 12px",
                        background: "rgba(139,92,246,0.12)",
                        border: "1px solid rgba(139,92,246,0.30)",
                        borderRadius: 9999,
                        fontFamily: "var(--pf-font-mono)",
                        fontSize: "0.6875rem",
                        fontWeight: 500,
                        letterSpacing: "0.04em",
                        color: "#A78BFA",
                      }}
                    >
                      {mode}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                style={{
                  padding: "24px 22px",
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 14,
                  }}
                >
                  Parámetros
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {model.fcmContract.params.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        fontFamily: "var(--pf-font-mono)",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                        color: "rgba(255,255,255,0.6)",
                        lineHeight: 1.5,
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                style={{
                  padding: "24px 22px",
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 14,
                  }}
                >
                  Archivos
                </div>
                {model.fcmContract.files.length === 0 ? (
                  <div
                    style={{
                      fontFamily: "var(--pf-font-mono)",
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.35)",
                      fontStyle: "italic",
                    }}
                  >
                    Ninguno — este modelo no acepta archivos de entrada.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {model.fcmContract.files.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          fontFamily: "var(--pf-font-mono)",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          letterSpacing: "0.02em",
                          color: "rgba(255,255,255,0.6)",
                          lineHeight: 1.5,
                        }}
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>

          <Divider />

          {/* ─── CTA FINAL ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            style={{
              position: "relative",
              padding: "64px 40px",
              textAlign: "center",
              overflow: "hidden",
              border: "1px solid rgba(139,92,246,0.20)",
              borderRadius: 20,
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
                background: "radial-gradient(ellipse, rgba(139,92,246,0.16) 0%, transparent 65%)",
                filter: "blur(70px)",
                pointerEvents: "none",
              }}
            />

            <motion.div variants={fadeInUp} style={{ position: "relative" }}>
              <h2
                style={{
                  fontFamily: "var(--pf-font-display-alt)",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.025em",
                  color: "#F5F5F7",
                  margin: 0,
                  marginBottom: 16,
                }}
              >
                ¿Listo para crear con {model.name}?
              </h2>
              <p
                style={{
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "1rem",
                  color: "rgba(255,255,255,0.6)",
                  maxWidth: 520,
                  margin: "0 auto 32px",
                  lineHeight: 1.6,
                }}
              >
                {isLocked
                  ? "Activa tu plan Creator para desbloquear este modelo y los otros 5 del catálogo."
                  : "Tu estación está lista. Elige el modelo en el Studio y empieza a generar."}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  to={ctaTo}
                  style={{
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
                    textDecoration: "none",
                    boxShadow: "0 12px 32px -8px rgba(139,92,246,0.6)",
                  }}
                >
                  {ctaLabel}
                  <ArrowRight size={14} weight="regular" />
                </Link>
                <Link
                  to="/academy"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "15px 32px",
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
                  Volver al catálogo
                </Link>
              </div>
              {isLocked && (
                <p
                  style={{
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 20,
                    marginBottom: 0,
                  }}
                >
                  14 días de reembolso. Cancela cuando quieras.
                </p>
              )}
            </motion.div>
          </motion.div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default ModelDetailPage;
