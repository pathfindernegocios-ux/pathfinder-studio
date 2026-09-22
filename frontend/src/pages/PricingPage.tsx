// src/pages/PricingPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MarketingLayout from "../components/marketing/MarketingLayout";
import { useAuth } from "../hooks/useAuth";
import { useModels } from "../hooks/useModels";
import { usePurchase } from "../hooks/usePurchase";

const Check = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#10B981"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface PlanProps {
  name: string;
  tagline: string;
  price: string;
  priceNote?: string;
  features: string[];
  cta: React.ReactNode;
  highlighted?: boolean;
  badge?: string;
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
}) => (
  <div
    style={{
      position: "relative",
      background: "#FFFFFF",
      border: highlighted
        ? "2px solid var(--pf-text-primary, #0A0A0A)"
        : "1px solid var(--pf-border-default, #E5E5E5)",
      borderRadius: "20px",
      padding: "32px 28px",
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
          top: "-12px",
          right: "24px",
          padding: "4px 12px",
          background: "var(--pf-text-primary, #0A0A0A)",
          color: "#FFFFFF",
          borderRadius: "9999px",
          fontFamily: "var(--pf-font-ui, system-ui)",
          fontSize: "0.6875rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {badge}
      </div>
    )}

    <div style={{ marginBottom: "24px" }}>
      <h3
        style={{
          fontFamily: "var(--pf-font-display, system-ui)",
          fontSize: "1.25rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          margin: 0,
          marginBottom: "4px",
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
            marginTop: "6px",
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
        gap: "12px",
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
          <span style={{ marginTop: "3px" }}>
            <Check />
          </span>
          <span>{f}</span>
        </li>
      ))}
    </ul>

    {cta}
  </div>
);

// ---------------------------------------------------------------------------
// Banner de estado post-checkout
// ---------------------------------------------------------------------------
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
          ? "¡Pago confirmado! Estamos activando tu acceso a Flux y LTX. Puede tardar unos segundos."
          : "Cancelaste el proceso de pago. Podés intentarlo de nuevo cuando quieras."}
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

// ---------------------------------------------------------------------------
// PricingPage
// ---------------------------------------------------------------------------
const PricingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const { unlockedIds, refresh: refreshModels } = useModels();
  const { state: purchaseState, error: purchaseError, startCheckout } = usePurchase();

  const status = searchParams.get("status");
  const [showBanner, setShowBanner] = useState(false);

  const hasPro = unlockedIds.has("flux-2-klein-4b") || unlockedIds.has("ltx-2.3");

  // Detectar ?status=success o ?status=cancelled
  useEffect(() => {
    if (status === "success" || status === "cancelled") {
      setShowBanner(true);

      if (status === "success") {
        // Refrescar modelos varias veces: el webhook puede tardar unos segundos
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
    // Limpiar query params
    const next = new URLSearchParams(searchParams);
    next.delete("status");
    setSearchParams(next, { replace: true });
  };

  return (
    <MarketingLayout>
      {/* Hero */}
      <section style={{ padding: "80px 24px 40px", textAlign: "center" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h1
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: "20px",
            }}
          >
            Precios simples
          </h1>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1.0625rem",
              lineHeight: 1.55,
              color: "var(--pf-text-secondary, #525252)",
              margin: 0,
            }}
          >
            Empezá gratis con Krea. Desbloqueá Flux y LTX con Pathfinder Pro
            Beta. Sin suscripciones, sin cargos recurrentes.
          </p>
        </div>
      </section>

      {/* Banner post-checkout */}
      {showBanner && status && (status === "success" || status === "cancelled") && (
        <StatusBanner type={status} onDismiss={handleDismissBanner} />
      )}

      {/* Error de checkout */}
      {purchaseError && (
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto 24px",
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
      )}

      {/* Cómo funciona */}
      <section style={{ padding: "20px 24px 40px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div
            style={{
              background: "var(--pf-bg-secondary, #FAFAFA)",
              border: "1px solid var(--pf-border-subtle, #F4F4F5)",
              borderRadius: "20px",
              padding: "40px 32px",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--pf-font-display, system-ui)",
                fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                textAlign: "center",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              ¿Cómo funciona Pathfinder Pro?
            </h2>
            <p
              style={{
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.9375rem",
                color: "var(--pf-text-secondary, #525252)",
                textAlign: "center",
                maxWidth: "560px",
                margin: "0 auto 40px",
                lineHeight: 1.5,
              }}
            >
              Pathfinder combina una interfaz unificada con estaciones de cómputo
              que corren en tu navegador. Configurás tu estación una vez, y después
              generás sin fricción.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "24px",
              }}
            >
              {[
                {
                  n: "01",
                  title: "Comprás Pathfinder Pro",
                  body: "Pago único de $399 MXN. Desbloqueás Flux y LTX inmediatamente.",
                },
                {
                  n: "02",
                  title: "Descargás tu notebook",
                  body: "Un archivo por modelo desde Mi Estación. Sin configuración manual.",
                },
                {
                  n: "03",
                  title: "Ejecutás \"Run All\" en Kaggle",
                  body: "Con tu cuenta gratuita de Kaggle. La estación queda lista en ~2 minutos.",
                },
                {
                  n: "04",
                  title: "Generás desde Pathfinder",
                  body: "El Studio detecta tu estación y podés usar los modelos Pro.",
                },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontFamily: "var(--pf-font-display, system-ui)",
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color: "var(--pf-text-muted, #A1A1AA)",
                      letterSpacing: "-0.04em",
                      marginBottom: "10px",
                    }}
                  >
                    {s.n}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--pf-font-display, system-ui)",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      margin: 0,
                      marginBottom: "6px",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--pf-font-ui, system-ui)",
                      fontSize: "0.8125rem",
                      lineHeight: 1.55,
                      color: "var(--pf-text-secondary, #525252)",
                      margin: 0,
                    }}
                  >
                    {s.body}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "32px",
                paddingTop: "24px",
                borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.8125rem",
                lineHeight: 1.6,
                color: "var(--pf-text-secondary, #525252)",
              }}
            >
              <strong style={{ color: "var(--pf-text-primary, #0A0A0A)" }}>
                Importante:
              </strong>{" "}
              Pathfinder no incluye el cómputo. Los modelos Pro corren sobre tu
              cuenta gratuita de Kaggle. Esto es lo que nos permite ofrecer
              acceso a Flux y LTX a $399 MXN en lugar de una suscripción mensual.
              Cuando termines de crear, apagás tu estación desde Pathfinder y
              liberás la GPU automáticamente.
            </div>
          </div>
        </div>
      </section>

      {/* Planes */}
      <section style={{ padding: "40px 24px 80px" }}>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {/* Plan Free */}
          <PlanCard
            name="Free"
            tagline="Para empezar y experimentar."
            price="$0"
            priceNote="Sin tarjeta. Sin fecha de vencimiento."
            badge="Disponible"
            features={[
              "Krea 2 Turbo (generación de imágenes)",
              "Hasta 15 generaciones por hora",
              "Hasta 50 generaciones por día",
              "100 creaciones activas",
              "Acceso completo al Studio",
              "Retención de archivos: 7 días",
            ]}
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
                    color: "#FFFFFF",
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
                    color: "#FFFFFF",
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

          {/* Plan Pro Beta */}
          <PlanCard
            name="Pathfinder Pro Beta"
            tagline="Acceso a los modelos premium por 6 meses."
            price="$399 MXN"
            priceNote="Pago único. Sin cargos recurrentes."
            badge={hasPro ? "Ya activo" : "Disponible"}
            highlighted
            features={[
              "Todo lo de Free, más:",
              "Flux 2 Klein 4B (edición avanzada)",
              "LTX 2.3 (video con audio sincronizado)",
              "6 meses de acceso desde el pago",
              "Actualizaciones del catálogo Pro incluidas",
              "Renovación disponible al vencimiento",
            ]}
            cta={
              !session ? (
                <Link
                  to="/auth"
                  style={{
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                    padding: "12px 24px",
                    background: "var(--pf-text-primary, #0A0A0A)",
                    color: "#FFFFFF",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                  }}
                >
                  Iniciar sesión para pagar
                </Link>
              ) : hasPro ? (
                <div
                  style={{
                    width: "100%",
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
                  ✓ Ya tenés Pro activo
                </div>
              ) : (
                <button
                  onClick={startCheckout}
                  disabled={purchaseState === "loading"}
                  style={{
                    width: "100%",
                    padding: "12px 24px",
                    background:
                      purchaseState === "loading"
                        ? "var(--pf-bg-tertiary, #F5F5F5)"
                        : "var(--pf-text-primary, #0A0A0A)",
                    color:
                      purchaseState === "loading"
                        ? "var(--pf-text-muted, #A1A1AA)"
                        : "#FFFFFF",
                    border: "none",
                    borderRadius: "10px",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    cursor: purchaseState === "loading" ? "wait" : "pointer",
                    transition: "opacity 0.15s",
                  }}
                >
                  {purchaseState === "loading"
                    ? "Redirigiendo a Stripe..."
                    : "Desbloquear Pro — $399"}
                </button>
              )
            }
          />

          {/* Plan Ultra */}
          <PlanCard
            name="Ultra"
            tagline="Para equipos y uso intensivo."
            price="A medida"
            priceNote="Hablemos de tu caso."
            features={[
              "Todo lo de Pro, más:",
              "Sin límites de generación",
              "Acceso anticipado a nuevos modelos",
              "Onboarding y soporte dedicados",
              "SLA empresarial (a definir)",
            ]}
            cta={
              <a
                href="mailto:pathfinder.contacto@gmail.com?subject=Consulta%20Plan%20Ultra"
                style={{
                  display: "block",
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "12px 24px",
                  background: "transparent",
                  color: "var(--pf-text-primary, #0A0A0A)",
                  border: "1px solid var(--pf-border-default, #E5E5E5)",
                  borderRadius: "10px",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                }}
              >
                Contactanos
              </a>
            }
          />
        </div>
      </section>

      {/* FAQ */}
      <section
        style={{
          padding: "80px 24px",
          background: "var(--pf-bg-secondary, #FAFAFA)",
          borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              textAlign: "center",
              margin: 0,
              marginBottom: "40px",
            }}
          >
            Preguntas frecuentes
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              {
                q: "¿Es realmente gratis?",
                a: "Sí. El plan Free no tiene costo, no requiere tarjeta y no tiene fecha de vencimiento. Podés usar Krea todo el tiempo que quieras dentro de los límites indicados.",
              },
              {
                q: "¿Qué incluye Pathfinder Pro Beta?",
                a: "Acceso a Flux 2 Klein 4B y LTX 2.3 por 6 meses desde la fecha de pago. Además de Krea 2 Turbo, que ya tenés en Free. Incluye todas las mejoras del catálogo Pro que se incorporen durante ese período.",
              },
              {
                q: "¿Es una suscripción?",
                a: "No. Es un pago único de $399 MXN que te da acceso a los modelos Pro por 6 meses. Al término, podés renovar o seguir usando el plan Free sin perder nada.",
              },
              {
                q: "¿Puedo pedir reembolso?",
                a: "Sí. Dentro de los primeros 14 días naturales después de tu compra, podés solicitar el reembolso completo sin necesidad de justificación, escribiéndonos a pathfinder.contacto@gmail.com.",
              },
              {
                q: "¿Necesito instalar algo?",
                a: "No. Pathfinder funciona completamente en el navegador. No hay que descargar aplicaciones ni configurar nada.",
              },
              {
                q: "¿Cuánto tiempo duran mis creaciones?",
                a: "En ambos planes, las creaciones se almacenan por 7 días. Si querés conservarlas, podés descargarlas en cualquier momento.",
              },
              {
                q: "¿Qué métodos de pago aceptan?",
                a: "Tarjetas de crédito y débito (Visa, Mastercard, American Express), Apple Pay y Google Pay. El pago se procesa de forma segura a través de Stripe.",
              },
            ].map((f, i) => (
              <details
                key={i}
                style={{
                  background: "#FFFFFF",
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

      {/* CTA final */}
      <section
        style={{
          padding: "100px 24px",
          background: "var(--pf-text-primary, #0A0A0A)",
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
            Empezá ahora, gratis
          </h2>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "32px",
              lineHeight: 1.5,
            }}
          >
            Sin tarjeta. Sin límite de tiempo. Solo tu idea y las herramientas
            para hacerla realidad.
          </p>
          <Link
            to={session ? "/studio" : "/auth"}
            style={{
              textDecoration: "none",
              display: "inline-block",
              padding: "16px 40px",
              background: "#FFFFFF",
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
