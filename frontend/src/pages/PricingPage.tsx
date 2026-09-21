// src/pages/PricingPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "../components/marketing/MarketingLayout";

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
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

const PlanCard: React.FC<PlanProps> = ({ name, tagline, price, priceNote, features, cta, highlighted, badge }) => (
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
      boxShadow: highlighted ? "0 20px 40px -12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
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
          <span style={{ marginTop: "3px" }}><Check /></span>
          <span>{f}</span>
        </li>
      ))}
    </ul>

    {cta}
  </div>
);

const PricingPage: React.FC = () => {
  return (
    <MarketingLayout>
      {/* ============ HERO ============ */}
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
            Empezá gratis. Sin tarjeta, sin compromiso. Cuando estés listo para
            más, tenemos planes para vos.
          </p>
        </div>
      </section>

      {/* ============ PLANS ============ */}
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
          <PlanCard
            name="Free"
            tagline="Para empezar y experimentar."
            price="$0"
            priceNote="Sin tarjeta. Sin fecha de vencimiento."
            highlighted
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
            }
          />

          <PlanCard
            name="Premium"
            tagline="Para creadores que necesitan más."
            price="Próximamente"
            priceNote="Estamos trabajando en los planes de pago."
            features={[
              "Todo lo de Free, más:",
              "Flux 2 Klein 4B (edición avanzada de imágenes)",
              "LTX 2.3 (video con audio sincronizado)",
              "Límites ampliados de generación",
              "Mayor retención de archivos",
              "Soporte prioritario",
            ]}
            cta={
              <button
                disabled
                style={{
                  width: "100%",
                  padding: "12px 24px",
                  background: "var(--pf-bg-secondary, #FAFAFA)",
                  color: "var(--pf-text-muted, #A1A1AA)",
                  border: "1px solid var(--pf-border-default, #E5E5E5)",
                  borderRadius: "10px",
                  fontFamily: "var(--pf-font-ui, system-ui)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  cursor: "not-allowed",
                }}
              >
                Próximamente
              </button>
            }
          />

          <PlanCard
            name="Ultra"
            tagline="Para equipos y uso intensivo."
            price="A medida"
            priceNote="Hablemos de tu caso."
            features={[
              "Todo lo de Premium, más:",
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

      {/* ============ FAQ ============ */}
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
                a: "Sí. El plan Free no tiene costo, no requiere tarjeta y no tiene fecha de vencimiento. Podés usarlo todo el tiempo que quieras dentro de los límites indicados.",
              },
              {
                q: "¿Cómo me registro?",
                a: "Con tu cuenta de Google. El proceso completo tarda menos de 30 segundos: elegís tu cuenta, elegís un nombre de usuario y ya podés empezar a crear.",
              },
              {
                q: "¿Qué puedo crear?",
                a: "Con el plan Free, imágenes usando Krea 2 Turbo. Los planes de pago desbloquean Flux 2 (edición avanzada de imágenes) y LTX 2.3 (generación de video con audio).",
              },
              {
                q: "¿Necesito instalar algo?",
                a: "No. Pathfinder funciona completamente en el navegador. No hay que descargar aplicaciones ni configurar nada.",
              },
              {
                q: "¿Cuánto tiempo duran mis creaciones?",
                a: "En el plan Free, las creaciones se almacenan por 7 días. Si querés conservarlas, podés descargarlas en cualquier momento. Los planes de pago tendrán mayor retención.",
              },
              {
                q: "¿Cuándo llegan los planes de pago?",
                a: "Estamos trabajando en ellos. Si querés que te avisemos cuando estén disponibles, escribinos a pathfinder.contacto@gmail.com.",
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

      {/* ============ FINAL CTA ============ */}
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
            to="/auth"
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
            Crear cuenta gratis
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default PricingPage;
