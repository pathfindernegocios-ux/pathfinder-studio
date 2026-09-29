// src/pages/PricingPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  FlaskConical,
  Gauge,
  RefreshCw,
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
// CHECK ICON
// ============================================================
// ============================================================
// COUNTDOWN BAR
// ============================================================
const CountdownBar: React.FC = () => {
  const countdown = useCountdown(LAUNCH_DEADLINE);
  if (!countdown) return null;

  const { days, hours } = countdown;
  const timeText =
    days > 0
      ? `Quedan ${days} ${days === 1 ? "día" : "días"} y ${hours} ${hours === 1 ? "hora" : "horas"}`
      : `Quedan ${hours} ${hours === 1 ? "hora" : "horas"}`;

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(20, 10, 40, 0.7)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
        color: "rgba(255,255,255,0.9)",
        padding: "12px 20px",
        textAlign: "center",
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "0.8125rem",
        fontWeight: 500,
        letterSpacing: "0.02em",
        overflow: "hidden",
      }}
    >
      {/* Blob sutil detrás del contenido */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <span
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <span className="pf-countdown-dot" />
        <span style={{ fontWeight: 700, color: "#FFFFFF" }}>Precio de lanzamiento</span>
        <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
        <span>{timeText}</span>
        <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.65)" }}>Hasta el 31 de diciembre</span>
      </span>
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
  categories: PlanCategory[];
  cta: React.ReactNode;
  highlighted?: boolean;
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
  categories,
  cta,
  highlighted,
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
        border: highlighted ? "1px solid transparent" : "1px solid var(--pf-border-subtle)",
        borderRadius: "24px",
        padding: "36px 28px 28px 28px",
        display: "flex",
        flexDirection: "column",
        boxShadow: highlighted
          ? `0 0 60px -15px ${accent.from}66, 0 20px 40px -12px rgba(0,0,0,0.12)`
          : "0 2px 8px rgba(0,0,0,0.03)",
        transition: "transform 0.2s, box-shadow 0.2s",
        backgroundImage: highlighted
          ? `linear-gradient(var(--pf-bg-elevated), var(--pf-bg-elevated)), linear-gradient(135deg, ${accent.from}, ${accent.to})`
          : undefined,
        backgroundOrigin: highlighted ? "border-box" : undefined,
        backgroundClip: highlighted ? "padding-box, border-box" : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = highlighted
          ? `0 0 80px -15px ${accent.from}88, 0 24px 48px -12px rgba(0,0,0,0.18)`
          : "0 12px 24px -8px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = highlighted
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
      <CountdownBar />

      {/* Hero */}
      <section style={{ padding: "80px 24px 40px", textAlign: "center", background: "#000000" }}>
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
            Accede a una estación con GPU dedicada y workflows preconfigurados
            para imagen, video y audio. Sin créditos por imagen o video, sin
            tokens, sin sorpresas.
          </p>
        </div>
      </section>

      <SignatureBlock />

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
      <section style={{ padding: "64px 24px 80px" }}>
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
            disclaimer="Los modelos del plan Free están sujetos a disponibilidad y pueden cambiar con el tiempo. Para el Estudio completo con todos los modelos, elige Creator o Founder."
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
            priceNote="Sin contrato, cancelas cuando quieras."
            badge="Recomendado"
            highlighted
            showCube
            accent={{ from: "#6366F1", to: "#8B5CF6", text: "#A5B4FC" }}
            categories={[
              {
                title: "Estación",
                items: [
                  "GPU dedicada bajo demanda",
                  "120 h/mes · 30 por semana",
                  "Sin créditos por imagen o video",
                  "Workers duales (Wan, TTS)",
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
                    padding: "12px 24px",
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
                    fontWeight: 600,
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
            tagline="El Estudio completo, con prioridad."
            price="$999"
            priceSuffix="MXN · 6 meses"
            priceNote="Ahorras $495 MXN vs. mensual."
            badge="Acceso prioritario"
            accent={{ from: "#8B5CF6", to: "#EC4899", text: "#C4B5FD" }}
            categories={[
              {
                title: "Todo de Creator",
                items: [
                  "Mismos modelos, misma estación",
                  "Sin créditos por imagen o video",
                ],
              },
              {
                title: "Prioridad Founder",
                items: [
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
                    padding: "12px 24px",
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
                    padding: "12px 24px",
                    background: "transparent",
                    color: "var(--pf-text-primary)",
                    border: "1px solid rgba(139,92,246,0.4)",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    cursor: loadingPlan !== null ? "wait" : "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (loadingPlan === null) {
                      e.currentTarget.style.borderColor = "#8B5CF6";
                      e.currentTarget.style.background = "rgba(139,92,246,0.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {loadingPlan === "founder"
                    ? "Redirigiendo a Stripe..."
                    : "Comprar Founder — $999"}
                </button>
              )
            }
          />
        </div>
      </section>

      <NewModelsBlock />

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
                q: "¿Qué son las 120 horas al mes?",
                a: "Cada plan incluye hasta 120 horas al mes de estación activa, con un límite de 30 horas por semana. Las horas se descuentan solo cuando tu estación está encendida: si no generas nada durante una hora, se apaga sola para no consumir tu cuota. El tiempo de carga de cada modelo también se descuenta, porque la estación permanece encendida durante el proceso. Las horas no utilizadas no se acumulan para el siguiente mes.",
              },
              {
                q: "¿Qué pasa cuando cambio de modelo?",
                a: "Depende del modelo. Wan 2.1 (i2v y t2v), OmniVoice e Index TTS cambian sin reiniciar la estación: alternas entre ellos con un clic. Krea 2 Turbo, Flux 2 Klein 4B y LTX 2.5 MSR requieren volver a cargar pesos, lo que consume unos minutos de estación. LTX 2.3 reinicia la estación por completo, porque es el modelo más pesado. En todos los casos, el tiempo que la estación permanece encendida durante el cambio se descuenta de tu cuota.",
              },
              {
                q: "¿Necesito algo para empezar?",
                a: "Sí. Además de tu cuenta en Pathfinder, necesitas una cuenta de Kaggle (gratuita) para activar tu estación. La primera vez que uses un modelo vas a configurar tu entorno; a partir de ahí, cada sesión es más rápida. La guía paso a paso te lleva de cero a tu primera imagen en menos de 15 minutos.",
              },
              {
                q: "¿Qué incluye el plan Free?",
                a: "Krea 2 Turbo (imagen), Wan 2.1 i2v (imagen a video) y Wan 2.1 t2v (texto a video). Incluye el Studio de creación y acceso a Mis Creaciones con retención de 7 días. Los modelos del plan Free están sujetos a disponibilidad y pueden cambiar con el tiempo. Para el Estudio completo con todos los modelos, elige Creator o Founder.",
              },
              {
                q: "¿Qué diferencia hay entre Free y Creator?",
                a: "El plan Free es para probar Pathfinder y descubrir qué puedes crear. El plan Creator desbloquea el Estudio completo: todos los modelos actuales (Flux 2, LTX 2.3, LTX 2.5 MSR, Wan i2v, OmniVoice), todos los workflows, presets, LoRAs integradas, y todos los modelos que agreguemos en el futuro sin costo extra.",
              },
              {
                q: "¿Qué incluye Creator?",
                a: "El Estudio completo con todos los modelos del catálogo: Flux 2 Klein 4B, LTX 2.3, LTX 2.5 MSR, Wan 2.1 i2v y t2v, OmniVoice, más Krea 2 Turbo. Incluye todos los workflows, presets, LoRAs curadas, y los modelos que se agreguen en el futuro sin costo adicional. Renovación mensual, cancelas cuando quieras.",
              },
              {
                q: "¿Qué incluye Founder?",
                a: "Todo lo de Creator por 6 meses, con acceso prioritario: los nuevos modelos, plantillas y funcionalidades llegan primero a los usuarios Founder. Es un pago único de $999 MXN con precio de lanzamiento hasta el 31 de diciembre de 2026.",
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

      {/* Final CTA */}
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
              lineHeight: 1.6,
            }}
          >
            Sin tarjeta. Sin compromiso. Tu estación con GPU dedicada, lista
            para crear desde el primer minuto.
          </p>
          <Link
            to={session ? "/studio" : "/auth"}
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
            {session ? "Ir al Studio" : "Crear cuenta gratis"}
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default PricingPage;
