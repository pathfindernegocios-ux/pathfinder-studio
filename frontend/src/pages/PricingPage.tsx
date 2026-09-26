// src/pages/PricingPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  FlaskConical,
  Gauge,
  RefreshCw,
  Sparkles,
  Check as CheckIcon,
} from "lucide-react";
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
    }, 60_000); // cada minuto
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
const Check = () => (
  <CheckIcon
    size={16}
    style={{ color: "#10B981", flexShrink: 0, marginTop: "3px" }}
    strokeWidth={2.5}
  />
);

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
        background: "var(--pf-text-primary, #0A0A0A)",
        color: "var(--pf-text-inverse, #FFFFFF)",
        padding: "10px 20px",
        textAlign: "center",
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "0.8125rem",
        fontWeight: 500,
        letterSpacing: "0.01em",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#10B981",
            boxShadow: "0 0 0 3px rgba(16,185,129,0.25)",
          }}
        />
        <span style={{ fontWeight: 700 }}>Precio de lanzamiento</span>
        <span style={{ opacity: 0.85 }}>·</span>
        <span>{timeText}</span>
        <span style={{ opacity: 0.85 }}>·</span>
        <span style={{ opacity: 0.85 }}>Hasta el 31 de diciembre</span>
      </span>
    </div>
  );
};

// ============================================================
// PLAN CARD
// ============================================================
interface PlanProps {
  name: string;
  tagline: string;
  price: string;
  priceNote?: string;
  features: string[];
  cta: React.ReactNode;
  highlighted?: boolean;
  badge?: string;
  badgeSubtitle?: string;
  badgeVariant?: "recommended" | "priority" | "trial";
  disclaimer?: string;
}

const PlanCard: React.FC<PlanProps> = ({
  name,
  tagline,
  price,
  priceNote,
  features,
  cta,
  highlighted,
  badge,
  badgeSubtitle,
  badgeVariant = "recommended",
  disclaimer,
}) => {
  const badgeStyles = (() => {
    switch (badgeVariant) {
      case "priority":
        return {
          bg: "var(--pf-text-primary, #0A0A0A)",
          color: "var(--pf-text-inverse, #FFFFFF)",
          border: "none",
        };
      case "trial":
        return {
          bg: "var(--pf-bg-tertiary, #F5F5F5)",
          color: "var(--pf-text-secondary, #525252)",
          border: "1px solid var(--pf-border-default, #E5E5E5)",
        };
      default:
        return {
          bg: "var(--pf-text-primary, #0A0A0A)",
          color: "var(--pf-text-inverse, #FFFFFF)",
          border: "none",
        };
    }
  })();

  return (
    <div
      style={{
        position: "relative",
        background: "var(--pf-bg-elevated)",
        border: highlighted
          ? "2px solid var(--pf-text-primary, #0A0A0A)"
          : "1px solid var(--pf-border-default, #E5E5E5)",
        borderRadius: "20px",
        padding: "40px 28px 32px 28px",
        display: "flex",
        flexDirection: "column",
        boxShadow: highlighted
          ? "0 20px 40px -12px rgba(0,0,0,0.15)"
          : "0 2px 8px rgba(0,0,0,0.03)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = highlighted
          ? "0 24px 48px -12px rgba(0,0,0,0.2)"
          : "0 12px 24px -8px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = highlighted
          ? "0 20px 40px -12px rgba(0,0,0,0.15)"
          : "0 2px 8px rgba(0,0,0,0.03)";
      }}
    >
      {badge && (
        <div
          style={{
            position: "absolute",
            top: "-14px",
            right: "24px",
            padding: "6px 14px",
            background: badgeStyles.bg,
            color: badgeStyles.color,
            border: badgeStyles.border,
            borderRadius: "9999px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.6875rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {badge}
        </div>
      )}

      <div style={{ marginBottom: badgeSubtitle ? "8px" : "24px" }}>
        <h3
          style={{
            fontFamily: "var(--pf-font-display, system-ui)",
            fontSize: "1.25rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: 0,
            marginBottom: "6px",
            color: "var(--pf-text-primary, #0A0A0A)",
          }}
        >
          {name}
        </h3>
        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.8125rem",
            color: "var(--pf-text-secondary, #525252)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {tagline}
        </p>
      </div>

      {badgeSubtitle && (
        <div
          style={{
            marginBottom: "24px",
            padding: "10px 14px",
            background:
              badgeVariant === "priority"
                ? "rgba(99,102,241,0.08)"
                : "var(--pf-bg-secondary, #FAFAFA)",
            border:
              badgeVariant === "priority"
                ? "1px solid rgba(99,102,241,0.3)"
                : "1px solid var(--pf-border-subtle, #F4F4F5)",
            borderRadius: "10px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.75rem",
            lineHeight: 1.5,
            color:
              badgeVariant === "priority"
                ? "#4F46E5"
                : "var(--pf-text-secondary, #525252)",
          }}
        >
          {badgeSubtitle}
        </div>
      )}

      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            fontFamily: "var(--pf-font-display, system-ui)",
            fontSize: "2.5rem",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--pf-text-primary, #0A0A0A)",
            lineHeight: 1,
          }}
        >
          {price}
        </div>
        {priceNote && (
          <div
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.75rem",
              color: "var(--pf-text-muted, #A1A1AA)",
              marginTop: "8px",
              lineHeight: 1.5,
            }}
          >
            {priceNote}
          </div>
        )}
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          marginBottom: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "11px",
          flex: 1,
        }}
      >
        {features.map((f, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.875rem",
              color: "var(--pf-text-secondary, #525252)",
              lineHeight: 1.5,
            }}
          >
            <Check />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {disclaimer && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px 12px",
            background: "var(--pf-bg-secondary, #FAFAFA)",
            border: "1px solid var(--pf-border-subtle, #F4F4F5)",
            borderRadius: "8px",
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.6875rem",
            color: "var(--pf-text-muted, #A1A1AA)",
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
        background: "var(--pf-bg-secondary, #FAFAFA)",
        borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
        borderBottom: "1px solid var(--pf-border-subtle, #F4F4F5)",
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
            color: "var(--pf-text-primary, #0A0A0A)",
          }}
        >
          Pathfinder ingeniería a tu medida
        </h2>
        <p
          style={{
            fontFamily: "var(--pf-font-ui, system-ui)",
            fontSize: "0.9375rem",
            color: "var(--pf-text-secondary, #525252)",
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
                  background: "var(--pf-bg-elevated, #FFFFFF)",
                  border: "1px solid var(--pf-border-default, #E5E5E5)",
                  color: "var(--pf-text-primary, #0A0A0A)",
                  marginBottom: "16px",
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
                  color: "var(--pf-text-primary, #0A0A0A)",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.6,
                  color: "var(--pf-text-secondary, #525252)",
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
  <section style={{ padding: "80px 24px" }}>
    <div style={{ maxWidth: "780px", margin: "0 auto", textAlign: "center" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "var(--pf-text-primary, #0A0A0A)",
          color: "var(--pf-text-inverse, #FFFFFF)",
          marginBottom: "24px",
        }}
      >
        <Sparkles size={24} />
      </div>
      <h2
        style={{
          fontFamily: "var(--pf-font-display, system-ui)",
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          margin: 0,
          marginBottom: "16px",
          color: "var(--pf-text-primary, #0A0A0A)",
        }}
      >
        Los modelos nuevos entran a tu plan sin costo extra
      </h2>
      <p
        style={{
          fontFamily: "var(--pf-font-ui, system-ui)",
          fontSize: "1.0625rem",
          color: "var(--pf-text-secondary, #525252)",
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
  const hasFounder = false; // TODO: chequear si tiene Founder activo (purchase.paid vigente)

  // Detectar ?status=success|cancelled
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
      {/* Countdown bar */}
      <CountdownBar />

      {/* Hero */}
      <section style={{ padding: "80px 24px 40px", textAlign: "center" }}>
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
              color: "var(--pf-text-primary, #0A0A0A)",
            }}
          >
            Pathfinder para todos
          </h1>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1.0625rem",
              lineHeight: 1.6,
              color: "var(--pf-text-secondary, #525252)",
              margin: 0,
            }}
          >
            Una gran variedad de modelos IA y workflows a tu medida, a un precio
            accesible. Sin créditos, sin tokens, sin sorpresas.
          </p>
        </div>
      </section>

      {/* Signature block */}
      <SignatureBlock />

      {/* Status banner */}
      {showBanner && status && (status === "success" || status === "cancelled") && (
        <div style={{ padding: "24px 24px 0" }}>
          <StatusBanner type={status} onDismiss={handleDismissBanner} />
        </div>
      )}

      {/* Error banner */}
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
            tagline="Descubre qué puedes crear. Sin tarjeta."
            price="$0"
            priceNote="Sin fecha de vencimiento."
            badge="Prueba Pathfinder"
            badgeVariant="trial"
            features={[
              "Krea 2 Turbo (imagen)",
              "Wan 2.1 i2v (imagen a video)",
              "Wan 2.1 t2v (texto a video)",
              "Studio de creación",
              "Mis Creaciones (retención 7 días)",
              "Acceso a la guía de inicio",
              "Requiere cuenta de Kaggle",
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
                    background: "var(--pf-text-primary, #0A0A0A)",
                    color: "var(--pf-text-inverse, #FFFFFF)",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
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
                    background: "var(--pf-text-primary, #0A0A0A)",
                    color: "var(--pf-text-inverse, #FFFFFF)",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
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
            tagline="El Estudio completo. Todos los modelos."
            price="$249 MXN"
            priceNote="Por mes. Sin contrato, cancelas cuando quieras."
            badge="Recomendado"
            badgeVariant="recommended"
            highlighted
            features={[
              "Estudio completo desbloqueado",
              "Flux 2 Klein 4B (imagen con referencias)",
              "LTX 2.3 (video con audio y lipsync)",
              "LTX 2.5 MSR (5 refs + LoRA de producto)",
              "Wan 2.1 i2v + Wan 2.1 t2v",
              "OmniVoice (voz y clonación)",
              "Modelos nuevos incluidos sin pago extra",
              "Mis Creaciones completo",
              "Soporte prioritario",
              "Requiere cuenta de Kaggle",
            ]}
            cta={
              hasCreator ? (
                <div
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 24px",
                    background: "rgba(16,185,129,0.1)",
                    color: "#059669",
                    border: "1px solid rgba(16,185,129,0.4)",
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
                        ? "var(--pf-bg-tertiary, #F5F5F5)"
                        : "var(--pf-text-primary, #0A0A0A)",
                    color:
                      loadingPlan !== null
                        ? "var(--pf-text-muted, #A1A1AA)"
                        : "var(--pf-text-inverse, #FFFFFF)",
                    border: "none",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    cursor: loadingPlan !== null ? "wait" : "pointer",
                    transition: "opacity 0.15s",
                  }}
                >
                  {loadingPlan === "creator"
                    ? "Redirigiendo a Stripe..."
                    : "Suscribirme a Creator — $249/mes"}
                </button>
              )
            }
          />

          {/* Plan Founder */}
          <PlanCard
            name="Founder"
            tagline="Todo lo de Creator, con acceso prioritario."
            price="$999 MXN"
            priceNote="Pago único por 6 meses."
            badge="Acceso prioritario"
            badgeVariant="priority"
            badgeSubtitle="Primeros accesos a nuevos modelos, plantillas y funcionalidades."
            features={[
              "Todo lo de Creator por 6 meses",
              "Acceso prioritario a nuevos modelos",
              "Primeros accesos a plantillas y funcionalidades",
              "Ahorro vs suscripción mensual",
              "Requiere cuenta de Kaggle",
            ]}
            cta={
              hasFounder ? (
                <div
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 24px",
                    background: "rgba(16,185,129,0.1)",
                    color: "#059669",
                    border: "1px solid rgba(16,185,129,0.4)",
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
                    background:
                      loadingPlan !== null
                        ? "var(--pf-bg-tertiary, #F5F5F5)"
                        : "var(--pf-text-primary, #0A0A0A)",
                    color:
                      loadingPlan !== null
                        ? "var(--pf-text-muted, #A1A1AA)"
                        : "var(--pf-text-inverse, #FFFFFF)",
                    border: "none",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    cursor: loadingPlan !== null ? "wait" : "pointer",
                    transition: "opacity 0.15s",
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

      {/* New models block */}
      <NewModelsBlock />

      {/* FAQ */}
      <section
        style={{
          padding: "80px 24px",
          background: "var(--pf-bg-secondary, #FAFAFA)",
          borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
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
              color: "var(--pf-text-primary, #0A0A0A)",
            }}
          >
            Preguntas frecuentes
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
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
                a: "Cada estación de Pathfinder corre en un entorno de ejecución externo que el usuario activa. Desde 'Mi Estación' descargas el notebook del modelo que quieras usar, lo ejecutas en tu cuenta de Kaggle, y Pathfinder lo detecta automáticamente cuando está listo. Es un proceso único por sesión. Cuando esté listo el modo sin fricción (próximamente), esta activación desaparecerá.",
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
        </div>
      </section>

      {/* Final CTA */}
      <section
        style={{
          padding: "100px 24px",
          background: "var(--pf-text-primary, #0A0A0A)",
          color: "var(--pf-text-inverse, #FFFFFF)",
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
              color: "var(--pf-text-inverse, #FFFFFF)",
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
            Sin tarjeta. Sin compromiso. Tres modelos disponibles desde el
            primer minuto.
          </p>
          <Link
            to={session ? "/studio" : "/auth"}
            style={{
              textDecoration: "none",
              display: "inline-block",
              padding: "16px 40px",
              background: "var(--pf-bg-elevated)",
              color: "var(--pf-text-primary, #0A0A0A)",
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
