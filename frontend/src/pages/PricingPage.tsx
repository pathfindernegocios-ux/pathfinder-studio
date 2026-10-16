// src/pages/PricingPage.tsx
// Planes y precios — rediseño v3 (SpaceWarp startrails en hero + aurora + grain).
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { Flask } from '@phosphor-icons/react/dist/csr/Flask';
import { Gauge } from '@phosphor-icons/react/dist/csr/Gauge';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/csr/ArrowsClockwise';
import { Fire } from '@phosphor-icons/react/dist/csr/Fire';
import { ShieldCheck } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { XCircle } from '@phosphor-icons/react/dist/csr/XCircle';
import { Stack } from '@phosphor-icons/react/dist/csr/Stack';
import { Clock } from '@phosphor-icons/react/dist/csr/Clock';
import { Package } from '@phosphor-icons/react/dist/csr/Package';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { Minus } from '@phosphor-icons/react/dist/csr/Minus';
import MarketingLayout from "../components/marketing/MarketingLayout";
import SpaceWarp from "../components/marketing/SpaceWarp";
import { useAuth } from "../hooks/useAuth";
import { useModels } from "../hooks/useModels";
import { usePurchase, type PlanId } from "../hooks/usePurchase";
import { setPostAuthRedirect } from "../lib/postAuthRedirect";
import { fadeInUp, staggerContainer } from "../design/motion";

// ============================================================
// CONSTANTS
// ============================================================
const LAUNCH_DEADLINE = new Date("2026-12-31T23:59:59-06:00");

// ============================================================
// AURORA ATMOSPHERE
// ============================================================
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
// COUNTDOWN BAR — v3 (urgencia con vocabulario del sistema)
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
        zIndex: 5,
        marginTop: 84,
        background:
          "linear-gradient(90deg, rgba(220,38,38,0.18) 0%, rgba(245,158,11,0.12) 50%, rgba(220,38,38,0.18) 100%)",
        padding: "14px 20px",
        textAlign: "center",
        borderBottom: "1px solid rgba(220,38,38,0.30)",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, rgba(220,38,38,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          flexWrap: "wrap",
          zIndex: 1,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Fire size={16} weight="fill" color="#FCA5A5" />
          <span
            style={{
              fontFamily: "var(--pf-font-mono)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontSize: "0.6875rem",
              color: "#FCA5A5",
            }}
          >
            Precio de lanzamiento
          </span>
        </span>

        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>

        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 4,
              padding: "4px 10px",
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 6,
              fontFamily: "var(--pf-font-mono)",
              fontWeight: 700,
              fontSize: "0.8125rem",
              letterSpacing: "0.02em",
              color: "#F5F5F7",
            }}
          >
            {pad(days)}
            <span style={{ fontSize: "0.5625rem", fontWeight: 600, opacity: 0.7, letterSpacing: "0.10em" }}>
              DÍAS
            </span>
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 4,
              padding: "4px 10px",
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 6,
              fontFamily: "var(--pf-font-mono)",
              fontWeight: 700,
              fontSize: "0.8125rem",
              letterSpacing: "0.02em",
              color: "#F5F5F7",
            }}
          >
            {pad(hours)}
            <span style={{ fontSize: "0.5625rem", fontWeight: 600, opacity: 0.7, letterSpacing: "0.10em" }}>
              HRS
            </span>
          </span>
        </span>

        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>

        <span
          style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Después sube a <s style={{ opacity: 0.6 }}>$399</s>{" "}
          <strong style={{ color: "#F5F5F7" }}>$249</strong>/mes
        </span>

        <button
          onClick={scrollToPlans}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#8B5CF6",
            color: "#FFFFFF",
            border: "none",
            padding: "6px 14px",
            borderRadius: 9999,
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 150ms",
            boxShadow: "0 8px 20px -6px rgba(139,92,246,0.6)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#7C66DD";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#8B5CF6";
          }}
        >
          Asegurar precio
        </button>
      </div>
    </div>
  );
};

// ============================================================
// DIVIDER — gradiente violeta
// ============================================================
const Divider: React.FC = () => (
  <div
    style={{
      height: 1,
      background:
        "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.30) 50%, transparent 100%)",
      margin: "80px 0",
      maxWidth: 1240,
      marginLeft: "auto",
      marginRight: "auto",
    }}
  />
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
      marginBottom: 48,
      textAlign: center ? "center" : "left",
      maxWidth: center ? 720 : 800,
      margin: center ? "0 auto 48px" : "0 0 48px",
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
          marginBottom: 16,
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
// TRUST ROW
// ============================================================
const TrustRow: React.FC = () => {
  const items = [
    { Icon: ShieldCheck, label: "Pago seguro con Stripe" },
    { Icon: ArrowCounterClockwise, label: "14 días de reembolso" },
    { Icon: XCircle, label: "Cancela cuando quieras" },
    { Icon: Check, label: "Sin créditos por imagen o video" },
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      style={{
        marginTop: 28,
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        gap: 0,
        flexWrap: "wrap",
      }}
    >
      {items.map(({ Icon, label }, i) => (
        <motion.div
          key={i}
          variants={fadeInUp}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 24px",
            borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
            fontFamily: "var(--pf-font-mono)",
            fontSize: "0.6875rem",
            fontWeight: 500,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          <Icon size={14} weight="regular" color="#A78BFA" />
          {label}
        </motion.div>
      ))}
    </motion.div>
  );
};

// ============================================================
// STATUS BANNER
// ============================================================
const StatusBanner: React.FC<{
  type: "success" | "cancelled";
  onDismiss: () => void;
}> = ({ type, onDismiss }) => {
  const isSuccess = type === "success";
  const color = isSuccess ? "#10B981" : "#F59E0B";
  const bg = isSuccess ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)";
  const border = isSuccess ? "rgba(16,185,129,0.30)" : "rgba(245,158,11,0.30)";
  const title = isSuccess ? "Suscripción activada" : "Pago cancelado";
  const body = isSuccess
    ? "Tu plan ya está activo. Puede tardar unos segundos en reflejarse en tu cuenta."
    : "No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.";

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "24px auto 0",
        padding: "16px 20px",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color,
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.875rem",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.5,
          }}
        >
          {body}
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.14)",
          color: "rgba(255,255,255,0.7)",
          padding: "8px 16px",
          borderRadius: 9999,
          fontFamily: "var(--pf-font-ui)",
          fontSize: "0.8125rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Cerrar
      </button>
    </div>
  );
};

// ============================================================
// PLAN CARD — v3
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
  disclaimer,
}) => {
  const [hover, setHover] = useState(false);
  const isAccent = highlighted || featured;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: "#0F0F11",
        border: `1px solid ${isAccent ? `${accent.from}55` : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16,
        padding: "32px 26px 26px",
        transition: "transform 200ms, border-color 200ms, box-shadow 200ms",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hover
          ? `0 20px 40px -12px ${accent.from}30`
          : "none",
      }}
    >
      {/* Radial accent arriba */}
      {isAccent && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent.from}22, transparent 65%)`,
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Header: badge + discount */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          minHeight: 24,
        }}
      >
        {badge ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 12px",
              background: `${accent.from}18`,
              border: `1px solid ${accent.from}40`,
              borderRadius: 9999,
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.625rem",
              fontWeight: 700,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: accent.text,
            }}
          >
            {badge}
          </span>
        ) : (
          <span />
        )}
        {discountBadge && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 12px",
              background: "linear-gradient(135deg, #DC2626, #B91C1C)",
              color: "#FFFFFF",
              borderRadius: 9999,
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              boxShadow: "0 8px 20px -6px rgba(220,38,38,0.6)",
            }}
          >
            {discountBadge}
          </span>
        )}
      </div>

      {/* Nombre del plan */}
      <h3
        style={{
          position: "relative",
          fontFamily: "var(--pf-font-display-alt)",
          fontSize: "1.5rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "#F5F5F7",
          margin: 0,
          marginBottom: 6,
        }}
      >
        {name}
      </h3>
      <p
        style={{
          position: "relative",
          fontFamily: "var(--pf-font-ui)",
          fontSize: "0.875rem",
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.55)",
          margin: 0,
          marginBottom: 24,
        }}
      >
        {tagline}
      </p>

      {/* Precio */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: priceNote ? 8 : 24,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--pf-font-display)",
            fontSize: "clamp(2rem, 3vw, 2.5rem)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: "#F5F5F7",
            lineHeight: 1,
          }}
        >
          {price}
        </span>
        {priceStrikethrough && (
          <s
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.9375rem",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {priceStrikethrough}
          </s>
        )}
        {priceSuffix && (
          <span
            style={{
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {priceSuffix}
          </span>
        )}
      </div>

      {priceNote && (
        <p
          style={{
            position: "relative",
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.75rem",
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.45)",
            margin: 0,
            marginBottom: 24,
          }}
        >
          {priceNote}
        </p>
      )}

      {/* Categorías */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          marginBottom: 28,
          flex: 1,
        }}
      >
        {categories.map((cat, i) => (
          <div key={i}>
            <div
              style={{
                fontFamily: "var(--pf-font-mono)",
                fontSize: "0.625rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: accent.text,
                marginBottom: 12,
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
                gap: 10,
              }}
            >
              {cat.items.map((item, j) => (
                <li
                  key={j}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: 6,
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: accent.from,
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

      {/* CTA */}
      <div style={{ position: "relative" }}>{cta}</div>

      {ctaFootnote && (
        <p
          style={{
            position: "relative",
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.75rem",
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.4)",
            margin: 0,
            marginTop: 14,
            textAlign: "center",
          }}
        >
          {ctaFootnote}
        </p>
      )}

      {disclaimer && (
        <p
          style={{
            position: "relative",
            fontFamily: "var(--pf-font-ui)",
            fontSize: "0.6875rem",
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.35)",
            margin: 0,
            marginTop: 14,
          }}
        >
          {disclaimer}
        </p>
      )}
    </div>
  );
};

// ============================================================
// MULTI-RUNTIME BLOCK
// ============================================================
const MultiRuntimeBlock: React.FC = () => {
  const items = [
    {
      Icon: Stack,
      title: "Kaggle + Colab, a la vez",
      body: "Dos runtimes en paralelo desde la misma cuenta. Uno genera video, el otro puede estar procesando imagen o audio.",
      color: "#22D3EE",
      big: "×2",
    },
    {
      Icon: Clock,
      title: "+5 a 8 horas diarias",
      body: "Las horas de Google Colab se suman a las 120 h/mes de tu plan. Más margen para crear sin tocar el límite semanal.",
      color: "#A5B4FC",
      big: "+8h",
    },
    {
      Icon: Package,
      title: "3 modelos en Colab",
      body: "Qwen Image 2.1, Krea 2 Turbo y TTS Dual ya tienen versión Colab lista para correr desde tu cuenta.",
      color: "#34D399",
      big: "3",
    },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      style={{
        position: "relative",
        maxWidth: 1240,
        margin: "0 auto",
        padding: "0 80px",
      }}
    >
      <SectionHeader
        eyebrow="Nuevo en Creator y Founder"
        title="Genera video e imagen al mismo tiempo."
        subtitle="Tu cuenta ya no está atada a un solo runtime. Mientras una estación genera video, puedes levantar Qwen Image 2.1 o TTS Dual en Google Colab — sin pagar dos suscripciones, sin pelear con entornos."
        center
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {items.map(({ Icon, title, body, color, big }, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            style={{
              position: "relative",
              padding: "28px 24px",
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${color}18, transparent 65%)`,
                filter: "blur(30px)",
                pointerEvents: "none",
              }}
            />
            {/* Big number retroiluminado */}
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 24,
                fontFamily: "var(--pf-font-display-alt)",
                fontSize: "1.75rem",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: color,
                opacity: 0.55,
              }}
            >
              {big}
            </div>

            <div
              style={{
                position: "relative",
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${color}14`,
                border: `1px solid ${color}40`,
                color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <Icon size={18} weight="regular" />
            </div>

            <h3
              style={{
                position: "relative",
                fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 8,
              }}
            >
              {title}
            </h3>
            <p
              style={{
                position: "relative",
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
        ))}
      </div>
    </motion.section>
  );
};

// ============================================================
// FAIR USE POLICY — Platform cards (identidad propia de Pricing)
// ============================================================
const FairUsePolicy: React.FC = () => {
  const platforms = [
    {
      name: "Kaggle",
      color: "#20BEFF",
      stat: "30 h",
      statLabel: "por semana",
      items: [
        "30 horas de GPU por semana",
        "Reset los sábados a medianoche UTC",
        "Si agotas la cuota, esperas al reset",
      ],
    },
    {
      name: "Google Colab",
      color: "#F9AB00",
      stat: "12 h",
      statLabel: "por sesión",
      items: [
        "Sesiones de hasta 12 horas",
        "Disponibilidad variable según demanda",
        "Sin cuota fija publicada por Google",
      ],
    },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      style={{
        position: "relative",
        maxWidth: 1240,
        margin: "0 auto",
        padding: "0 80px",
      }}
    >
      <SectionHeader
        eyebrow="Uso justo"
        title="Límites claros, sin sorpresas."
        subtitle="Pathfinder corre sobre la infraestructura gratuita de Kaggle y Google Colab. Cada plataforma tiene sus propias reglas de uso. Aquí las explicamos con transparencia para que sepas exactamente qué esperar."
        center
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {platforms.map((p) => (
          <motion.div
            key={p.name}
            variants={fadeInUp}
            style={{
              position: "relative",
              padding: "28px 26px",
              background: "#0F0F11",
              border: `1px solid ${p.color}33`,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 220,
                height: 220,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${p.color}22, transparent 65%)`,
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <span
                className="pf-status-dot"
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: p.color,
                  boxShadow: `0 0 10px ${p.color}99`,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--pf-font-display-alt)",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "#F5F5F7",
                }}
              >
                {p.name}
              </span>
            </div>

            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                paddingBottom: 20,
                marginBottom: 20,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--pf-font-display)",
                  fontSize: "2.5rem",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  color: p.color,
                  lineHeight: 1,
                }}
              >
                {p.stat}
              </span>
              <span
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {p.statLabel}
              </span>
            </div>

            <ul
              style={{
                position: "relative",
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {p.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.7)",
                    lineHeight: 1.55,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: 7,
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: p.color,
                      opacity: 0.8,
                    }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.p
        variants={fadeInUp}
        style={{
          fontFamily: "var(--pf-font-ui)",
          fontSize: "0.8125rem",
          color: "rgba(255,255,255,0.45)",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        Los límites son de Kaggle y Google Colab, no de Pathfinder. Pathfinder
        no controla ni es responsable de cambios en sus políticas de uso. Con
        Multi-Runtime (Creator y Founder) puedes usar ambas plataformas en
        paralelo para maximizar tu capacidad total.
      </motion.p>
    </motion.section>
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
    if (v === true) return <Check size={16} weight="bold" color={color} />;
    if (v === false) return <Minus size={16} weight="regular" color="rgba(255,255,255,0.20)" />;
    return (
      <span
        style={{
          fontFamily: "var(--pf-font-mono)",
          fontSize: "0.75rem",
          fontWeight: 500,
          letterSpacing: "0.02em",
          color: "rgba(255,255,255,0.75)",
        }}
      >
        {v}
      </span>
    );
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      style={{
        position: "relative",
        maxWidth: 1240,
        margin: "0 auto",
        padding: "0 80px",
      }}
    >
      <SectionHeader
        eyebrow="Comparativa"
        title="Compara los planes"
        subtitle="Free para probar. Creator para el Estudio completo. Founder para 6 meses congelados y acceso prioritario."
        center
      />

      <motion.div
        variants={fadeInUp}
        style={{
          overflowX: "auto",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 640,
            fontFamily: "var(--pf-font-ui)",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "18px 20px",
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
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
                    fontFamily: "var(--pf-font-display-alt)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
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
              <tr
                key={i}
                style={{
                  borderBottom:
                    i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
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
      </motion.div>
    </motion.section>
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
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      style={{
        position: "relative",
        maxWidth: 720,
        margin: "0 auto",
        padding: "0 80px",
      }}
    >
      <SectionHeader
        eyebrow="Valor"
        title="Lo que obtienes en Creator"
        subtitle="Valorado por separado, cada componente tiene un precio. Juntos, son una sola suscripción."
        center
      />

      <motion.div
        variants={fadeInUp}
        style={{
          position: "relative",
          padding: "32px 30px",
          background: "#0F0F11",
          border: "1px solid rgba(139,92,246,0.20)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.14), transparent 65%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative" }}>
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 16,
                padding: "12px 0",
                borderBottom:
                  i < items.length - 1 ? "1px dashed rgba(255,255,255,0.08)" : "none",
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.7)" }}>{it.label}</span>
              <span
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {it.value}
              </span>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 16,
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.15)",
              fontFamily: "var(--pf-font-ui)",
            }}
          >
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "#F5F5F7" }}>
              Valor total
            </span>
            <span
              style={{
                fontFamily: "var(--pf-font-mono)",
                fontSize: "1rem",
                fontWeight: 500,
                color: "rgba(255,255,255,0.4)",
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
              gap: 16,
              marginTop: 12,
            }}
          >
            <span
              style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1.0625rem",
                fontWeight: 600,
                color: "#A78BFA",
              }}
            >
              Pagas
            </span>
            <span
              style={{
                fontFamily: "var(--pf-font-display)",
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: "#A78BFA",
                lineHeight: 1,
              }}
            >
              $249{" "}
              <span
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                MXN/mes
              </span>
            </span>
          </div>
        </div>
      </motion.div>

      <motion.p
        variants={fadeInUp}
        style={{
          fontFamily: "var(--pf-font-ui)",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
          marginTop: 18,
          lineHeight: 1.5,
        }}
      >
        Valores de referencia. No representan servicios de terceros.
      </motion.p>
    </motion.section>
  );
};

// ============================================================
// NEW MODELS BLOCK
// ============================================================
const NewModelsBlock: React.FC = () => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={staggerContainer}
    style={{
      position: "relative",
      maxWidth: 780,
      margin: "0 auto",
      padding: "0 80px",
      textAlign: "center",
    }}
  >
    <motion.div
      variants={fadeInUp}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        filter: "drop-shadow(0 0 24px rgba(139,92,246,0.55))",
      }}
    >
      <img
        src="/pathfinder-logo.png"
        alt="Pathfinder"
        style={{ width: 72, height: 72, display: "block" }}
      />
    </motion.div>
    <motion.h2
      variants={fadeInUp}
      style={{
        fontFamily: "var(--pf-font-display-alt)",
        fontSize: "clamp(1.5rem, 3vw, 2rem)",
        fontWeight: 600,
        letterSpacing: "-0.03em",
        margin: 0,
        marginBottom: 16,
        color: "#F5F5F7",
        lineHeight: 1.15,
      }}
    >
      Los modelos nuevos entran a tu plan sin costo extra
    </motion.h2>
    <motion.p
      variants={fadeInUp}
      style={{
        fontFamily: "var(--pf-font-ui)",
        fontSize: "1.0625rem",
        color: "rgba(255,255,255,0.6)",
        lineHeight: 1.6,
        margin: 0,
        maxWidth: 620,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      Cuando agregamos un modelo nuevo al catálogo de Pathfinder, entra
      automáticamente a tu plan Creator o Founder. No pagas por separado, no
      necesitas una nueva suscripción. El catálogo crece contigo.
    </motion.p>
  </motion.section>
);

// ============================================================
// SIGNATURE BLOCK
// ============================================================
const SignatureBlock: React.FC = () => {
  const steps = [
    {
      Icon: MagnifyingGlass,
      title: "Investigación",
      body: "Seguimos las últimas tecnologías del sector IA y las traducimos en workflows competitivos.",
    },
    {
      Icon: Flask,
      title: "Validación",
      body: "Llevamos cada modelo a pruebas reales hasta que cumple con el estándar Pathfinder.",
    },
    {
      Icon: Gauge,
      title: "Optimización",
      body: "Llevamos cada workflow al límite de la plataforma donde corre.",
    },
    {
      Icon: ArrowsClockwise,
      title: "Evolución",
      body: "Renovamos el catálogo a medida que avanza la tecnología.",
    },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      style={{
        position: "relative",
        maxWidth: 1240,
        margin: "0 auto",
        padding: "0 80px",
      }}
    >
      <SectionHeader
        eyebrow="Ingeniería"
        title="Pathfinder ingeniería a tu medida"
        subtitle="Cada modelo, cada workflow, cada preset — pasa por nuestro proceso antes de llegar a tus manos."
        center
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 24,
        }}
      >
        {steps.map((s, i) => (
          <motion.div key={i} variants={fadeInUp}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(34,211,238,0.08)",
                border: "1px solid rgba(34,211,238,0.25)",
                color: "#67E8F9",
                marginBottom: 16,
              }}
            >
              <s.Icon size={20} weight="regular" />
            </div>
            <h3
              style={{
                fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
                marginBottom: 8,
                color: "#F5F5F7",
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.8125rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.55)",
                margin: 0,
              }}
            >
              {s.body}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

// ============================================================
// ROADMAP BLOCK
// ============================================================
const RoadmapBlock: React.FC = () => {
  const items = [
    {
      Icon: Stack,
      title: "Infraestructura dedicada",
      body: "Estamos migrando a GPUs propias para eliminar los límites de plataformas de terceros. Sesiones más largas, sin cuotas externas.",
    },
    {
      Icon: Clock,
      title: "Pago por uso",
      body: "Planes por créditos para quienes generan de forma intensiva, con precios alineados al costo real de la GPU.",
    },
    {
      Icon: Package,
      title: "Storage extendido",
      body: "Retención de creaciones más larga y proyectos persistentes en la nube de Pathfinder.",
    },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      style={{
        position: "relative",
        maxWidth: 1240,
        margin: "0 auto",
        padding: "0 80px",
      }}
    >
      <SectionHeader
        eyebrow="Próximamente"
        title="Lo que viene en Pathfinder"
        subtitle="Hoy Pathfinder corre sobre infraestructura gratuita. La siguiente etapa elimina las limitaciones de plataformas de terceros y lleva el producto a un estándar industrial."
        center
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {items.map(({ Icon, title, body }, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            style={{
              padding: "28px 24px",
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
                borderRadius: 10,
                background: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.30)",
                color: "#C4B5FD",
                marginBottom: 18,
              }}
            >
              <Icon size={18} weight="regular" />
            </div>
            <h3
              style={{
                fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
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
        ))}
      </div>
    </motion.section>
  );
};

// ============================================================
// LEGAL DISCLAIMER
// ============================================================
const LegalDisclaimer: React.FC = () => (
  <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 80px" }}>
    <p
      style={{
        fontFamily: "var(--pf-font-ui)",
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
);

// ============================================================
// FAQ
// ============================================================
const FAQ_ITEMS = [
  { q: "¿Qué es multi-runtime?", a: "Tu cuenta puede tener más de una estación activa a la vez. En la práctica: generas video en Kaggle mientras Qwen Image 2.1 o TTS Dual corren en Google Colab. Disponible solo en Creator y Founder." },
  { q: "¿Colab reemplaza a Kaggle?", a: "No. Colab se suma. Kaggle sigue siendo tu runtime principal, y Colab te da capacidad extra en paralelo. Puedes usar solo Kaggle, solo Colab, o los dos a la vez." },
  { q: "¿Por qué sube el precio el 31 de diciembre?", a: "El precio actual es de lanzamiento. Desde el 1 de enero de 2027, Creator pasa a $399 MXN/mes. Quien compre antes de esa fecha congela el precio de lanzamiento durante su primer período. Founder lo congela por 6 meses." },
  { q: "¿Qué son las 120 horas al mes?", a: "Cada plan incluye hasta 120 horas al mes de estación activa, con un límite de 30 horas por semana. Las horas se descuentan solo cuando tu estación está encendida: si no generas nada durante una hora, se apaga sola para no consumir tu cuota. El tiempo de carga de cada modelo también se descuenta, porque la estación permanece encendida durante el proceso. Las horas no utilizadas no se acumulan para el siguiente mes." },
  { q: "¿Qué límites tienen Kaggle y Google Colab?", a: "Kaggle te da 30 horas de GPU por semana, con reset los sábados a medianoche UTC. Si agotas la cuota, esperas al reset. Google Colab no publica una cuota fija: te da sesiones de hasta 12 horas según disponibilidad, con desconexiones variables. Con Multi-Runtime (Creator y Founder) puedes usar ambas plataformas en paralelo para maximizar tu capacidad total. Los límites son de las plataformas, no de Pathfinder." },
  { q: "¿Es legal usar Kaggle y Colab para generar contenido?", a: "Kaggle y Google Colab son infraestructura gratuita para uso personal. Pathfinder te da la capa de productividad: workflows, modelos preconfigurados, nube y monitoreo. Para uso comercial intensivo, recomendamos el plan Creator, que suma Colab como segunda plataforma. Pathfinder no controla ni es responsable de los términos de uso de Kaggle o Colab." },
  { q: "¿Qué pasa cuando cambio de modelo?", a: "Depende del modelo. Wan 2.1 (i2v y t2v), OmniVoice e Index TTS cambian sin reiniciar la estación: alternas entre ellos con un clic. Krea 2 Turbo, Flux 2 Klein 4B y LTX 2.5 MSR requieren volver a cargar pesos, lo que consume unos minutos de estación. LTX 2.3 reinicia la estación por completo, porque es el modelo más pesado. En todos los casos, el tiempo que la estación permanece encendida durante el cambio se descuenta de tu cuota." },
  { q: "¿Necesito algo para empezar?", a: "Sí. Además de tu cuenta en Pathfinder, necesitas una cuenta de Kaggle (gratuita) para activar tu estación. Para multi-runtime, también una cuenta de Google para Colab. La primera vez que uses un modelo vas a configurar tu entorno; a partir de ahí, cada sesión es más rápida. La guía paso a paso te lleva de cero a tu primera imagen en menos de 15 minutos." },
  { q: "¿Qué incluye el plan Free?", a: "Krea 2 Turbo (imagen), Wan 2.1 i2v (imagen a video) y Wan 2.1 t2v (texto a video). Incluye el Studio de creación y acceso a Mis Creaciones con retención de 7 días. Los modelos del plan Free están sujetos a disponibilidad y pueden cambiar con el tiempo. Para el Estudio completo, multi-runtime y todos los modelos, elige Creator o Founder." },
  { q: "¿Qué diferencia hay entre Free y Creator?", a: "El plan Free es para probar Pathfinder y descubrir qué puedes crear. El plan Creator desbloquea el Estudio completo: todos los modelos actuales (Krea, Flux 2, Qwen Image 2.1, LTX 2.3, LTX 2.5 MSR, Wan i2v y t2v, OmniVoice e Index TTS), todos los workflows, presets, LoRAs integradas, multi-runtime con Colab, y todos los modelos que agreguemos en el futuro sin costo extra." },
  { q: "¿Qué incluye Creator?", a: "El Estudio completo con todos los modelos del catálogo. Incluye todos los workflows, presets, LoRAs curadas, multi-runtime con Google Colab (Qwen Image 2.1, Krea 2 Turbo, TTS Dual en paralelo), y los modelos que se agreguen en el futuro sin costo adicional. Renovación mensual, cancelas cuando quieras." },
  { q: "¿Qué incluye Founder?", a: "Todo lo de Creator por 6 meses, con el precio congelado a tarifa de lanzamiento, y acceso prioritario: los nuevos modelos, plantillas y funcionalidades llegan primero a los usuarios Founder. Es un pago único de $999 MXN con precio de lanzamiento hasta el 31 de diciembre de 2026." },
  { q: "¿Founder se renueva automáticamente?", a: "No. Founder es un pago único por 6 meses. Al terminar el período, puedes renovar por 6 meses más al precio vigente en ese momento, o suscribirte a Creator mensual. Tú decides." },
  { q: "¿Puedo cancelar mi suscripción Creator?", a: "Sí, en cualquier momento desde Configuración > Cuenta, o desde el portal de cliente de Stripe. Sigues teniendo acceso hasta el final del período que ya pagaste. Después, tu cuenta vuelve al plan Free sin perder tus creaciones guardadas." },
  { q: "¿Cómo funciona la activación de una estación?", a: "Desde 'Mi Estación' descargas el workflow del modelo que quieras usar, lo ejecutas en tu plataforma de cómputo y Pathfinder lo detecta automáticamente cuando está listo. El proceso se hace una vez por sesión. Si tienes el Studio abierto, el selector de modelo se actualiza solo y puedes empezar a generar." },
  { q: "¿Puedo pedir reembolso?", a: "Sí. En Creator, dentro de los primeros 14 días naturales después de tu primera suscripción, puedes solicitar el reembolso completo sin justificación. En Founder, aplica la misma ventana de 14 días. Escríbenos a pathfinder.contacto@gmail.com." },
  { q: "¿Qué métodos de pago aceptan?", a: "Tarjetas de crédito y débito (Visa, Mastercard, American Express), Apple Pay y Google Pay. El pago se procesa de forma segura a través de Stripe." },
];

const FAQBlock: React.FC = () => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={staggerContainer}
    style={{
      position: "relative",
      maxWidth: 800,
      margin: "0 auto",
      padding: "0 80px",
    }}
  >
    <SectionHeader eyebrow="Preguntas frecuentes" title="Lo que suelen preguntar" center />

    <motion.div variants={fadeInUp} style={{ display: "flex", flexDirection: "column" }}>
      {FAQ_ITEMS.map((f, i) => (
        <details
          key={i}
          style={{
            borderBottom:
              i < FAQ_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}
        >
          <summary
            style={{
              padding: "20px 0",
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.9375rem",
              fontWeight: 500,
              color: "#F5F5F7",
              cursor: "pointer",
              listStyle: "none",
            }}
          >
            {f.q}
          </summary>
          <p
            style={{
              paddingBottom: 20,
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.875rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.55)",
              margin: 0,
            }}
          >
            {f.a}
          </p>
        </details>
      ))}
    </motion.div>
  </motion.section>
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
  const hasFounder = false;

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
      <div style={{ background: "#000000", position: "relative", overflow: "hidden" }}>
        <AuroraAtmosphere />

        <CountdownBar />

        {/* SpaceWarp overlay — cubre hero + trust + planes en el mismo fondo */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1000,
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <SpaceWarp variant="startrails" density={2000} intensity={1} centerX={0.5} centerY={0.3} />
        </div>

        {/* ═══════════ HERO compacto ═══════════ */}
        <section
          style={{
            position: "relative",
            padding: "48px 80px 24px",
            textAlign: "center",
            zIndex: 1,
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
              height: 400,
              background: "radial-gradient(ellipse, rgba(139,92,246,0.16) 0%, transparent 65%)",
              filter: "blur(80px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            style={{ position: "relative", maxWidth: 720, margin: "0 auto", zIndex: 1 }}
          >
            <motion.h1
              variants={fadeInUp}
              style={{
                fontFamily: "var(--pf-font-display)",
                fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
                fontWeight: 400,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 20,
              }}
            >
              Pathfinder para todos
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1.0625rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.6)",
                margin: "0 auto",
                maxWidth: 580,
              }}
            >
              Una estación con GPU gratuita de Kaggle y Colab, workflows listos
              y catálogo completo de modelos IA. Sin créditos por generación.
              Límites transparentes.
            </motion.p>
            <TrustRow />
          </motion.div>
        </section>

        {showBanner && status && (status === "success" || status === "cancelled") && (
          <div style={{ padding: "24px 80px 0" }}>
            <StatusBanner type={status} onDismiss={handleDismissBanner} />
          </div>
        )}

        {purchaseError && (
          <div style={{ padding: "24px 80px 0" }}>
            <div
              style={{
                maxWidth: 1100,
                margin: "0 auto",
                padding: "16px 20px",
                background: "rgba(235,87,87,0.08)",
                border: "1px solid rgba(235,87,87,0.30)",
                borderRadius: 12,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                color: "#FCA5A5",
                lineHeight: 1.5,
              }}
            >
              {purchaseError}
            </div>
          </div>
        )}

        {/* ═══════════ PLANES ═══════════ */}
        <section
          id="planes"
          style={{ position: "relative", padding: "24px 80px 40px", zIndex: 1 }}
        >
          <div
            style={{
              maxWidth: 1240,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
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
                      padding: "14px 24px",
                      background: "transparent",
                      color: "#F5F5F7",
                      border: "1px solid rgba(34,211,238,0.40)",
                      borderRadius: 9999,
                      fontFamily: "var(--pf-font-ui)",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      transition: "background 150ms",
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
                      padding: "14px 24px",
                      background: "transparent",
                      color: "#F5F5F7",
                      border: "1px solid rgba(34,211,238,0.40)",
                      borderRadius: 9999,
                      fontFamily: "var(--pf-font-ui)",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      transition: "background 150ms",
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
                      padding: "14px 24px",
                      background: "rgba(99,102,241,0.12)",
                      color: "#A5B4FC",
                      border: "1px solid rgba(99,102,241,0.40)",
                      borderRadius: 9999,
                      fontFamily: "var(--pf-font-ui)",
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
                      background: loadingPlan !== null ? "rgba(139,92,246,0.4)" : "#8B5CF6",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 9999,
                      fontFamily: "var(--pf-font-ui)",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      cursor: loadingPlan !== null ? "wait" : "pointer",
                      transition: "background 150ms",
                      boxShadow: loadingPlan !== null ? "none" : "0 12px 32px -8px rgba(139,92,246,0.6)",
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
                      border: "1px solid rgba(139,92,246,0.40)",
                      borderRadius: 9999,
                      fontFamily: "var(--pf-font-ui)",
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
                          ? "rgba(139,92,246,0.4)"
                          : "linear-gradient(135deg, #8B5CF6, #EC4899)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 9999,
                      fontFamily: "var(--pf-font-ui)",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      cursor: loadingPlan !== null ? "wait" : "pointer",
                      transition: "transform 150ms, box-shadow 150ms",
                      boxShadow:
                        loadingPlan !== null
                          ? "none"
                          : "0 12px 32px -8px rgba(139,92,246,0.7)",
                    }}
                  >
                    {loadingPlan === "founder"
                      ? "Redirigiendo a Stripe..."
                      : "Comprar Founder — $999"}
                  </button>
                )
              }
              ctaFootnote={
                hasFounder
                  ? undefined
                  : "Pago único. Sin renovación automática. Ahorras $1,395."
              }
            />
          </div>
        </section>

        <Divider />

        <MultiRuntimeBlock />

        <Divider />

        <FairUsePolicy />

        <Divider />

        <ComparisonTable />

        <Divider />

        <ValueStackBlock />

        <Divider />

        <NewModelsBlock />

        <Divider />

        <SignatureBlock />

        <Divider />

        <RoadmapBlock />

        <Divider />

        <FAQBlock />

        <Divider />

        <LegalDisclaimer />

        {/* ═══════════ CTA FINAL ═══════════ */}
        <section style={{ padding: "0 80px 140px" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            style={{
              position: "relative",
              maxWidth: 780,
              margin: "0 auto",
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
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 12px",
                  background: "rgba(220,38,38,0.18)",
                  border: "1px solid rgba(220,38,38,0.50)",
                  borderRadius: 9999,
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "#FCA5A5",
                  marginBottom: 20,
                }}
              >
                <Fire size={12} weight="fill" />
                El precio sube el 31 de diciembre
              </div>

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
                Congela tu acceso a $249/mes.
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
                Después del 31 de diciembre, Creator pasa a $399/mes. Founder
                congela el precio por 6 meses y suma acceso prioritario.
              </p>

              <div
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
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "14px 28px",
                    background: "transparent",
                    color: "#F5F5F7",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: 9999,
                    fontFamily: "var(--pf-font-ui)",
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
                    padding: "14px 28px",
                    background:
                      loadingPlan !== null
                        ? "rgba(139,92,246,0.4)"
                        : "linear-gradient(135deg, #8B5CF6, #EC4899)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 9999,
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    cursor: loadingPlan !== null ? "wait" : "pointer",
                    boxShadow:
                      loadingPlan !== null
                        ? "none"
                        : "0 12px 32px -8px rgba(139,92,246,0.7)",
                  }}
                >
                  {loadingPlan === "founder"
                    ? "Redirigiendo..."
                    : "Comprar Founder — $999"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default PricingPage;
