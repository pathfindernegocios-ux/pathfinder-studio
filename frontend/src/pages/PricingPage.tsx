// src/pages/PricingPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  FlaskConical,
  Gauge,
  RefreshCw,
  Flame,
  ShieldCheck,
  RotateCcw,
  XCircle,
  Infinity as InfinityIcon,
  Layers,
  Clock,
  Boxes,
  Check,
  Minus,
} from "lucide-react";
import PathfinderLogo from "../components/PathfinderLogo";
import MarketingLayout from "../components/marketing/MarketingLayout";
import { useAuth } from "../hooks/useAuth";
import { useModels } from "../hooks/useModels";
import { usePurchase, type PlanId } from "../hooks/usePurchase";
import { setPostAuthRedirect } from "../lib/postAuthRedirect";

// ============================================================
// CONSTANTS
// ============================================================
const LAUNCH_DEADLINE = new Date("2026-12-31T23:59:59-06:00");

// ============================================================
// COUNTDOWN HOOK
// ============================================================
function useCountdown(target: Date) {
  const [remaining, setRemaining] = useState(() => target.getTime() - Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(target.getTime() - Date.now());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [target]);

  if (remaining <= 0) return null;

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return { days, hours };
}

// ============================================================
// COUNTDOWN BAR (agresiva)
// ============================================================
const CountdownBar: React.FC = () => {
  const countdown = useCountdown(LAUNCH_DEADLINE);
  if (!countdown) return null;

  const { days, hours } = countdown;
  const pad = (n: number) => n.toString().padStart(2, "0");

  const scrollToPlans = () => {
    const el = document.getElementById("planes");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      style={{
        position: "relative",
        background:
          "linear-gradient(90deg, #7C2D12 0%, #B45309 40%, #DC2626 100%)",
        color: "#FFFFFF",
        padding: "14px 20px",
        textAlign: "center",
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "0.9375rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
        overflow: "hidden",
        boxShadow: "0 8px 24px -12px rgba(220, 38, 38, 0.6)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          flexWrap: "wrap",
          zIndex: 1,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <Flame size={18} strokeWidth={2.5} />
          <span style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.8125rem" }}>
            Precio de lanzamiento
          </span>
        </span>

        <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>

        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: "4px",
              background: "rgba(0,0,0,0.25)",
              padding: "3px 10px",
              borderRadius: "6px",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontWeight: 800,
              fontSize: "0.9375rem",
              letterSpacing: "0.02em",
            }}
          >
            {pad(days)}
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, opacity: 0.75 }}>DÍAS</span>
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: "4px",
              background: "rgba(0,0,0,0.25)",
              padding: "3px 10px",
              borderRadius: "6px",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontWeight: 800,
              fontSize: "0.9375rem",
              letterSpacing: "0.02em",
            }}
          >
            {pad(hours)}
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, opacity: 0.75 }}>HRS</span>
          </span>
        </span>

        <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>

        <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, fontSize: "0.875rem" }}>
          Después sube a <s style={{ opacity: 0.7 }}>$399</s> <strong>$249</strong>/mes
        </span>

        <button
          onClick={scrollToPlans}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#FFFFFF",
            color: "#7C2D12",
            border: "none",
            padding: "6px 14px",
            borderRadius: "8px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: "0 4px 12px -4px rgba(0,0,0,0.4)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 16px -4px rgba(0,0,0,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px -4px rgba(0,0,0,0.4)";
          }}
        >
          Asegurar precio
        </button>
      </div>
    </div>
  );
};

// ============================================================
// TRUST ROW
// ============================================================
const TrustRow: React.FC = () => {
  const items = [
    { Icon: ShieldCheck, label: "Pago seguro con Stripe" },
    { Icon: RotateCcw, label: "14 días de reembolso" },
    { Icon: XCircle, label: "Cancela cuando quieras" },
    { Icon: InfinityIcon, label: "Sin créditos por imagen o video" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "12px 28px",
        padding: "24px 24px 8px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      {items.map(({ Icon, label }, i) => (
        <div
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.8125rem",
            color: "rgba(255,255,255,0.55)",
            fontWeight: 500,
          }}
        >
          <Icon size={14} strokeWidth={2.25} style={{ color: "rgba(34, 211, 238, 0.85)" }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// PLAN CARD
// ============================================================
interface PlanCategory {
  title: string;
  items: string[];
}

interface PlanProps {
  name: string;
  tagline: string;
  price: string;
  priceSuffix?: string;
  priceNote?: string;
  priceStrikethrough?: string;
  discountBadge?: string;
  categories: PlanCategory[];
  cta: React.ReactNode;
  ctaFootnote?: string;
  highlighted?: boolean;
  featured?: boolean;
  badge?: string;
  accent: { from: string; to: string; text: string };
  showCube?: boolean;
  disclaimer?: string;
}

const PlanCard: React.FC<PlanProps> = ({
  name,
  tagline,
  price,
  priceSuffix,
  priceNote,
  priceStrikethrough,
  discountBadge,
  categories,
  cta,
  ctaFootnote,
  highlighted,
  featured,
  badge,
  accent,
  showCube,
  disclaimer,
}) => {
  return (
    <div
      style={{
        position: "relative",
        background: "var(--pf-bg-elevated)",
        border: highlighted || featured ? "1px solid transparent" : "1px solid var(--pf-border-subtle)",
        borderRadius: "24px",
        padding: "36px 28px 28px 28px",
        display: "flex",
        flexDirection: "column",
        boxShadow: featured
          ? `0 0 80px -15px ${accent.from}88, 0 24px 48px -12px rgba(0,0,0,0.18)`
          : highlighted
            ? `0 0 60px -15px ${accent.from}66, 0 20px 40px -12px rgba(0,0,0,0.12)`
            : "0 2px 8px rgba(0,0,0,0.03)",
        transition: "transform 0.2s, box-shadow 0.2s",
        backgroundImage:
          highlighted || featured
            ? `linear-gradient(var(--pf-bg-elevated), var(--pf-bg-elevated)), linear-gradient(135deg, ${accent.from}, ${accent.to})`
            : undefined,
        backgroundOrigin: highlighted || featured ? "border-box" : undefined,
        backgroundClip: highlighted || featured ? "padding-box, border-box" : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = featured
          ? `0 0 100px -15px ${accent.from}aa, 0 28px 56px -12px rgba(0,0,0,0.22)`
          : highlighted
            ? `0 0 80px -15px ${accent.from}88, 0 24px 48px -12px rgba(0,0,0,0.18)`
            : "0 12px 24px -8px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = featured
          ? `0 0 80px -15px ${accent.from}88, 0 24px 48px -12px rgba(0,0,0,0.18)`
          : highlighted
            ? `0 0 60px -15px ${accent.from}66, 0 20px 40px -12px rgba(0,0,0,0.12)`
            : "0 2px 8px rgba(0,0,0,0.03)";
      }}
    >
      {showCube && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            filter: `drop-shadow(0 0 12px ${accent.from})`,
            opacity: 0.9,
          }}
        >
          <PathfinderLogo size={28} />
        </div>
      )}

      {badge && (
        <div
          style={{
            position: "absolute",
            top: "-14px",
            left: "28px",
            padding: "6px 14px",
            background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
            color: "#FFFFFF",
            borderRadius: "9999px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.6875rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            boxShadow: `0 4px 12px -4px ${accent.from}88`,
          }}
        >
          {badge}
        </div>
      )}

      {discountBadge && (
        <div
          style={{
            position: "absolute",
            top: "-14px",
            right: "28px",
            padding: "6px 12px",
            background: "#DC2626",
            color: "#FFFFFF",
            borderRadius: "9999px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.6875rem",
            fontWeight: 800,
            letterSpacing: "0.04em",
            boxShadow: "0 4px 12px -4px rgba(220, 38, 38, 0.6)",
          }}
        >
          {discountBadge}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: accent.text,
              boxShadow: `0 0 8px ${accent.text}99`,
              flexShrink: 0,
            }}
          />
          <h3
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "var(--pf-text-primary)",
            }}
          >
            {name}
          </h3>
        </div>
        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.8125rem",
            color: "var(--pf-text-secondary)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {tagline}
        </p>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "2.75rem",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--pf-text-primary)",
              lineHeight: 1,
            }}
          >
            {price}
          </span>
          {priceSuffix && (
            <span
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.8125rem",
                color: "var(--pf-text-muted)",
                fontWeight: 500,
              }}
            >
              {priceSuffix}
            </span>
          )}
          {priceStrikethrough && (
            <span
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.9375rem",
                color: "var(--pf-text-muted)",
                textDecoration: "line-through",
                fontWeight: 500,
                marginLeft: "6px",
              }}
            >
              {priceStrikethrough}
            </span>
          )}
        </div>
        {priceNote && (
          <div
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.75rem",
              color: "var(--pf-text-muted)",
              marginTop: "6px",
              lineHeight: 1.5,
            }}
          >
            {priceNote}
          </div>
        )}
      </div>

      <div
        style={{
          height: "1px",
          background: "var(--pf-border-subtle)",
          marginBottom: "20px",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, marginBottom: "28px" }}>
        {categories.map((cat, ci) => (
          <div key={ci}>
            <div
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.625rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: accent.text,
                opacity: 0.8,
                marginBottom: "10px",
              }}
            >
              {cat.title}
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {cat.items.map((item, ii) => (
                <li
                  key={ii}
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.8125rem",
                    color: "var(--pf-text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: "8px",
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: accent.text,
                      opacity: 0.7,
                    }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {disclaimer && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px 12px",
            background: "var(--pf-bg-secondary)",
            border: "1px solid var(--pf-border-subtle)",
            borderRadius: "8px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.6875rem",
            color: "var(--pf-text-muted)",
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          {disclaimer}
        </div>
      )}

      {cta}

      {ctaFootnote && (
        <div
          style={{
            marginTop: "12px",
            textAlign: "center",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.75rem",
            color: "var(--pf-text-muted)",
            lineHeight: 1.5,
          }}
        >
          {ctaFootnote}
        </div>
      )}
    </div>
  );
};

// ============================================================
// STATUS BANNER (post-checkout)
// ============================================================
const StatusBanner: React.FC<{
  type: "success" | "cancelled";
  onDismiss: () => void;
}> = ({ type, onDismiss }) => {
  const isSuccess = type === "success";
  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto 24px",
        padding: "16px 20px",
        background: isSuccess ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
        border: `1px solid ${isSuccess ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"}`,
        borderRadius: "12px",
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "0.9375rem",
        color: isSuccess ? "#059669" : "#B45309",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        lineHeight: 1.5,
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: isSuccess ? "#10B981" : "#F59E0B",
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1 }}>
        {isSuccess
          ? "Pago confirmado. Estamos activando tu acceso al Estudio. Puede tardar unos segundos."
          : "Cancelaste el proceso de pago. Puedes intentarlo de nuevo cuando quieras."}
      </span>
      <button
        onClick={onDismiss}
        style={{
          background: "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          fontSize: "1rem",
          padding: "0 4px",
          opacity: 0.6,
        }}
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
};

// ============================================================
// MULTI-RUNTIME BLOCK
// ============================================================
const MultiRuntimeBlock: React.FC = () => {
  const items = [
    {
      Icon: Layers,
      title: "Kaggle + Colab, a la vez",
      body: "Dos runtimes en paralelo desde la misma cuenta. Uno genera video, el otro puede estar procesando imagen o audio.",
      color: "#22D3EE",
    },
    {
      Icon: Clock,
      title: "+5 a 8 horas diarias",
      body: "Las horas de Google Colab se suman a las 120 h/mes de tu plan. Más margen para crear sin tocar el límite semanal.",
      color: "#A5B4FC",
    },
    {
      Icon: Boxes,
      title: "3 modelos en Colab",
      body: "Qwen Image 2.1, Krea 2 Turbo y TTS Dual ya tienen versión Colab lista para correr desde tu cuenta.",
      color: "#34D399",
    },
  ];

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "#050505",
        borderTop: "1px solid rgba(139, 92, 246, 0.1)",
        borderBottom: "1px solid rgba(139, 92, 246, 0.1)",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(34, 211, 238, 0.1)",
              border: "1px solid rgba(34, 211, 238, 0.3)",
              borderRadius: "9999px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#67E8F9",
              marginBottom: "20px",
            }}
          >
            <Layers size={12} strokeWidth={2.5} />
            Nuevo en Creator y Founder
          </div>
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: "16px",
              color: "#FFFFFF",
            }}
          >
            Genera video e imagen al mismo tiempo.
          </h2>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.6,
              margin: 0,
              maxWidth: "640px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Tu cuenta ya no está atada a un solo runtime. Mientras una estación
            genera video, puedes levantar Qwen Image 2.1 o TTS Dual en Google
            Colab — sin pagar dos suscripciones, sin pelear con entornos.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {items.map(({ Icon, title, body, color }, i) => (
            <div
              key={i}
              style={{
                padding: "28px 24px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: `${color}14`,
                  border: `1px solid ${color}40`,
                  color,
                  marginBottom: "18px",
                  boxShadow: `0 0 20px -8px ${color}80`,
                }}
              >
                <Icon size={20} strokeWidth={2} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--pf-font-display, system-ui)",
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: "8px",
                  color: "#FFFFFF",
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.6)",
                  margin: 0,
                }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================
// COMPARISON TABLE
// ============================================================
const ComparisonTable: React.FC = () => {
  const rows: Array<{ label: string; free: string | boolean; creator: string | boolean; founder: string | boolean }> = [
    { label: "GPU de Kaggle y Colab bajo demanda", free: true, creator: true, founder: true },
    { label: "Horas de estación / mes", free: "120", creator: "120", founder: "120 × 6" },
    { label: "Multi-runtime con Colab", free: false, creator: true, founder: true },
    { label: "Imagen: Krea 2 Turbo", free: true, creator: true, founder: true },
    { label: "Imagen: Flux 2 · Qwen 2.1", free: false, creator: true, founder: true },
    { label: "Video: Wan 2.1 (i2v + t2v)", free: true, creator: true, founder: true },
    { label: "Video: LTX 2.3 · LTX 2.5 MSR", free: false, creator: true, founder: true },
    { label: "Audio: OmniVoice + Index TTS", free: false, creator: true, founder: true },
    { label: "Mis Creaciones · retención", free: "7 días", creator: "7 días", founder: "7 días" },
    { label: "Acceso anticipado a nuevos modelos", free: false, creator: false, founder: true },
    { label: "Soporte", free: "Estándar", creator: "Prioritario", founder: "Directo" },
  ];

  const renderCell = (v: string | boolean, color: string) => {
    if (v === true) return <Check size={18} strokeWidth={2.5} style={{ color }} />;
    if (v === false) return <Minus size={18} strokeWidth={2} style={{ color: "rgba(255,255,255,0.25)" }} />;
    return <span style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.8125rem", color: "rgba(255,255,255,0.75)" }}>{v}</span>;
  };

  return (
    <section style={{ padding: "80px 24px", background: "#000000" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--pf-font-display, system-ui)",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            textAlign: "center",
            margin: 0,
            marginBottom: "12px",
            color: "#FFFFFF",
          }}
        >
          Compara los planes
        </h2>
        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.9375rem",
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            margin: "0 auto 40px",
            lineHeight: 1.55,
            maxWidth: "520px",
          }}
        >
          Free para probar. Creator para el Estudio completo. Founder para 6 meses congelados y acceso prioritario.
        </p>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.015)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "640px",
              fontFamily: "var(--pf-font-ui, system-ui)",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "18px 20px",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.4)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  Característica
                </th>
                {[
                  { name: "Free", color: "#22D3EE" },
                  { name: "Creator", color: "#A5B4FC" },
                  { name: "Founder", color: "#C4B5FD" },
                ].map((c) => (
                  <th
                    key={c.name}
                    style={{
                      textAlign: "center",
                      padding: "18px 20px",
                      fontSize: "0.8125rem",
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                      color: c.color,
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontSize: "0.875rem",
                      color: "rgba(255,255,255,0.8)",
                      fontWeight: 500,
                    }}
                  >
                    {row.label}
                  </td>
                  <td style={{ textAlign: "center", padding: "14px 20px" }}>{renderCell(row.free, "#22D3EE")}</td>
                  <td style={{ textAlign: "center", padding: "14px 20px" }}>{renderCell(row.creator, "#A5B4FC")}</td>
                  <td style={{ textAlign: "center", padding: "14px 20px" }}>{renderCell(row.founder, "#C4B5FD")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

// ============================================================
// VALUE STACK BLOCK
// ============================================================
const ValueStackBlock: React.FC = () => {
  const items = [
    { label: "GPU Kaggle + Colab · 120 h/mes", value: "$1,200" },
    { label: "Colab extra · 5 a 8 h/día", value: "$400" },
    { label: "Catálogo de 10 modelos IA", value: "$800" },
    { label: "Multi-runtime simultáneo", value: "$300" },
    { label: "Mis Creaciones · 7 días", value: "$200" },
  ];

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "#050505",
        borderTop: "1px solid rgba(139, 92, 246, 0.1)",
      }}
    >
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--pf-font-display, system-ui)",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            textAlign: "center",
            margin: 0,
            marginBottom: "12px",
            color: "#FFFFFF",
          }}
        >
          Lo que obtienes en Creator
        </h2>
        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.9375rem",
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            margin: "0 auto 36px",
            lineHeight: 1.55,
          }}
        >
          Valorado por separado, cada componente tiene un precio. Juntos, son una sola suscripción.
        </p>

        <div
          style={{
            padding: "28px 28px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
          }}
        >
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "16px",
                padding: "10px 0",
                borderBottom: i < items.length - 1 ? "1px dashed rgba(255,255,255,0.08)" : "none",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.9375rem",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.7)" }}>{it.label}</span>
              <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{it.value}</span>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "16px",
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(255,255,255,0.15)",
              fontFamily: "var(--pf-font-ui, system-ui)",
            }}
          >
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF" }}>Valor total</span>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.45)",
                textDecoration: "line-through",
              }}
            >
              $2,900
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "16px",
              marginTop: "8px",
              fontFamily: "var(--pf-font-ui, system-ui)",
            }}
          >
            <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "#A5B4FC" }}>Pagas</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#A5B4FC", letterSpacing: "-0.02em" }}>
              $249 <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>MXN/mes</span>
            </span>
          </div>
        </div>

        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            marginTop: "16px",
            lineHeight: 1.5,
          }}
        >
          Valores de referencia. No representan servicios de terceros.
        </p>
      </div>
    </section>
  );
};

// ============================================================
// SIGNATURE BLOCK
// ============================================================
const SignatureBlock: React.FC = () => {
  const steps = [
    {
      Icon: Search,
      title: "Investigación",
      body: "Seguimos las últimas tecnologías del sector IA y las traducimos en workflows competitivos.",
    },
    {
      Icon: FlaskConical,
      title: "Validación",
      body: "Llevamos cada modelo a pruebas reales hasta que cumple con el estándar Pathfinder.",
    },
    {
      Icon: Gauge,
      title: "Optimización",
      body: "Llevamos cada workflow al límite de la plataforma donde corre.",
    },
    {
      Icon: RefreshCw,
      title: "Evolución",
      body: "Renovamos el catálogo a medida que avanza la tecnología.",
    },
  ];

  return (
    <section
      style={{
        padding: "64px 24px 56px",
        background: "#050505",
        borderTop: "1px solid rgba(139, 92, 246, 0.1)",
        borderBottom: "1px solid rgba(139, 92, 246, 0.1)",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--pf-font-display, system-ui)",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            textAlign: "center",
            margin: 0,
            marginBottom: "8px",
            color: "#FFFFFF",
          }}
        >
          Pathfinder ingeniería a tu medida
        </h2>
        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.9375rem",
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            maxWidth: "520px",
            margin: "0 auto 48px",
            lineHeight: 1.55,
          }}
        >
          Cada modelo, cada workflow, cada preset — pasa por nuestro proceso antes de llegar a tus manos.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "32px 24px",
          }}
        >
          {steps.map((s, i) => (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(34, 211, 238, 0.08)",
                  border: "1px solid rgba(34, 211, 238, 0.25)",
                  color: "#67E8F9",
                  marginBottom: "16px",
                  boxShadow: "0 0 20px -8px rgba(34, 211, 238, 0.5)",
                }}
              >
                <s.Icon size={20} strokeWidth={2} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--pf-font-display, system-ui)",
                  fontSize: "1rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: "8px",
                  color: "#FFFFFF",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.6)",
                  margin: 0,
                }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================
// NEW MODELS BLOCK
// ============================================================
const NewModelsBlock: React.FC = () => (
  <section style={{ padding: "80px 24px", background: "#000000" }}>
    <div style={{ maxWidth: "780px", margin: "0 auto", textAlign: "center" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "72px",
          height: "72px",
          marginBottom: "24px",
          filter: "drop-shadow(0 0 24px rgba(34, 211, 238, 0.55))",
        }}
      >
        <PathfinderLogo size={72} />
      </div>
      <h2
        style={{
          fontFamily: "var(--pf-font-display, system-ui)",
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          margin: 0,
          marginBottom: "16px",
          color: "#FFFFFF",
        }}
      >
        Los modelos nuevos entran a tu plan sin costo extra
      </h2>
      <p
        style={{
          fontFamily: "var(--pf-font-ui, system-ui)",
          fontSize: "1.0625rem",
          color: "rgba(255,255,255,0.65)",
          lineHeight: 1.6,
          margin: 0,
          maxWidth: "620px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Cuando agregamos un modelo nuevo al catálogo de Pathfinder, entra
        automáticamente a tu plan Creator o Founder. No pagas por separado, no
        necesitas una nueva suscripción. El catálogo crece contigo.
      </p>
    </div>
  </section>
);

// ============================================================
// FAIR USE POLICY BLOCK
// ============================================================
const FairUsePolicy: React.FC = () => {
  const platforms = [
    {
      name: "Kaggle",
      color: "#20BEFF",
      items: [
        "30 horas de GPU por semana",
        "Reset los sábados a medianoche UTC",
        "Si agotas la cuota, esperas al reset",
      ],
    },
    {
      name: "Google Colab",
      color: "#F9AB00",
      items: [
        "Sesiones de hasta 12 horas",
        "Disponibilidad variable según demanda",
        "Sin cuota fija publicada por Google",
      ],
    },
  ];

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "#050505",
        borderTop: "1px solid rgba(139, 92, 246, 0.1)",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "9999px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#6EE7B7",
              marginBottom: "20px",
            }}
          >
            <ShieldCheck size={12} strokeWidth={2.5} />
            Uso justo
          </div>
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: "16px",
              color: "#FFFFFF",
            }}
          >
            Límites claros, sin sorpresas.
          </h2>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.6,
              margin: 0,
              maxWidth: "640px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Pathfinder corre sobre la infraestructura gratuita de Kaggle y
            Google Colab. Cada plataforma tiene sus propias reglas de uso. Aquí
            las explicamos con transparencia para que sepas exactamente qué
            esperar.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          {platforms.map((p) => (
            <div
              key={p.name}
              style={{
                padding: "28px 24px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: p.color,
                    boxShadow: `0 0 10px ${p.color}99`,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--pf-font-display, system-ui)",
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "#FFFFFF",
                  }}
                >
                  {p.name}
                </span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {p.items.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      fontFamily: "var(--pf-font-ui, system-ui)",
                      fontSize: "0.875rem",
                      color: "rgba(255,255,255,0.7)",
                      lineHeight: 1.55,
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        marginTop: "7px",
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: p.color,
                        opacity: 0.8,
                      }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.8125rem",
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: "720px",
            margin: "0 auto",
          }}
        >
          Los límites son de Kaggle y Google Colab, no de Pathfinder. Pathfinder
          no controla ni es responsable de cambios en sus políticas de uso. Con
          Multi-Runtime (Creator y Founder) puedes usar ambas plataformas en
          paralelo para maximizar tu capacidad total.
        </p>
      </div>
    </section>
  );
};

// ============================================================
// ROADMAP BLOCK
// ============================================================
const RoadmapBlock: React.FC = () => {
  const items = [
    {
      Icon: Layers,
      title: "Infraestructura dedicada",
      body: "Estamos migrando a GPUs propias para eliminar los límites de plataformas de terceros. Sesiones más largas, sin cuotas externas.",
    },
    {
      Icon: Clock,
      title: "Pago por uso",
      body: "Planes por créditos para quienes generan de forma intensiva, con precios alineados al costo real de la GPU.",
    },
    {
      Icon: Boxes,
      title: "Storage extendido",
      body: "Retención de creaciones más larga y proyectos persistentes en la nube de Pathfinder.",
    },
  ];

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "#050505",
        borderTop: "1px solid rgba(139, 92, 246, 0.1)",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(139, 92, 246, 0.1)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "9999px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#C4B5FD",
              marginBottom: "20px",
            }}
          >
            Próximamente
          </div>
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: "16px",
              color: "#FFFFFF",
            }}
          >
            Lo que viene en Pathfinder
          </h2>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.6,
              margin: 0,
              maxWidth: "640px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Hoy Pathfinder corre sobre infraestructura gratuita. La siguiente
            etapa elimina las limitaciones de plataformas de terceros y lleva el
            producto a un estándar industrial.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {items.map(({ Icon, title, body }, i) => (
            <div
              key={i}
              style={{
                padding: "28px 24px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(139, 92, 246, 0.12)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  color: "#C4B5FD",
                  marginBottom: "18px",
                }}
              >
                <Icon size={20} strokeWidth={2} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--pf-font-display, system-ui)",
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: "8px",
                  color: "#FFFFFF",
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.6)",
                  margin: 0,
                }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================
// LEGAL DISCLAIMER
// ============================================================
const LegalDisclaimer: React.FC = () => (
  <section style={{ padding: "40px 24px", background: "#000000" }}>
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <p
        style={{
          fontFamily: "var(--pf-font-ui, system-ui)",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.4)",
          lineHeight: 1.6,
          textAlign: "center",
          margin: 0,
        }}
      >
        <strong style={{ color: "rgba(255,255,255,0.55)" }}>Aviso legal.</strong>{" "}
        Pathfinder Studio no está afiliado a Kaggle ni a Google Colab. El uso de
        esas plataformas está sujeto a sus propios Términos de Servicio.
        Pathfinder provee la capa de orquestación, workflows, modelos
        preconfigurados y almacenamiento. No controlamos ni somos responsables
        de la disponibilidad, seguridad o cambios de política de Kaggle o
        Colab.
      </p>
    </div>
  </section>
);

// ============================================================
// PRICING PAGE
// ============================================================
const PricingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const { unlockedIds, refresh: refreshModels } = useModels();
  const { error: purchaseError, loadingPlan, startCheckout } = usePurchase();

  const status = searchParams.get("status");
  const [showBanner, setShowBanner] = useState(false);

  const hasCreator = unlockedIds.has("flux-2-klein-4b");
  const hasFounder = false; // TODO: chequear Founder activo

  useEffect(() => {
    if (status === "success" || status === "cancelled") {
      setShowBanner(true);

      if (status === "success") {
        const delays = [1000, 3000, 6000, 10000];
        const timers = delays.map((d) =>
          window.setTimeout(() => {
            refreshModels();
          }, d),
        );
        return () => timers.forEach((t) => window.clearTimeout(t));
      }
    }
  }, [status, refreshModels]);

  const handleDismissBanner = () => {
    setShowBanner(false);
    const next = new URLSearchParams(searchParams);
    next.delete("status");
    next.delete("plan");
    setSearchParams(next, { replace: true });
  };

  const handleSelectPlan = (planId: PlanId) => {
    if (!session) {
      setPostAuthRedirect("/pricing");
      window.location.href = "/auth";
      return;
    }
    startCheckout(planId);
  };

  return (
    <MarketingLayout>
      <div className="pf-legacy">
      <CountdownBar />

      {/* Hero */}
      <section style={{ padding: "64px 24px 24px", textAlign: "center", background: "#000000" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h1
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              margin: 0,
              marginBottom: "20px",
              color: "#FFFFFF",
            }}
          >
            Pathfinder para todos
          </h1>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1.0625rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            Una estación con GPU gratuita de Kaggle y Colab, workflows listos
            y catálogo completo de modelos IA. Sin créditos por generación.
            Límites transparentes.
          </p>
        </div>
      </section>

      <TrustRow />

      {showBanner && status && (status === "success" || status === "cancelled") && (
        <div style={{ padding: "24px 24px 0" }}>
          <StatusBanner type={status} onDismiss={handleDismissBanner} />
        </div>
      )}

      {purchaseError && (
        <div style={{ padding: "24px 24px 0" }}>
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              padding: "16px 20px",
              background: "#FEF2F2",
              border: "1px solid #FEE2E2",
              borderRadius: "12px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.9375rem",
              color: "#EF4444",
              lineHeight: 1.5,
            }}
          >
            {purchaseError}
          </div>
        </div>
      )}

      {/* Plans */}
      <section id="planes" style={{ padding: "40px 24px 80px", background: "#000000" }}>
        <div
          style={{
            maxWidth: "1140px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {/* Plan Free */}
          <PlanCard
            name="Free"
            tagline="Descubre qué puedes crear."
            price="$0"
            priceSuffix="· sin vencimiento"
            accent={{ from: "#22D3EE", to: "#06B6D4", text: "#22D3EE" }}
            badge="Prueba Pathfinder"
            categories={[
              {
                title: "Incluido",
                items: [
                  "3 modelos de entrada",
                  "Studio + Mis Creaciones",
                  "Retención 7 días",
                  "Guía de inicio",
                ],
              },
              {
                title: "Estación",
                items: ["120 h/mes · 30 por semana"],
              },
            ]}
            disclaimer="Los modelos del plan Free están sujetos a disponibilidad. Para el Estudio completo, multi-runtime y todos los modelos, elige Creator o Founder."
            cta={
              session ? (
                <Link
                  to="/studio"
                  style={{
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                    padding: "12px 24px",
                    background: "transparent",
                    color: "var(--pf-text-primary)",
                    border: "1px solid var(--pf-border-default)",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--pf-bg-secondary)";
                    e.currentTarget.style.borderColor = "#22D3EE";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "var(--pf-border-default)";
                  }}
                >
                  Ir al Studio
                </Link>
              ) : (
                <Link
                  to="/auth"
                  style={{
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                    padding: "12px 24px",
                    background: "transparent",
                    color: "var(--pf-text-primary)",
                    border: "1px solid var(--pf-border-default)",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--pf-bg-secondary)";
                    e.currentTarget.style.borderColor = "#22D3EE";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "var(--pf-border-default)";
                  }}
                >
                  Empezar gratis
                </Link>
              )
            }
          />

          {/* Plan Creator */}
          <PlanCard
            name="Creator"
            tagline="El Estudio completo."
            price="$249"
            priceSuffix="MXN · por mes"
            priceStrikethrough="$399"
            priceNote="Oferta hasta el 31 dic 2026. Después, $399/mes."
            discountBadge="-38%"
            badge="Más popular"
            highlighted
            showCube
            accent={{ from: "#6366F1", to: "#8B5CF6", text: "#A5B4FC" }}
            categories={[
              {
                title: "Estación",
                items: [
                  "GPU de Kaggle bajo demanda",
                  "120 h/mes · 30 por semana",
                  "Sin créditos por generación",
                  "Workers duales (Wan, TTS)",
                ],
              },
              {
                title: "Multi-runtime con Colab",
                items: [
                  "Kaggle + Colab en paralelo",
                  "Qwen Image 2.1 en Colab",
                  "Krea 2 Turbo y TTS Dual, también en Colab",
                  "+5 a 8 h diarias adicionales",
                ],
              },
              {
                title: "Modelos",
                items: [
                  "Krea · Flux · LTX 2.3 · LTX 2.5 MSR",
                  "Wan 2.1 i2v + t2v",
                  "OmniVoice + Index TTS",
                  "Modelos nuevos sin pago extra",
                ],
              },
              {
                title: "Extras",
                items: ["Mis Creaciones completo", "Soporte prioritario"],
              },
            ]}
            cta={
              hasCreator ? (
                <div
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 24px",
                    background: "rgba(99,102,241,0.12)",
                    color: "#A5B4FC",
                    border: "1px solid rgba(99,102,241,0.4)",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Acceso Creator activo
                </div>
              ) : (
                <button
                  onClick={() => handleSelectPlan("creator")}
                  disabled={loadingPlan !== null}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px 24px",
                    background:
                      loadingPlan !== null
                        ? "var(--pf-bg-tertiary)"
                        : "var(--pf-text-primary)",
                    color:
                      loadingPlan !== null
                        ? "var(--pf-text-muted)"
                        : "var(--pf-text-inverse)",
                    border: "none",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    cursor: loadingPlan !== null ? "wait" : "pointer",
                    transition: "opacity 0.15s",
                    boxShadow:
                      loadingPlan !== null
                        ? "none"
                        : "0 0 24px -6px rgba(99,102,241,0.5)",
                  }}
                >
                  {loadingPlan === "creator"
                    ? "Redirigiendo a Stripe..."
                    : "Suscribirme — $249/mes"}
                </button>
              )
            }
          />

          {/* Plan Founder */}
          <PlanCard
            name="Founder"
            tagline="6 meses congelados a precio de lanzamiento."
            price="$999"
            priceSuffix="MXN · 6 meses"
            priceStrikethrough="$2,394"
            priceNote="Equivale a $166 MXN/mes. Oferta única hasta el 31 dic 2026."
            discountBadge="-58%"
            badge="Mejor valor"
            featured
            accent={{ from: "#8B5CF6", to: "#EC4899", text: "#C4B5FD" }}
            categories={[
              {
                title: "Todo de Creator · 6 meses",
                items: [
                  "Mismos modelos, misma estación",
                  "Multi-runtime con Colab",
                  "Sin créditos por imagen o video",
                ],
              },
              {
                title: "Ventaja Founder",
                items: [
                  "Precio bloqueado por 6 meses (mientras Creator sube a $399)",
                  "Acceso anticipado a nuevos modelos",
                  "Primeros accesos a plantillas y funciones",
                  "Soporte directo",
                ],
              },
            ]}
            cta={
              hasFounder ? (
                <div
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px 24px",
                    background: "rgba(139,92,246,0.12)",
                    color: "#C4B5FD",
                    border: "1px solid rgba(139,92,246,0.4)",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Acceso Founder activo
                </div>
              ) : (
                <button
                  onClick={() => handleSelectPlan("founder")}
                  disabled={loadingPlan !== null}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px 24px",
                    background:
                      loadingPlan !== null
                        ? "var(--pf-bg-tertiary)"
                        : "linear-gradient(135deg, #8B5CF6, #EC4899)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    cursor: loadingPlan !== null ? "wait" : "pointer",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    boxShadow:
                      loadingPlan !== null
                        ? "none"
                        : "0 8px 24px -8px rgba(139,92,246,0.7)",
                  }}
                  onMouseEnter={(e) => {
                    if (loadingPlan === null) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 12px 32px -8px rgba(139,92,246,0.9)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = loadingPlan === null
                      ? "0 8px 24px -8px rgba(139,92,246,0.7)"
                      : "none";
                  }}
                >
                  {loadingPlan === "founder"
                    ? "Redirigiendo a Stripe..."
                    : "Comprar Founder — $999"}
                </button>
              )
            }
            ctaFootnote={hasFounder ? undefined : "Pago único. Sin renovación automática. Ahorras $1,395."}
          />
        </div>
      </section>

      <MultiRuntimeBlock />

      <FairUsePolicy />

      <ComparisonTable />

      <ValueStackBlock />

      <NewModelsBlock />

      <SignatureBlock />

      <RoadmapBlock />

      {/* FAQ */}
      <section
        style={{
          padding: "80px 24px",
          background: "#050505",
          borderTop: "1px solid rgba(139, 92, 246, 0.1)",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              textAlign: "center",
              margin: 0,
              marginBottom: "40px",
              color: "#FFFFFF",
            }}
          >
            Preguntas frecuentes
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              {
                q: "¿Qué es multi-runtime?",
                a: "Tu cuenta puede tener más de una estación activa a la vez. En la práctica: generas video en Kaggle mientras Qwen Image 2.1 o TTS Dual corren en Google Colab. Disponible solo en Creator y Founder.",
              },
              {
                q: "¿Colab reemplaza a Kaggle?",
                a: "No. Colab se suma. Kaggle sigue siendo tu runtime principal, y Colab te da capacidad extra en paralelo. Puedes usar solo Kaggle, solo Colab, o los dos a la vez.",
              },
              {
                q: "¿Por qué sube el precio el 31 de diciembre?",
                a: "El precio actual es de lanzamiento. Desde el 1 de enero de 2027, Creator pasa a $399 MXN/mes. Quien compre antes de esa fecha congela el precio de lanzamiento durante su primer período. Founder lo congela por 6 meses.",
              },
              {
                q: "¿Qué son las 120 horas al mes?",
                a: "Cada plan incluye hasta 120 horas al mes de estación activa, con un límite de 30 horas por semana. Las horas se descuentan solo cuando tu estación está encendida: si no generas nada durante una hora, se apaga sola para no consumir tu cuota. El tiempo de carga de cada modelo también se descuenta, porque la estación permanece encendida durante el proceso. Las horas no utilizadas no se acumulan para el siguiente mes.",
              },
              {
                q: "¿Qué límites tienen Kaggle y Google Colab?",
                a: "Kaggle te da 30 horas de GPU por semana, con reset los sábados a medianoche UTC. Si agotas la cuota, esperas al reset. Google Colab no publica una cuota fija: te da sesiones de hasta 12 horas según disponibilidad, con desconexiones variables. Con Multi-Runtime (Creator y Founder) puedes usar ambas plataformas en paralelo para maximizar tu capacidad total. Los límites son de las plataformas, no de Pathfinder.",
              },
              {
                q: "¿Es legal usar Kaggle y Colab para generar contenido?",
                a: "Kaggle y Google Colab son infraestructura gratuita para uso personal. Pathfinder te da la capa de productividad: workflows, modelos preconfigurados, nube y monitoreo. Para uso comercial intensivo, recomendamos el plan Creator, que suma Colab como segunda plataforma. Pathfinder no controla ni es responsable de los términos de uso de Kaggle o Colab.",
              },
              {
                q: "¿Qué pasa cuando cambio de modelo?",
                a: "Depende del modelo. Wan 2.1 (i2v y t2v), OmniVoice e Index TTS cambian sin reiniciar la estación: alternas entre ellos con un clic. Krea 2 Turbo, Flux 2 Klein 4B y LTX 2.5 MSR requieren volver a cargar pesos, lo que consume unos minutos de estación. LTX 2.3 reinicia la estación por completo, porque es el modelo más pesado. En todos los casos, el tiempo que la estación permanece encendida durante el cambio se descuenta de tu cuota.",
              },
              {
                q: "¿Necesito algo para empezar?",
                a: "Sí. Además de tu cuenta en Pathfinder, necesitas una cuenta de Kaggle (gratuita) para activar tu estación. Para multi-runtime, también una cuenta de Google para Colab. La primera vez que uses un modelo vas a configurar tu entorno; a partir de ahí, cada sesión es más rápida. La guía paso a paso te lleva de cero a tu primera imagen en menos de 15 minutos.",
              },
              {
                q: "¿Qué incluye el plan Free?",
                a: "Krea 2 Turbo (imagen), Wan 2.1 i2v (imagen a video) y Wan 2.1 t2v (texto a video). Incluye el Studio de creación y acceso a Mis Creaciones con retención de 7 días. Los modelos del plan Free están sujetos a disponibilidad y pueden cambiar con el tiempo. Para el Estudio completo, multi-runtime y todos los modelos, elige Creator o Founder.",
              },
              {
                q: "¿Qué diferencia hay entre Free y Creator?",
                a: "El plan Free es para probar Pathfinder y descubrir qué puedes crear. El plan Creator desbloquea el Estudio completo: todos los modelos actuales (Krea, Flux 2, Qwen Image 2.1, LTX 2.3, LTX 2.5 MSR, Wan i2v y t2v, OmniVoice e Index TTS), todos los workflows, presets, LoRAs integradas, multi-runtime con Colab, y todos los modelos que agreguemos en el futuro sin costo extra.",
              },
              {
                q: "¿Qué incluye Creator?",
                a: "El Estudio completo con todos los modelos del catálogo. Incluye todos los workflows, presets, LoRAs curadas, multi-runtime con Google Colab (Qwen Image 2.1, Krea 2 Turbo, TTS Dual en paralelo), y los modelos que se agreguen en el futuro sin costo adicional. Renovación mensual, cancelas cuando quieras.",
              },
              {
                q: "¿Qué incluye Founder?",
                a: "Todo lo de Creator por 6 meses, con el precio congelado a tarifa de lanzamiento, y acceso prioritario: los nuevos modelos, plantillas y funcionalidades llegan primero a los usuarios Founder. Es un pago único de $999 MXN con precio de lanzamiento hasta el 31 de diciembre de 2026.",
              },
              {
                q: "¿Founder se renueva automáticamente?",
                a: "No. Founder es un pago único por 6 meses. Al terminar el período, puedes renovar por 6 meses más al precio vigente en ese momento, o suscribirte a Creator mensual. Tú decides.",
              },
              {
                q: "¿Puedo cancelar mi suscripción Creator?",
                a: "Sí, en cualquier momento desde Configuración > Cuenta, o desde el portal de cliente de Stripe. Sigues teniendo acceso hasta el final del período que ya pagaste. Después, tu cuenta vuelve al plan Free sin perder tus creaciones guardadas.",
              },
              {
                q: "¿Cómo funciona la activación de una estación?",
                a: "Desde 'Mi Estación' descargas el workflow del modelo que quieras usar, lo ejecutas en tu plataforma de cómputo y Pathfinder lo detecta automáticamente cuando está listo. El proceso se hace una vez por sesión. Si tienes el Studio abierto, el selector de modelo se actualiza solo y puedes empezar a generar.",
              },
              {
                q: "¿Puedo pedir reembolso?",
                a: "Sí. En Creator, dentro de los primeros 14 días naturales después de tu primera suscripción, puedes solicitar el reembolso completo sin justificación. En Founder, aplica la misma ventana de 14 días. Escríbenos a pathfinder.contacto@gmail.com.",
              },
              {
                q: "¿Qué métodos de pago aceptan?",
                a: "Tarjetas de crédito y débito (Visa, Mastercard, American Express), Apple Pay y Google Pay. El pago se procesa de forma segura a través de Stripe.",
              },
            ].map((f, i) => (
              <details
                key={i}
                style={{
                  background: "rgba(139, 92, 246, 0.04)",
                  border: "1px solid rgba(139, 92, 246, 0.15)",
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
                    color: "#FFFFFF",
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
                    color: "rgba(255,255,255,0.65)",
                    margin: 0,
                    marginTop: "12px",
                  }}
                >
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <LegalDisclaimer />

      {/* Final CTA */}
      <section
        style={{
          padding: "100px 24px",
          background: "#0A0A0A",
          color: "#FFFFFF",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(220, 38, 38, 0.12)",
              border: "1px solid rgba(220, 38, 38, 0.4)",
              borderRadius: "9999px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#FCA5A5",
              marginBottom: "20px",
            }}
          >
            <Flame size={12} strokeWidth={2.5} />
            El precio sube el 31 de diciembre
          </div>

          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: "16px",
              color: "#FFFFFF",
            }}
          >
            Congela tu acceso a $249/mes.
          </h2>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "32px",
              lineHeight: 1.6,
            }}
          >
            Después del 31 de diciembre, Creator pasa a $399/mes. Founder congela el precio por 6 meses y suma acceso prioritario.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to={session ? "/studio" : "/auth"}
              style={{
                textDecoration: "none",
                display: "inline-block",
                padding: "14px 32px",
                background: "transparent",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "9999px",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
              }}
            >
              {session ? "Ir al Studio" : "Empezar gratis"}
            </Link>
            <button
              onClick={() => handleSelectPlan("founder")}
              disabled={loadingPlan !== null}
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "9999px",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.9375rem",
                fontWeight: 700,
                cursor: loadingPlan !== null ? "wait" : "pointer",
                boxShadow: "0 12px 32px -8px rgba(139,92,246,0.7)",
              }}
            >
              {loadingPlan === "founder" ? "Redirigiendo..." : "Comprar Founder — $999"}
            </button>
          </div>
        </div>
      </section>
      </div>
    </MarketingLayout>
  );
};

export default PricingPage;
