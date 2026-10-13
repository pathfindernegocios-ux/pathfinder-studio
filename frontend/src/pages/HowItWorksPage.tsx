// src/pages/HowItWorksPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  ArrowUpRight,
  Video,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw,
  Package,
  LifeBuoy,
  Flame,
} from "lucide-react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";

// ---------------------------------------------------------------------------
// TEMA — detecta light vs dark/neon para ajustar contraste
// ---------------------------------------------------------------------------
const useIsLight = (): boolean => {
  const [isLight, setIsLight] = React.useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    const t = document.documentElement.dataset.theme || "light";
    return t === "light";
  });
  React.useEffect(() => {
    const update = () => {
      const t = document.documentElement.dataset.theme || "light";
      setIsLight(t === "light");
    };
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return isLight;
};

// Paleta de callouts con variantes light/dark
const CALLOUT_PALETTE = {
  light: {
    tip:  { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.35)", color: "#047857", Icon: Lightbulb },
    info: { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.35)", color: "#4338CA", Icon: AlertCircle },
    warn: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.40)", color: "#B45309", Icon: AlertCircle },
  },
  dark: {
    tip:  { bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.3)", color: "#34D399", Icon: Lightbulb },
    info: { bg: "rgba(99,102,241,0.10)", border: "rgba(99,102,241,0.3)", color: "#A5B4FC", Icon: AlertCircle },
    warn: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.3)", color: "#FBBF24", Icon: AlertCircle },
  },
};

// ---------------------------------------------------------------------------
// MEDIA URLs — Bucket how-it-works-media
// ---------------------------------------------------------------------------
const MEDIA_URLS = {
  step1_register:
    "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/block1-register.png.jpg",
  step1_verify:
    "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/block2-verify.mp4",
  step2_download:
    "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step1-download.mp4",
  step3_kaggle:
    "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step2-activate.mp4",
  step3_colab:
    "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/step3_colab.mp4",
  step4_create:
    "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step3-ready.mp4",
  step5_save_shutdown:
    "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/step5_save_shutdown.mp4",
  step5_shutdown_kaggle:
    "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/step5_shutdown_kaggle.png",
  step5_shutdown_colab:
    "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/step5_shutdown_colab.png",
};

// ---------------------------------------------------------------------------
// STEPS — Stepper horizontal
// ---------------------------------------------------------------------------
const STEPS = [
  { num: "01", id: "step-01", label: "Prepara tu cuenta" },
  { num: "02", id: "step-02", label: "Descarga tu workflow" },
  { num: "03", id: "step-03", label: "Enciende tu estación" },
  { num: "04", id: "step-04", label: "Empieza a crear" },
  { num: "05", id: "step-05", label: "Guarda y apaga" },
  { num: "06", id: "step-06", label: "Por qué confiar" },
];

// ---------------------------------------------------------------------------
// PLATFORM META — colores de marca Kaggle / Colab
// ---------------------------------------------------------------------------
type Platform = "kaggle" | "colab";

const PLATFORM_META: Record<
  Platform,
  { label: string; color: string; colorDeep: string; url: string; cta: string }
> = {
  kaggle: {
    label: "Kaggle",
    color: "#20BEFF",
    colorDeep: "#1E9DE0",
    url: "https://www.kaggle.com/",
    cta: "Abrir Kaggle",
  },
  colab: {
    label: "Colab",
    color: "#F9AB00",
    colorDeep: "#FBBC04",
    url: "https://colab.research.google.com/",
    cta: "Abrir Colab",
  },
};

// ---------------------------------------------------------------------------
// MediaBlock — video o imagen con reproductor de Welcome
// ---------------------------------------------------------------------------
const MediaBlock: React.FC<{
  type: "video" | "image";
  label: string;
  url?: string;
}> = ({ type, label, url }) => {
  if (url && url.length > 0) {
    if (type === "video") {
      return (
        <div style={{ margin: "28px 0" }}>
          <VideoPlayer
            src={url}
            aspectRatio="16/9"
            objectFit="contain"
            background="transparent"
            autoPlay={false}
          />
        </div>
      );
    }
    return (
      <div
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          margin: "28px 0",
          background: "var(--pf-bg-secondary, #FAFAFA)",
          border: "1px solid var(--pf-border-subtle, #F4F4F5)",
        }}
      >
        <img
          src={url}
          alt={label}
          style={{ width: "100%", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        aspectRatio: "16 / 9",
        background: "rgba(139, 92, 246, 0.04)",
        border: "2px dashed rgba(139, 92, 246, 0.25)",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        margin: "28px 0",
        color: "var(--pf-text-muted, #A1A1AA)",
        fontFamily: "var(--pf-font-ui, system-ui)",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      {type === "video" ? <Video size={36} /> : <ImageIcon size={36} />}
      <div style={{ fontSize: "0.9375rem", fontWeight: 600 }}>{label}</div>
      <div
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Disponible próximamente
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Callout — nota / tip / alerta
// ---------------------------------------------------------------------------
const Callout: React.FC<{
  kind: "tip" | "info" | "warn";
  children: React.ReactNode;
}> = ({ kind, children }) => {
  const isLight = useIsLight();
  const palette = isLight ? CALLOUT_PALETTE.light : CALLOUT_PALETTE.dark;
  const config = palette[kind];

  return (
    <div
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: "12px",
        padding: "16px 20px",
        margin: "20px 0",
        display: "flex",
        gap: "12px",
        color: config.color,
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "0.9375rem",
        lineHeight: 1.6,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: "2px" }}>
        <config.Icon size={18} />
      </span>
      <div>{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step — paso numerado dentro de un bloque
// ---------------------------------------------------------------------------
const Step: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "flex",
      gap: "12px",
      alignItems: "flex-start",
      marginBottom: "12px",
    }}
  >
    <CheckCircle2
      size={18}
      style={{ color: "#A78BFA", flexShrink: 0, marginTop: "4px" }}
    />
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

// ---------------------------------------------------------------------------
// SubHeading — h3 dentro de un bloque
// ---------------------------------------------------------------------------
const SubHeading: React.FC<{ children: React.ReactNode; first?: boolean }> = ({
  children,
  first,
}) => (
  <h3
    style={{
      fontFamily: "var(--pf-font-display, system-ui)",
      fontSize: "1.125rem",
      fontWeight: 700,
      color: "var(--pf-text-primary, #0A0A0A)",
      marginTop: first ? 0 : "32px",
      marginBottom: "12px",
    }}
  >
    {children}
  </h3>
);

// ---------------------------------------------------------------------------
// PlatformButton — CTA con color de la plataforma
// ---------------------------------------------------------------------------
const PlatformButton: React.FC<{ platform: Platform }> = ({ platform }) => {
  const meta = PLATFORM_META[platform];
  return (
    <a
      href={meta.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 20px",
        background: `linear-gradient(135deg, ${meta.color}, ${meta.colorDeep})`,
        color: "#FFFFFF",
        borderRadius: "9999px",
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "0.875rem",
        fontWeight: 600,
        textDecoration: "none",
        marginTop: "8px",
      }}
    >
      {meta.cta}
      <ArrowUpRight size={16} />
    </a>
  );
};

// ---------------------------------------------------------------------------
// Code — inline code
// ---------------------------------------------------------------------------
const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code
    style={{
      background: "var(--pf-bg-secondary, #FAFAFA)",
      padding: "2px 6px",
      borderRadius: "4px",
      fontFamily: "monospace",
      fontSize: "0.875em",
    }}
  >
    {children}
  </code>
);

// ---------------------------------------------------------------------------
// Block — contenedor de bloque numerado
// ---------------------------------------------------------------------------
const Block: React.FC<{
  id?: string;
  num: string;
  title: string;
  children: React.ReactNode;
}> = ({ id, num, title, children }) => (
  <section
    id={id}
    style={{
      scrollMarginTop: "100px",
      paddingTop: "40px",
      paddingBottom: "40px",
      borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "16px",
        marginBottom: "20px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--pf-font-display, system-ui)",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--pf-text-muted, #A1A1AA)",
          letterSpacing: "-0.04em",
        }}
      >
        {num}
      </span>
      <h2
        style={{
          fontFamily: "var(--pf-font-display, system-ui)",
          fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--pf-text-primary, #0A0A0A)",
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
    <div
      style={{
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "1rem",
        lineHeight: 1.7,
        color: "var(--pf-text-secondary, #525252)",
      }}
    >
      {children}
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// StepperNav — navegación superior con scroll-spy
// ---------------------------------------------------------------------------
const StepperNav: React.FC<{ activeStep: string }> = ({ activeStep }) => {
  const isLight = useIsLight();

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      style={{
        display: "flex",
        gap: "8px",
        overflowX: "auto",
        paddingBottom: "16px",
        marginBottom: "32px",
        borderBottom: "1px solid var(--pf-border-subtle, #F4F4F5)",
      }}
    >
      {STEPS.map((s) => {
        const isActive = activeStep === s.id;
        return (
          <button
            key={s.id}
            onClick={() => handleClick(s.id)}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              background: isActive
                ? isLight
                  ? "linear-gradient(180deg, #FFFFFF 0%, #FBFBFD 100%)"
                  : "var(--pf-bg-elevated, #FFFFFF)"
                : isLight
                ? "rgba(139, 92, 246, 0.05)"
                : "rgba(255, 255, 255, 0.03)",
              border: isActive
                ? isLight
                  ? "1px solid rgba(139, 92, 246, 0.35)"
                  : "1px solid rgba(139, 92, 246, 0.4)"
                : isLight
                ? "1px solid rgba(139, 92, 246, 0.12)"
                : "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "9999px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: isActive
                ? "var(--pf-text-primary, #0A0A0A)"
                : "var(--pf-text-secondary, #525252)",
              cursor: "pointer",
              transition:
                "background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease",
              boxShadow: isActive
                ? isLight
                  ? "0 2px 8px -2px rgba(139, 92, 246, 0.25), 0 1px 2px rgba(0,0,0,0.03)"
                  : "0 2px 8px -2px rgba(139, 92, 246, 0.4)"
                : "none",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (isActive) return;
              e.currentTarget.style.background = isLight
                ? "rgba(139, 92, 246, 0.10)"
                : "rgba(139, 92, 246, 0.12)";
              e.currentTarget.style.borderColor = isLight
                ? "rgba(139, 92, 246, 0.30)"
                : "rgba(139, 92, 246, 0.35)";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = isLight
                ? "0 4px 12px -4px rgba(139, 92, 246, 0.30)"
                : "0 4px 12px -4px rgba(139, 92, 246, 0.45)";
            }}
            onMouseLeave={(e) => {
              if (isActive) return;
              e.currentTarget.style.background = isLight
                ? "rgba(139, 92, 246, 0.05)"
                : "rgba(255, 255, 255, 0.03)";
              e.currentTarget.style.borderColor = isLight
                ? "rgba(139, 92, 246, 0.12)"
                : "rgba(255, 255, 255, 0.06)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span
              style={{
                fontFamily: "var(--pf-font-display, system-ui)",
                fontSize: "0.75rem",
                fontWeight: 800,
                color: isActive
                  ? isLight
                    ? "#6D28D9"
                    : "#A78BFA"
                  : isLight
                  ? "#8B5CF6"
                  : "#A78BFA",
                letterSpacing: "-0.02em",
                opacity: isActive ? 1 : 0.7,
              }}
            >
              {s.num}
            </span>
            {s.label}
          </button>
        );
      })}
    </nav>
  );
};

// ---------------------------------------------------------------------------
// HowItWorksContent — contenido sin wrapper de layout
// ---------------------------------------------------------------------------
export const HowItWorksContent: React.FC = () => {
  const { session, profile } = useAuth();
  const isLight = useIsLight();
  const [isMarking, setIsMarking] = useState(false);
  const [activeStep, setActiveStep] = useState("step-01");
  const [activePlatform, setActivePlatform] = useState<Platform>("kaggle");
  const [zoomedImage, setZoomedImage] = useState<{ url: string; alt: string } | null>(null);

  // Escape cierra el lightbox
  useEffect(() => {
    if (!zoomedImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomedImage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomedImage]);

  const hasViewedBefore = !!profile?.how_it_works_viewed_at;

  // Scroll-spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveStep(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    STEPS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleComplete = async () => {
    if (!session?.user?.id) {
      window.location.href = "/auth";
      return;
    }
    setIsMarking(true);
    try {
      await supabase
        .from("profiles")
        .update({ how_it_works_viewed_at: new Date().toISOString() })
        .eq("id", session.user.id);
    } catch (e) {
      void 0;
    }
    window.location.href = "/studio";
  };

  return (
    <div
      style={{
        maxWidth: "880px",
        margin: "0 auto",
        padding: "60px 24px 120px",
      }}
    >
      {/* ==================== HERO ==================== */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            background: "rgba(99,102,241,0.10)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "9999px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: isLight ? "#4338CA" : "#A5B4FC",
            marginBottom: "20px",
          }}
        >
          Guía de inicio
        </div>

        <h1
          style={{
            fontFamily: "var(--pf-font-display, system-ui)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "var(--pf-text-primary, #0A0A0A)",
            margin: 0,
            marginBottom: "20px",
          }}
        >
          Cómo funciona Pathfinder
        </h1>

        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "1.125rem",
            lineHeight: 1.6,
            color: "var(--pf-text-secondary, #525252)",
            maxWidth: "640px",
            margin: 0,
            marginBottom: "16px",
          }}
        >
          Pathfinder no ejecuta los modelos en nuestros servidores. Cada vez
          que quieras crear, enciendes tu propia estación de cómputo — una
          sesión en Kaggle o en Google Colab que corre el modelo por ti.
        </p>

        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "1.125rem",
            lineHeight: 1.6,
            color: "var(--pf-text-secondary, #525252)",
            maxWidth: "640px",
            margin: 0,
            marginBottom: "16px",
            fontWeight: 500,
          }}
        >
          La preparas una vez, esperas a que esté lista, y después te
          concentras solo en crear. Todo el monitoreo, la carga y el estado
          de tu estación los ves desde Pathfinder Studio — no desde Kaggle ni
          Colab.
        </p>

        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "1.125rem",
            lineHeight: 1.6,
            color: "var(--pf-text-secondary, #525252)",
            maxWidth: "640px",
            margin: 0,
            fontWeight: 500,
          }}
        >
          Toda la infraestructura — workflows, modelos, nube y monitoreo — la
          mantenemos nosotros. Kaggle y Colab solo ponen el cómputo.
        </p>
      </div>

      {/* ==================== TRUST ROW ==================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "48px",
        }}
      >
        {[
          {
            Icon: ShieldCheck,
            title: "Workflows probados",
            desc: "Cada notebook lo testeamos antes de publicarlo. Tú solo lo cargas y das Run All.",
            accent: "#8B5CF6",
            accentDeep: "#6D28D9",
          },
          {
            Icon: RefreshCw,
            title: "Mantenimiento continuo",
            desc: "Actualizamos los workflows regularmente. No tienes que arreglar nada tú.",
            accent: "#06B6D4",
            accentDeep: "#0E7490",
          },
          {
            Icon: Package,
            title: "Nuevos modelos",
            desc: "Cuando agregamos un modelo, aparece en Mi Estación listo para descargar.",
            accent: "#EC4899",
            accentDeep: "#BE185D",
          },
          {
            Icon: LifeBuoy,
            title: "Soporte humano",
            desc: "Si te trabas, puedes contratar soporte y te acompañamos en el proceso.",
            accent: "#10B981",
            accentDeep: "#047857",
          },
        ].map(({ Icon, title, desc, accent, accentDeep }) => {
          const iconColor = isLight ? accentDeep : accent;
          const cardBg = isLight
            ? "linear-gradient(180deg, #FFFFFF 0%, #FBFBFD 100%)"
            : `linear-gradient(180deg, ${accent}0A 0%, ${accent}05 100%)`;
          const cardBorder = isLight ? `${accent}22` : `${accent}30`;
          const cardShadow = isLight
            ? "0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)"
            : `0 1px 2px rgba(0,0,0,0.2)`;
          const hoverBorder = isLight ? `${accent}55` : `${accent}70`;
          const hoverShadow = isLight
            ? `0 8px 24px -6px ${accent}40, 0 4px 12px rgba(0,0,0,0.04)`
            : `0 10px 28px -8px ${accent}55, 0 4px 12px rgba(0,0,0,0.3)`;

          return (
            <div
              key={title}
              style={{
                position: "relative",
                padding: "20px",
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "14px",
                transition:
                  "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                boxShadow: cardShadow,
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = hoverShadow;
                e.currentTarget.style.borderColor = hoverBorder;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = cardShadow;
                e.currentTarget.style.borderColor = cardBorder;
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: `linear-gradient(135deg, ${accent}26, ${accent}12)`,
                  border: `1px solid ${isLight ? accent + "33" : accent + "45"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: iconColor,
                  marginBottom: "14px",
                  boxShadow: isLight
                    ? `0 2px 6px -2px ${accent}30`
                    : `0 2px 8px -2px ${accent}40`,
                }}
              >
                <Icon size={18} />
              </div>
              <div
                style={{
                  fontFamily: "var(--pf-font-display, system-ui)",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "var(--pf-text-primary, #0A0A0A)",
                  marginBottom: "6px",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.55,
                  color: "var(--pf-text-secondary, #525252)",
                }}
              >
                {desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== STEPPER ==================== */}
      <StepperNav activeStep={activeStep} />

      {/* ==================== BLOQUE 01 ==================== */}
      <Block id="step-01" num="01" title="Prepara tu cuenta">
        <p style={{ marginBottom: "20px" }}>
          Antes de encender tu primera estación necesitas una cuenta y
          verificarla una sola vez. Es un trámite rápido que no vuelves a
          repetir.
        </p>

        <SubHeading first>Para Kaggle</SubHeading>
        <Step>
          Abre{" "}
          <a
            href="https://www.kaggle.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--pf-text-primary, #0A0A0A)",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            kaggle.com{" "}
            <ExternalLink
              size={12}
              style={{ display: "inline", marginLeft: "4px" }}
            />
          </a>{" "}
          y crea tu cuenta con Google o con un correo electrónico.
        </Step>
        <Step>
          Ve a{" "}
          <a
            href="https://www.kaggle.com/settings"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--pf-text-primary, #0A0A0A)",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Settings{" "}
            <ExternalLink
              size={12}
              style={{ display: "inline", marginLeft: "4px" }}
            />
          </a>{" "}
          y busca <strong>Phone Verification</strong>.
        </Step>
        <Step>
          Ingresa tu número de teléfono. Recibirás un código por SMS que debes
          confirmar.
        </Step>
        <Step>
          Cuando aparezca el check verde junto a tu nombre, tu cuenta ya puede
          usar GPUs. Listo.
        </Step>

        <MediaBlock
          type="image"
          label="Home de Kaggle — Sign In / Register"
          url={MEDIA_URLS.step1_register}
        />

        <MediaBlock
          type="video"
          label="Cómo verificar tu identidad en Kaggle"
          url={MEDIA_URLS.step1_verify}
        />

        <Callout kind="warn">
          Sin la verificación por SMS, Kaggle no te da acceso a GPUs. Este
          paso es obligatorio y se hace una sola vez.
        </Callout>

        <SubHeading>Para Google Colab (solo Creator y Founder)</SubHeading>
        <Step>
          Solo necesitas una cuenta de Google. Si ya tienes una (Gmail,
          Drive, YouTube), ya está — no hay que verificar nada más.
        </Step>
        <Step>
          Abre{" "}
          <a
            href="https://colab.research.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--pf-text-primary, #0A0A0A)",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            colab.research.google.com{" "}
            <ExternalLink
              size={12}
              style={{ display: "inline", marginLeft: "4px" }}
            />
          </a>{" "}
          e inicia sesión con esa cuenta.
        </Step>

        <Callout kind="info">
          <div>
            Los notebooks de Colab están disponibles solo para los planes{" "}
            <strong>Creator</strong> y <strong>Founder</strong>. En el plan
            Free corres un modelo a la vez desde Kaggle. En Creator
            desbloqueas Colab y puedes correr dos modelos al mismo tiempo
            (Multi-Runtime).
          </div>
          <div style={{ marginTop: "16px" }}>
            <Link
              to="/pricing"
              style={{
                color: "inherit",
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Pasa al plan Creator
            </Link>{" "}
            y desbloquea los 5 modelos premium, los workflows nuevos que
            compiten con la industria, y Colab + Multi-Runtime desde el
            primer día.
          </div>
        </Callout>
      </Block>

      {/* ==================== BLOQUE 02 ==================== */}
      <Block id="step-02" num="02" title="Descarga tu workflow">
        <p style={{ marginBottom: "20px" }}>
          Un <strong>workflow</strong> es la receta completa que Pathfinder
          preparó para cada modelo: le dice a Kaggle o Colab qué cargar, cómo
          configurarlo y qué hacer con tus prompts. Es una automatización
          lista para correr.
        </p>
        <p style={{ marginBottom: "20px" }}>
          Técnicamente, el workflow vive dentro de un{" "}
          <strong>notebook</strong> — un archivo que Kaggle y Colab entienden
          de forma nativa. Cuando descargas un workflow desde Mi Estación,
          descargas el notebook que lo contiene.
        </p>
        <p style={{ marginBottom: "20px" }}>
          En otras palabras:{" "}
          <strong>
            workflow es lo que haces, notebook es el archivo con el que lo
            haces.
          </strong>{" "}
          Es como un disco preparado para reproducir: lo cargas, presionas
          Play y Pathfinder cobra vida.
        </p>

        <Step>
          En Pathfinder, ve a <strong>Mi Estación</strong> desde el menú
          lateral.
        </Step>
        <Step>
          Verás una tarjeta por cada modelo. Elige el que quieras usar.
        </Step>
        <Step>
          Haz clic en <strong>Descargar workflow</strong>. Se descargará un
          archivo <Code>.ipynb</Code> a tu computadora.
        </Step>
        <Step>
          Guárdalo en una carpeta que puedas encontrar después. Lo vas a usar
          en el siguiente paso.
        </Step>

        <MediaBlock
          type="video"
          label="Cómo descargar tu workflow desde Mi Estación"
          url={MEDIA_URLS.step2_download}
        />

        <Callout kind="tip">
          Puedes descargar varios workflows y guardarlos. Así los tienes a
          mano cuando quieras cambiar de modelo.
        </Callout>
      </Block>

      {/* ==================== BLOQUE 03 ==================== */}
      <Block id="step-03" num="03" title="Enciende tu estación">
        <p style={{ marginBottom: "20px" }}>
          Cada modelo vive en su propia plataforma: algunos corren en Kaggle,
          otros en Google Colab. En Mi Estación cada tarjeta te dice en cuál
          va. Elige la pestaña que corresponda y sigue los pasos.
        </p>

        {/* --- TABS --- */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "24px",
            marginTop: "8px",
          }}
        >
          {(["kaggle", "colab"] as Platform[]).map((p) => {
            const meta = PLATFORM_META[p];
            const isActive = activePlatform === p;
            return (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                style={{
                  padding: "10px 22px",
                  background: isActive
                    ? `linear-gradient(135deg, ${meta.color}, ${meta.colorDeep})`
                    : "transparent",
                  color: isActive
                    ? "#FFFFFF"
                    : "var(--pf-text-secondary, #525252)",
                  border: isActive
                    ? "none"
                    : "1px solid var(--pf-border-subtle, #F4F4F5)",
                  borderRadius: "9999px",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* --- CONTENIDO KAGGLE --- */}
        {activePlatform === "kaggle" && (
          <div>
            <Step>
              En Kaggle, haz clic en <strong>Create (+)</strong> arriba a la
              izquierda y elige <strong>Notebook</strong>.
            </Step>
            <Step>
              Ve a <strong>File</strong> → <strong>Import Notebook</strong>{" "}
              y arrastra o selecciona el archivo <Code>.ipynb</Code> que
              descargaste de Pathfinder. Haz clic en{" "}
              <strong>Import</strong>.
            </Step>
            <Step>
              En el panel derecho, sección <strong>Session options</strong>:
              <ul
                style={{
                  marginTop: "8px",
                  marginBottom: "0",
                  paddingLeft: "20px",
                }}
              >
                <li>
                  <strong>Accelerator</strong> → <strong>GPU T4 x2</strong>
                </li>
                <li>
                  <strong>Internet</strong> → actívalo (ON)
                </li>
              </ul>
            </Step>
            <Step>
              Enciende la sesión con el botón de encendido (el ícono power
              arriba a la derecha, junto al reloj de sesión). Espera a que
              quede activo.
            </Step>
            <Step>
              Arriba, junto a "Save Version", haz clic en{" "}
              <strong>▶ Run All</strong>. Vas a ver muchas líneas de texto
              pasar — todo es normal, no hay que tocar nada.{" "}
              <strong>No cierres la pestaña.</strong>
            </Step>

            <MediaBlock
              type="video"
              label="Cómo importar el workflow y encender la estación en Kaggle"
              url={MEDIA_URLS.step3_kaggle}
            />

            <div style={{ marginTop: "16px" }}>
              <PlatformButton platform="kaggle" />
            </div>

            <Callout kind="warn">
              Sin <strong>GPU T4 x2</strong> activado, el workflow no va a
              funcionar. Sin <strong>Internet</strong>, no puede descargar
              los modelos.
            </Callout>
          </div>
        )}

        {/* --- CONTENIDO COLAB --- */}
        {activePlatform === "colab" && (
          <div>
            <Step>
              Abre{" "}
              <a
                href="https://colab.research.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--pf-text-primary, #0A0A0A)",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Google Colab{" "}
                <ExternalLink
                  size={12}
                  style={{ display: "inline", marginLeft: "4px" }}
                />
              </a>{" "}
              y haz clic en <strong>Subir notebook</strong>.
            </Step>
            <Step>
              Elige <strong>Explorar</strong> y busca el archivo{" "}
              <Code>.ipynb</Code> que descargaste de Pathfinder. Ábrelo.
            </Step>
            <Step>
              En el menú superior, ve a <strong>Entorno de ejecución</strong>{" "}
              → <strong>Cambiar tipo de entorno de ejecución</strong> y
              selecciona <strong>GPU T4</strong> como acelerador de hardware.
            </Step>
            <Step>
              En el menú superior, haz clic en{" "}
              <strong>Entorno de ejecución</strong> →{" "}
              <strong>Ejecutar todo</strong>. Colab va a instalar
              dependencias y descargar el modelo.{" "}
              <strong>No cierres la pestaña.</strong>
            </Step>

            <MediaBlock
              type="video"
              label="Cómo cargar tu workflow en Colab"
              url={MEDIA_URLS.step3_colab}
            />

            <div style={{ marginTop: "16px" }}>
              <PlatformButton platform="colab" />
            </div>

            <Callout kind="warn">
              Sin <strong>GPU T4</strong> activada, el workflow no va a
              funcionar. Colab asigna GPUs gratuitas según disponibilidad —
              si no consigues una, intenta más tarde o usa Kaggle.
            </Callout>
          </div>
        )}

        <Callout kind="info">
          <strong>La espera es solo para cargar el modelo.</strong> La
          primera carga tarda entre 5 y 15 minutos. En las siguientes
          ejecuciones de la misma sesión, arranca mucho más rápido.
        </Callout>

        <Callout kind="tip">
          Mientras se carga, puedes ir directo a{" "}
          <strong>Pathfinder Studio</strong>. Ahí ves el progreso en vivo:
          instalación, descarga de modelos y estado final. No necesitas
          quedarte mirando Kaggle ni Colab.
        </Callout>

        {/* ===== Multi-Runtime — info ===== */}
        <div
          style={{
            marginTop: "32px",
            padding: "24px 28px",
            background:
              "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.08))",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            borderRadius: "16px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isLight ? "#6D28D9" : "#A78BFA",
              background: "rgba(139, 92, 246, 0.15)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              padding: "4px 10px",
              borderRadius: "9999px",
              marginBottom: "14px",
            }}
          >
            Multi-Runtime
          </div>
          <h3
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--pf-text-primary, #0A0A0A)",
              margin: 0,
              marginBottom: "12px",
            }}
          >
            Corre dos modelos al mismo tiempo
          </h3>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.9375rem",
              lineHeight: 1.65,
              color: "var(--pf-text-secondary, #525252)",
              margin: 0,
              marginBottom: "12px",
            }}
          >
            Con el plan <strong>Creator</strong> puedes tener LTX en Kaggle
            mientras generas imágenes en Krea o audio en TTS Dual desde
            Colab. Los dos modelos corren en paralelo, dentro de la misma
            interfaz de Pathfinder Studio.
          </p>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.9375rem",
              lineHeight: 1.65,
              color: "var(--pf-text-secondary, #525252)",
              margin: 0,
            }}
          >
            Los notebooks de Colab están desbloqueados solo para Creator y
            Founder. En el plan Free, corres un modelo a la vez desde Kaggle.
          </p>
        </div>

        {/* ===== Tarjeta Premium Creator ===== */}
        <div
          style={{
            position: "relative",
            marginTop: "36px",
            padding: "28px",
            borderRadius: "20px",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            background:
              "linear-gradient(135deg, rgba(139, 92, 246, 0.10), rgba(236, 72, 153, 0.08))",
            overflow: "hidden",
          }}
        >
          {/* Glow decorativo */}
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "260px",
              height: "260px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(236, 72, 153, 0.35), transparent 70%)",
              pointerEvents: "none",
              filter: "blur(20px)",
            }}
          />

          <div style={{ position: "relative" }}>
            {/* Badge de urgencia */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 12px",
                background: isLight
                  ? "rgba(220,38,38,0.08)"
                  : "rgba(220,38,38,0.18)",
                border: isLight
                  ? "1px solid rgba(220,38,38,0.35)"
                  : "1px solid rgba(220,38,38,0.5)",
                borderRadius: "9999px",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.6875rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: isLight ? "#B91C1C" : "#FCA5A5",
                marginBottom: "14px",
              }}
            >
              <Flame size={12} strokeWidth={2.5} />
              Precio de lanzamiento · Quedan 80 días
            </div>

            {/* Título */}
            <div
              style={{
                fontFamily: "var(--pf-font-display, system-ui)",
                fontSize: "1.5rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--pf-text-primary)",
                marginBottom: "10px",
                lineHeight: 1.2,
              }}
            >
              Desbloquea 5 modelos más.<br />
              <span style={{ color: isLight ? "#6D28D9" : "#A5B4FC" }}>
                Corre Kaggle y Colab al mismo tiempo.
              </span>
            </div>

            {/* Copy */}
            <div
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.9375rem",
                color: "var(--pf-text-secondary)",
                lineHeight: 1.55,
                marginBottom: "14px",
                maxWidth: "640px",
              }}
            >
              ¿Quieres sacarle el máximo a Pathfinder? Activa Creator y
              desbloquea todos los workflows, incluidos los modelos nuevos
              que compiten con la industria — más Colab y Multi-Runtime desde
              el primer día.
            </div>

            {/* Precio */}
            <div
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.9375rem",
                color: "var(--pf-text-secondary)",
                lineHeight: 1.55,
                marginBottom: "20px",
                maxWidth: "640px",
              }}
            >
              Sin créditos por generación.{" "}
              <strong style={{ color: "var(--pf-text-primary)" }}>
                $249/mes hasta el 31 dic
              </strong>{" "}
              — después sube a <s style={{ opacity: 0.7 }}>$399/mes</s>.
            </div>

            {/* CTA + microcopy */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/pricing"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 28px",
                  background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 12px 32px -8px rgba(139,92,246,0.8)",
                  whiteSpace: "nowrap",
                }}
              >
                Suscribirme — $249/mes
              </Link>
              <div
                style={{
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.75rem",
                  color: "var(--pf-text-muted)",
                  lineHeight: 1.4,
                }}
              >
                14 días de reembolso. Cancela cuando quieras.
              </div>
            </div>
          </div>
        </div>

      </Block>

      {/* ==================== BLOQUE 04 ==================== */}
      <Block id="step-04" num="04" title="Empieza a crear">
        <p style={{ marginBottom: "20px" }}>
          Cuando el notebook termina de cargar, Pathfinder lo detecta
          automáticamente. En Studio aparece el badge{" "}
          <strong>"● Estación lista"</strong> en verde y el panel de
          generación selecciona el modelo solo.
        </p>

        <Callout kind="info">
          <strong>Los 5 a 15 minutos son SOLO la carga del modelo, no cada
          generación.</strong> A partir de que aparece "Estación lista",
          puedes generar imágenes, audio y video sin parar. Imágenes en
          segundos, videos un poco más según modelo, duración y calidad.
        </Callout>

        <Step>
          Vuelve a la pestaña de Pathfinder → <strong>Studio</strong>.
        </Step>
        <Step>
          Verifica el badge <strong>"● Estación lista"</strong> en verde
          (antes decía "Estación offline").
        </Step>
        <Step>
          El <strong>Floating Command Center</strong> (el panel de
          generación abajo) ya tiene el modelo seleccionado.
        </Step>
        <Step>
          Escribe un prompt, ajusta los parámetros si quieres, y haz clic en{" "}
          <strong>Generar</strong>.
        </Step>
        <Step>
          Cambia de modelo, genera otra cosa, repite. Todo desde Studio.
        </Step>

        <MediaBlock
          type="video"
          label="Cómo crear en Pathfinder Studio"
          url={MEDIA_URLS.step4_create}
        />

        <Callout kind="tip">
          <strong>No tienes que volver a Kaggle ni a Colab.</strong> No
          tienes que refrescar. No tienes que revisar el output del
          notebook. Pathfinder te avisa, te muestra el estado y te deja
          crear.
        </Callout>

        <Callout kind="info">
          Si algo falla, lo verás en Studio. Si quieres forzar un reinicio
          de la estación, puedes volver a Kaggle o Colab y dar{" "}
          <strong>Run All</strong> de nuevo. Pero en la práctica, ya no
          necesitas abrir esas pestañas.
        </Callout>
      </Block>

      {/* ==================== BLOQUE 05 ==================== */}
      <Block id="step-05" num="05" title="Guarda tu trabajo y apaga la estación">
        <p style={{ marginBottom: "20px" }}>
          Al terminar tu jornada hay dos cosas importantes que hacer:
          guardar tus creaciones y apagar la estación. En ese orden.
        </p>

        <SubHeading first>Guarda tu trabajo</SubHeading>
        <p style={{ marginBottom: "20px" }}>
          Mientras tu estación está encendida, tus creaciones viven en la
          sesión. Antes de apagarla, tienes dos formas de conservarlas:
        </p>

        <Step>
          <strong>Descargar a tu computadora.</strong> En el{" "}
          <strong>Floating Command Center</strong>, haz clic en el botón de{" "}
          <strong>Descargar</strong>. El archivo (imagen, video o audio) se
          baja a tu equipo.
        </Step>
        <Step>
          <strong>Guardar en Mis Creaciones.</strong> En el mismo panel, o
          desde la tarjeta de la creación, haz clic en{" "}
          <strong>Guardar</strong>. La creación se sube a la nube de{" "}
          <strong>Cloudflare R2</strong> y queda disponible en{" "}
          <Link
            to="/creations"
            style={{
              color: "var(--pf-text-primary, #0A0A0A)",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Mis Creaciones
          </Link>{" "}
          durante <strong>7 días</strong>.
        </Step>

        <Callout kind="warn">
          <strong>Cuando apagas la estación, la sesión se borra y todos los
          archivos temporales desaparecen.</strong> Si no los descargaste ni
          los guardaste en Mis Creaciones, no se pueden recuperar. Pathfinder
          solo conserva lo que guardaste explícitamente.
        </Callout>

        <SubHeading>Apaga la estación</SubHeading>
        <p style={{ marginBottom: "20px" }}>
          Tienes dos caminos. El primero es el más rápido y no requiere
          abrir Kaggle ni Colab.
        </p>

        <Step>
          <strong>Desde Mi Estación (recomendado).</strong> En Pathfinder, ve
          a <strong>Mi Estación</strong> y haz clic en{" "}
          <strong>Apagar estación</strong> sobre la tarjeta del modelo que
          está encendido. El notebook está preparado para recibir esa orden
          y apagarse solo. Es una sola acción.
        </Step>
        <Step>
          <strong>Manual desde Kaggle.</strong> En la pestaña del notebook,
          haz clic en el menú de los <strong>tres puntos (⋮)</strong> arriba
          a la derecha → <strong>Stop Session</strong>. Si aparece{" "}
          <strong>Disconnect and Delete Runtime</strong>, también sirve.
        </Step>
        <Step>
          <strong>Manual desde Colab.</strong> En el menú superior, ve a{" "}
          <strong>Entorno de ejecución</strong> →{" "}
          <strong>Desconectar y borrar el tiempo de ejecución</strong>.
        </Step>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginTop: "24px",
            marginBottom: "8px",
          }}
        >
          <div>
            <div
              onClick={() =>
                setZoomedImage({
                  url: MEDIA_URLS.step5_shutdown_kaggle,
                  alt: "Kaggle — Stop Session desde el menú de tres puntos",
                })
              }
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid var(--pf-border-subtle, #F4F4F5)",
                background: "var(--pf-bg-secondary, #FAFAFA)",
                cursor: "zoom-in",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px -8px rgba(0,0,0,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <img
                src={MEDIA_URLS.step5_shutdown_kaggle}
                alt="Kaggle — Stop Session desde el menú de tres puntos"
                style={{ width: "100%", display: "block" }}
              />
            </div>
            <div
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.8125rem",
                lineHeight: 1.5,
                color: "var(--pf-text-muted, #A1A1AA)",
                marginTop: "10px",
                textAlign: "center",
              }}
            >
              Kaggle · menú de tres puntos → <strong>Stop session</strong>
            </div>
          </div>

          <div>
            <div
              onClick={() =>
                setZoomedImage({
                  url: MEDIA_URLS.step5_shutdown_colab,
                  alt: "Colab — Desconectar y borrar el tiempo de ejecución",
                })
              }
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid var(--pf-border-subtle, #F4F4F5)",
                background: "var(--pf-bg-secondary, #FAFAFA)",
                cursor: "zoom-in",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px -8px rgba(0,0,0,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <img
                src={MEDIA_URLS.step5_shutdown_colab}
                alt="Colab — Desconectar y borrar el tiempo de ejecución"
                style={{ width: "100%", display: "block" }}
              />
            </div>
            <div
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.8125rem",
                lineHeight: 1.5,
                color: "var(--pf-text-muted, #A1A1AA)",
                marginTop: "10px",
                textAlign: "center",
              }}
            >
              Colab · <strong>Desconectar y borrar el tiempo de ejecución</strong>
            </div>
          </div>
        </div>

        <MediaBlock
          type="video"
          label="Guardar tus creaciones y apagar la estación"
          url={MEDIA_URLS.step5_save_shutdown}
        />

        <Callout kind="info">
          <strong>¿Y si me olvido de apagar?</strong> No pasa nada grave.
          Kaggle y Colab cierran la sesión automáticamente después de
          aproximadamente <strong>1 hora sin generar nada</strong>. Además,
          los notebooks traen un apagado interno de seguridad. La sesión se
          libera sola — solo consume un poco más de tu cuota mientras está
          inactiva.
        </Callout>

        <Callout kind="tip">
          La próxima vez que quieras crear, no necesitas crear cuenta de
          nuevo ni volver a importar el workflow. Solo abres el notebook
          guardado, le das <strong>Run All</strong> y vuelves a Pathfinder
          Studio.
        </Callout>

        <SubHeading>¿Necesitas ayuda?</SubHeading>
        <p style={{ marginBottom: "20px" }}>
          Si te trabas en cualquier paso, puedes{" "}
          <a
            href="/pricing"
            style={{
              color: "var(--pf-text-primary, #0A0A0A)",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            contratar soporte
          </a>{" "}
          y te acompañamos en la configuración, la carga del modelo o
          cualquier problema puntual. No estás solo con la infraestructura.
        </p>
      </Block>

      {/* ==================== BLOQUE 06 ==================== */}
      <Block
        id="step-06"
        num="06"
        title="Por qué puedes confiar en Pathfinder"
      >
        <p style={{ marginBottom: "20px" }}>
          Pathfinder no es una colección de scripts sueltos. Es una
          infraestructura construida, probada y mantenida para que tu
          experiencia sea sólida de principio a fin. Esto es lo que hay
          detrás de cada modelo que ves en Mi Estación:
        </p>

        <Step>
          <strong>Workflows creados desde cero por Pathfinder.</strong> Cada
          pipeline que descargas lo diseñamos nosotros, específicamente para
          funcionar sobre esta infraestructura. No son plantillas genéricas
          ni versiones recicladas: son componentes privados de Pathfinder,
          pensados para tu flujo de trabajo.
        </Step>
        <Step>
          <strong>Probados intensivamente, modelo por modelo.</strong> Antes
          de publicar cualquier workflow, lo corremos de punta a punta:
          instalación, descarga de modelos, generación real y estabilidad en
          condiciones de uso. Solo lo que pasa esas pruebas llega a Mi
          Estación.
        </Step>
        <Step>
          <strong>Los modelos crecen contigo.</strong> Cuando mejoramos un
          modelo o afinamos un pipeline, publicamos la versión nueva. Vuelves
          a descargar el workflow actualizado y ya tienes las mejoras dentro
          de tu estación. Tus flujos no se quedan atrás.
        </Step>
        <Step>
          <strong>Actualizaciones sobre los mismos workflows.</strong> Los
          notebooks no son estáticos. Reciben nuevas capacidades, ajustes de
          rendimiento y mejoras funcionales con el tiempo, sin cambiar la
          forma en que los usas. Tú sigues trabajando igual; por debajo, el
          sistema se sigue refinando.
        </Step>
        <Step>
          <strong>Un solo ciclo para todos los modelos.</strong> Cuando
          integramos un modelo nuevo, se comporta exactamente igual que los
          demás: descargas, lo cargas, le das <strong>Run All</strong> y ves
          el estado en Studio. La infraestructura ya está cerrada y
          uniforme — no tienes que reaprender nada con cada modelo.
        </Step>
        <Step>
          <strong>Infraestructura robusta y monitoreada.</strong> Los
          notebooks incluyen detección de estado, heartbeat automático,
          apagado de seguridad y túneles redundantes. Si algo requiere tu
          atención, Studio te lo comunica con un estado claro y una
          indicación del siguiente paso.
        </Step>
        <Step>
          <strong>Nube y persistencia gestionadas.</strong> Cuando guardas
          una creación, va a Cloudflare R2 y queda en tu cuenta por 7 días.
          El almacenamiento lo corremos nosotros, para que no dependas de tu
          disco ni de la sesión de Kaggle o Colab.
        </Step>
        <Step>
          <strong>Soporte humano cuando lo necesites.</strong> Si algo no
          funciona como esperabas, no estás solo. Puedes contratar soporte y
          te acompañamos hasta resolver el problema.
        </Step>

        <Callout kind="tip">
          <strong>La idea central:</strong> tú aportas la idea y creas.
          Pathfinder pone el resto — workflows propios, modelos
          preconfigurados, nube, monitoreo en vivo, actualizaciones continuas
          y soporte. Kaggle y Colab solo aportan el cómputo; toda la capa de
          Pathfinder es nuestra.
        </Callout>

        <Callout kind="info">
          Si en algún momento sientes que algo no está funcionando como
          debería, revisa primero el estado en <strong>Studio</strong>. Ahí
          verás exactamente en qué paso está tu estación. Si no queda claro,
          el soporte está a un clic.
        </Callout>
      </Block>

      {/* ==================== FAQ ==================== */}
      <section
        style={{
          paddingTop: "60px",
          borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--pf-font-display, system-ui)",
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--pf-text-primary, #0A0A0A)",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <HelpCircle size={28} />
          Preguntas frecuentes
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            {
              q: "¿Por qué Pathfinder no ejecuta los modelos directamente?",
              a: "Ejecutar modelos de IA de alta calidad requiere GPUs costosas. Para mantener Pathfinder accesible, usamos la infraestructura gratuita de Kaggle y Google Colab en lugar de servidores propios. Cuando quieras, enciendes tu estación y generas.",
            },
            {
              q: "¿Cuánto tarda la carga del modelo versus cada generación?",
              a: "La carga inicial del modelo (cuando das Run All por primera vez en una sesión) tarda entre 5 y 15 minutos según el modelo y la plataforma. Ese tiempo es SOLO para preparar el modelo. Una vez que aparece el badge Estación lista, cada generación es rápida: imágenes en segundos, videos un poco más según modelo, duración y calidad. Puedes generar sin parar sin esperar de nuevo.",
            },
            {
              q: "¿Kaggle o Colab? ¿Cuál uso?",
              a: "Depende del modelo. Algunos corren solo en Kaggle, otros solo en Colab. En Mi Estación, cada tarjeta te dice en qué plataforma corre el modelo. Puedes usar ambas al mismo tiempo si tu plan lo permite.",
            },
            {
              q: "¿Es legal usar Kaggle o Colab para generar contenido?",
              a: "Kaggle y Google Colab son infraestructura gratuita diseñada para uso personal. Kaggle y Colab ponen el cómputo — la GPU, el runtime. Pathfinder pone la capa de productividad: workflows, modelos preconfigurados, nube (Cloudflare R2), interfaz de generación, monitoreo de estado en vivo y gestión de tu cuenta. Para uso comercial intensivo, recomendamos el plan Creator, que suma Colab como segunda plataforma y distribuye la carga entre dos proveedores. Los términos de uso de cada plataforma son responsabilidad de cada usuario.",
            },
            {
              q: "¿Qué pasa si la ejecución se pausa o falla?",
              a: "No te quedas solo: Pathfinder Studio te avisa. El badge de tu estación cambia a rojo y aparece la indicación de qué hacer. En la práctica, solo abres Kaggle o Colab, revisas el notebook y das Run All de nuevo. Pathfinder continúa desde donde quedó. Si tras 3 intentos no termina, cierra la sesión y ábrela de nuevo.",
            },
            {
              q: "¿Qué pasa si me olvido de apagar la sesión?",
              a: "Nada grave. Kaggle y Colab cierran la sesión automáticamente después de aproximadamente 1 hora sin generar nada. Además, los notebooks traen un apagado interno de seguridad. La sesión se libera sola y no consume recursos indefinidamente. Si quieres apagarla antes, puedes hacerlo desde Mi Estación con un solo clic.",
            },
            {
              q: "¿Tengo que crear una cuenta nueva cada vez?",
              a: "No. Tu cuenta de Kaggle y tu cuenta de Google (para Colab) son permanentes. Solo las creas una vez. Después, cada vez que quieras usar Pathfinder, abres la plataforma, abres tu workflow y lo ejecutas.",
            },
            {
              q: "¿Tengo que importar el workflow cada vez?",
              a: "No. Una vez importado, el workflow queda guardado en tu cuenta de Kaggle (o en tu Drive para Colab). La próxima vez que entres, lo abres desde tu lista y lo ejecutas directamente.",
            },
            {
              q: "¿Puedo tener varios modelos cargados al mismo tiempo?",
              a: "Sí, pero cada modelo consume una sesión de cómputo. Para uso normal, te recomendamos cargar solo el modelo que vas a usar en ese momento. Cambiar de modelo es rápido si cierras uno y abres otro.",
            },
            {
              q: "¿Por qué mis creaciones desaparecen de Pathfinder?",
              a: "Las creaciones que guardas en Mis Creaciones se conservan 7 días desde que las guardas. Después se eliminan automáticamente. Descárgalas antes si quieres conservarlas a largo plazo. Las creaciones que no guardaste desaparecen cuando apagas la estación.",
            },
            {
              q: "¿Dónde pido soporte si me trabo?",
              a: "Puedes contratar soporte desde /pricing. Te acompañamos en la configuración inicial, la carga del modelo, o cualquier problema puntual con tu estación.",
            },
            {
              q: "¿Cuánto cuesta usar Kaggle o Colab?",
              a: "Nada. Ambas plataformas son gratuitas. Kaggle te da 30 horas de GPU por semana, Colab asigna GPUs T4 según disponibilidad. Más que suficiente para uso normal.",
            },
          ].map((f, i) => (
            <details
              key={i}
              style={{
                background: "var(--pf-bg-elevated)",
                border: "1px solid var(--pf-border-subtle, #F4F4F5)",
                borderRadius: "12px",
                padding: "20px 24px",
              }}
            >
              <summary
                style={{
                  fontFamily: "var(--pf-font-display, system-ui)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "var(--pf-text-primary, #0A0A0A)",
                  cursor: "pointer",
                  listStyle: "none",
                }}
              >
                {f.q}
              </summary>
              <p
                style={{
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.9375rem",
                  lineHeight: 1.6,
                  color: "var(--pf-text-secondary, #525252)",
                  margin: 0,
                  marginTop: "12px",
                }}
              >
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ==================== DISCLAIMER LEGAL ==================== */}
      <section
        style={{
          marginTop: "40px",
          padding: "0 4px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.75rem",
            color: "var(--pf-text-muted, #A1A1AA)",
            lineHeight: 1.6,
            textAlign: "center",
            margin: 0,
            maxWidth: "720px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <strong style={{ color: "var(--pf-text-secondary, #525252)" }}>
            Aviso legal.
          </strong>{" "}
          Pathfinder Studio no está afiliado a Kaggle ni a Google Colab. El uso
          de esas plataformas está sujeto a sus propios Términos de Servicio.
          Pathfinder provee la capa de orquestación, workflows, modelos
          preconfigurados y almacenamiento. No controlamos ni somos responsables
          de la disponibilidad, seguridad o cambios de política de Kaggle o
          Colab.
        </p>
      </section>

      {/* ==================== CTA FINAL ==================== */}
      <section
        style={{
          marginTop: "60px",
          padding: "40px 32px",
          background: "#0A0A0A",
          color: "#FFFFFF",
          borderRadius: "20px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--pf-font-display, system-ui)",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: 0,
            marginBottom: "16px",
            color: "#FFFFFF",
          }}
        >
          {hasViewedBefore
            ? "¿Listo para seguir creando?"
            : "¿Listo para empezar?"}
        </h2>
        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "1rem",
            color: "rgba(255,255,255,0.7)",
            marginBottom: "28px",
            maxWidth: "520px",
            margin: "0 auto 28px",
            lineHeight: 1.5,
          }}
        >
          {hasViewedBefore
            ? "Recuerda que cada vez que quieras usar un modelo, tienes que encender tu estación desde Kaggle o Colab."
            : "Ya conoces el proceso. Ahora sí, vamos a crear."}
        </p>

        {session ? (
          <button
            onClick={handleComplete}
            disabled={isMarking}
            style={{
              padding: "16px 40px",
              background: "#FFFFFF",
              color: "#0A0A0A",
              border: "none",
              borderRadius: "9999px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: isMarking ? "wait" : "pointer",
              opacity: isMarking ? 0.7 : 1,
            }}
          >
            {isMarking
              ? "Cargando..."
              : hasViewedBefore
              ? "Ir al Studio"
              : "Entendido, ir al Studio"}
          </button>
        ) : (
          <Link
            to="/auth"
            style={{
              display: "inline-block",
              textDecoration: "none",
              padding: "16px 40px",
              background: "#FFFFFF",
              color: "#0A0A0A",
              borderRadius: "9999px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              fontWeight: 700,
            }}
          >
            Crear cuenta gratis
          </Link>
        )}
      </section>

      {/* ==================== LIGHTBOX ==================== */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.88)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            cursor: "zoom-out",
            animation: "pf-lightbox-fade 0.15s ease",
          }}
        >
          <button
            onClick={() => setZoomedImage(null)}
            aria-label="Cerrar"
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              fontSize: "22px",
              lineHeight: 1,
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
          >
            ×
          </button>
          <img
            src={zoomedImage.url}
            alt={zoomedImage.alt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "8px",
              boxShadow: "0 24px 80px -12px rgba(0, 0, 0, 0.6)",
              cursor: "default",
            }}
          />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// HowItWorksPage — wrapper público con MarketingLayout
// ---------------------------------------------------------------------------
const HowItWorksPage: React.FC = () => (
  <MarketingLayout>
    <HowItWorksContent />
  </MarketingLayout>
);

export default HowItWorksPage;
