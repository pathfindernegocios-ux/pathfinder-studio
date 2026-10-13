// src/pages/HomePage.tsx
// Landing — FUTURISMO · ISOLATED SYSTEM · VOID
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import {
  Cube,
  Lightning,
  Stack,
  Broadcast,
  ArrowRight,
  Terminal,
  Shield,
  Cpu,
} from "@phosphor-icons/react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import { useAuth } from "../hooks/useAuth";
import { fadeInUp, staggerContainer } from "../design/motion";

// ═══════════════════════════════════════════════════════════════════════════
// MODULE — sistema aislado
// ═══════════════════════════════════════════════════════════════════════════
const Module: React.FC<{
  children: React.ReactNode;
  crosshair?: boolean;
  label?: string;
  chrome?: boolean;
  bioluminescent?: boolean;
  style?: React.CSSProperties;
}> = ({ children, crosshair, label, chrome, bioluminescent, style }) => (
  <div
    className={[
      "pf-module",
      crosshair ? "pf-module--crosshair" : "",
      chrome ? "pf-chrome-border" : "",
      bioluminescent ? "pf-bioluminescent" : "",
    ].filter(Boolean).join(" ")}
    style={{ position: "relative", overflow: "hidden", ...style }}
  >
    {label && <span className="pf-module-label">{label}</span>}
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MODULE LABEL — cabecera de módulo
// ═══════════════════════════════════════════════════════════════════════════
const ModuleHeader: React.FC<{ code: string; title: string }> = ({ code, title }) => (
  <div style={{
    display: "flex",
    alignItems: "baseline",
    gap: 12,
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontFamily: "var(--pf-font-mono)",
    fontSize: "0.6875rem",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  }}>
    <span style={{ color: "#8B5CF6" }}>{code}</span>
    <span style={{ opacity: 0.4 }}>·</span>
    <span>{title}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// HERO STUDIO MOCK — HUD real, no screenshot
// ═══════════════════════════════════════════════════════════════════════════
const StudioMock: React.FC = () => (
  <div style={{
    position: "relative",
    background: "#08080A",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    overflow: "hidden",
    fontFamily: "var(--pf-font-mono)",
    fontSize: "0.6875rem",
  }}>
    {/* Topbar */}
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 14px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.01)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px rgba(16,185,129,0.8)" }} />
        <span style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.14em" }}>STATION.READY</span>
      </div>
      <span style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em" }}>LAT 00:02:41 · SEED 2841053</span>
    </div>

    {/* Body: split — selector + canvas */}
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", minHeight: 320 }}>
      {/* Panel de modelos */}
      <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", padding: "14px 12px" }}>
        <div style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em", marginBottom: 10 }}>MDL.SELECT</div>
        {[
          { id: "krea-2", label: "KREA.2", active: true },
          { id: "qwen-21", label: "QWEN.2.1" },
          { id: "flux-2", label: "FLUX.2" },
          { id: "ltx-23", label: "LTX.2.3" },
          { id: "tts-dual", label: "TTS.DUAL" },
        ].map((m) => (
          <div key={m.id} style={{
            padding: "8px 10px",
            marginBottom: 4,
            borderRadius: 4,
            background: m.active ? "rgba(139,92,246,0.10)" : "transparent",
            border: m.active ? "1px solid rgba(139,92,246,0.35)" : "1px solid transparent",
            color: m.active ? "#F5F5F7" : "rgba(255,255,255,0.45)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            {m.active && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#8B5CF6", boxShadow: "0 0 6px rgba(139,92,246,0.9)" }} />}
            {m.label}
          </div>
        ))}
      </div>

      {/* Canvas mock */}
      <div style={{ padding: 14, position: "relative" }} className="pf-grid-inside">
        {/* Área de output */}
        <div style={{
          aspectRatio: "16/10",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 6,
          background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(34,211,238,0.03))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            fontFamily: "var(--pf-font-mono)",
            fontSize: "0.625rem",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.25)",
          }}>
            ▓ OUTPUT.001 · 1024×1024 · DONE 0.8s
          </div>
          {/* Crosshair corners */}
          <div style={{ position: "absolute", top: 8, left: 8, width: 6, height: 6, borderColor: "rgba(139,92,246,0.5)", borderStyle: "solid", borderWidth: "1px 0 0 1px" }} />
          <div style={{ position: "absolute", bottom: 8, right: 8, width: 6, height: 6, borderColor: "rgba(139,92,246,0.5)", borderStyle: "solid", borderWidth: "0 1px 1px 0" }} />
        </div>

        {/* Prompt bar */}
        <div style={{
          padding: "8px 12px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 4,
          color: "rgba(255,255,255,0.5)",
        }}>
          &gt; retrato editorial, luz cálida lateral, cinematográfico, 85mm_
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// HOMEPAGE
// ═══════════════════════════════════════════════════════════════════════════
const HomePage: React.FC = () => {
  const { session } = useAuth();

  return (
    <MarketingLayout>
      {/* ═══════════════ HERO ═══════════════ */}
      <section style={{
        position: "relative",
        background: "#000000",
        padding: "80px 32px 0",
        overflow: "hidden",
      }}>
        {/* Starfield en el vacío */}
        <div className="pf-starfield" style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Meta line */}
            <motion.div variants={fadeInUp} style={{
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              marginBottom: 32,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}>
              <span>SYS.PATHFINDER</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>v2.1</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span><NumberFlow value={10} format={{ useGrouping: false }} /> MODELOS ACTIVOS</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: "#10B981" }}>● ONLINE</span>
            </motion.div>

            {/* Números hero con chrome */}
            <motion.div variants={fadeInUp} style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 24,
              marginBottom: 56,
              maxWidth: 900,
            }}>
              {[
                { n: 10, label: "MODELOS" },
                { n: 3, label: "IMG" },
                { n: 5, label: "VID" },
                { n: 2, label: "AUD" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="pf-chrome-text" style={{
                    fontFamily: "var(--pf-font-display)",
                    fontSize: "clamp(4rem, 10vw, 7rem)",
                    fontWeight: 500,
                    lineHeight: 0.9,
                    letterSpacing: "-0.04em",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    <NumberFlow value={s.n} format={{ useGrouping: false }} />
                  </div>
                  <div style={{
                    fontFamily: "var(--pf-font-mono)",
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                    letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 8,
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Título */}
            <motion.h1 variants={fadeInUp} style={{
              fontFamily: "var(--pf-font-display)",
              fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.0,
              color: "#F5F5F7",
              margin: 0,
              marginBottom: 24,
              maxWidth: 820,
            }}>
              Estación creativa<br />
              para imagen, video y audio.
            </motion.h1>

            <motion.p variants={fadeInUp} style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "1.0625rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.55)",
              maxWidth: 620,
              margin: 0,
              marginBottom: 40,
            }}>
              Diez modelos curados. Workflows listos. Cero créditos por generación.
              Enciende tu estación, elige tu modelo y crea.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInUp} style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 56,
            }}>
              <Link to={session ? "/studio" : "/auth"} className="pf-cta-glow" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 24px",
                background: "#8B5CF6",
                color: "#FFFFFF",
                borderRadius: 6,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                textDecoration: "none",
              }}>
                {session ? "Ir al Studio" : "Empezar gratis"}
                <ArrowRight size={16} weight="bold" />
              </Link>
              <Link to="/pricing" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 24px",
                background: "transparent",
                color: "#F5F5F7",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 6,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                textDecoration: "none",
              }}>
                Ver planes
              </Link>
            </motion.div>

            {/* Studio mock — módulo aislado */}
            <motion.div variants={fadeInUp} style={{ marginBottom: 0 }}>
              <Module label="STUDIO.PREVIEW" crosshair style={{ background: "#0E0E11" }}>
                <ModuleHeader code="SYS.STUDIO" title="Pathfinder Studio · Live" />
                <div style={{ padding: 16 }}>
                  <StudioMock />
                </div>
              </Module>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section style={{ background: "#000000", padding: "120px 32px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              marginBottom: 16,
            }}>
              CAPABILITIES
            </div>
            <h2 style={{
              fontFamily: "var(--pf-font-display)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "#F5F5F7",
              margin: 0,
              maxWidth: 720,
            }}>
              Un sistema aislado. Todo contenido.
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {[
              { Icon: Cube, code: "SYS.01", title: "Estudio completo", body: "Diez modelos curados para imagen, video y audio. Un solo entorno para toda tu producción.", accent: "#8B5CF6", chrome: true },
              { Icon: Lightning, code: "SYS.02", title: "Workers duales", body: "Cambia entre tareas sin reiniciar. Wan i2v + t2v en un workflow. OmniVoice + Index TTS en otro.", accent: "#22D3EE" },
              { Icon: Stack, code: "SYS.03", title: "Sin créditos", body: "Dentro de tu cuota, generas lo que quieras. Sin tokens, sin unidades, sin sorpresas.", accent: "#EC4899" },
              { Icon: Broadcast, code: "SYS.04", title: "Tu propia estación", body: "Enciendes tu cómputo cuando lo necesitas. Dedicado solo para ti durante tu sesión.", accent: "#10B981" },
            ].map((f) => (
              <Module key={f.code} chrome={f.chrome} bioluminescent crosshair label={f.code} style={{ padding: 0 }}>
                <div style={{ padding: "28px 24px" }}>
                  <div style={{
                    width: 40, height: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${f.accent}40`,
                    borderRadius: 6,
                    background: `${f.accent}10`,
                    color: f.accent,
                    marginBottom: 20,
                  }}>
                    <f.Icon size={20} weight="regular" />
                  </div>
                  <h3 style={{
                    fontFamily: "var(--pf-font-display)",
                    fontSize: "1.0625rem",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: "#F5F5F7",
                    margin: 0,
                    marginBottom: 8,
                  }}>
                    {f.title}
                  </h3>
                  <p style={{
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.5)",
                    margin: 0,
                  }}>
                    {f.body}
                  </p>
                </div>
              </Module>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CÓMO FUNCIONA ═══════════════ */}
      <section style={{ background: "#000000", padding: "120px 32px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              marginBottom: 16,
            }}>
              SEQUENCE
            </div>
            <h2 style={{
              fontFamily: "var(--pf-font-display)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "#F5F5F7",
              margin: 0,
              maxWidth: 720,
            }}>
              Del registro al output en cuatro pasos.
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}>
            {[
              { n: "01", title: "Registra tu cuenta", body: "Con Google, en 20 segundos. Sin formularios." },
              { n: "02", title: "Elige tu modelo", body: "Diez modelos curados. Cada uno con su workflow listo." },
              { n: "03", title: "Enciende tu estación", body: "Descarga, activa, conecta. La primera vez tarda unos minutos; después arranca más rápido." },
              { n: "04", title: "Crea y descarga", body: "Genera dentro de tu cuota y baja tus resultados desde Mis Creaciones." },
            ].map((s) => (
              <Module key={s.n} crosshair label={`SEQ.${s.n}`} style={{ padding: 0 }}>
                <div style={{ padding: "24px 22px" }}>
                  <div style={{
                    fontFamily: "var(--pf-font-display)",
                    fontSize: "3rem",
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    color: "#8B5CF6",
                    marginBottom: 16,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {s.n}
                  </div>
                  <h3 style={{
                    fontFamily: "var(--pf-font-display)",
                    fontSize: "1rem",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: "#F5F5F7",
                    margin: 0,
                    marginBottom: 8,
                  }}>
                    {s.title}
                  </h3>
                  <p style={{
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.5)",
                    margin: 0,
                  }}>
                    {s.body}
                  </p>
                </div>
              </Module>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUST ROW ═══════════════ */}
      <section style={{ background: "#000000", padding: "0 32px 120px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <Module label="TRUST.MATRIX" crosshair style={{ padding: 0 }}>
            <ModuleHeader code="SYS.INFRA" title="Por qué Pathfinder" />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}>
              {[
                { Icon: Shield, code: "01", title: "Workflows probados", body: "Cada pipeline corre pruebas antes de publicarse." },
                { Icon: Cpu, code: "02", title: "Infra robusta", body: "Heartbeat, túnel dual y apagado de seguridad." },
                { Icon: Stack, code: "03", title: "Modelos que crecen", body: "Actualizaciones continuas sobre los mismos workflows." },
                { Icon: Terminal, code: "04", title: "Soporte directo", body: "Acompañamiento en cada paso del proceso." },
              ].map((t, i) => (
                <div key={t.code} style={{
                  padding: "28px 22px",
                  borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <t.Icon size={18} color="#8B5CF6" weight="regular" />
                    <span style={{
                      fontFamily: "var(--pf-font-mono)",
                      fontSize: "0.625rem",
                      letterSpacing: "0.14em",
                      color: "rgba(255,255,255,0.35)",
                    }}>
                      INFRA.{t.code}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "var(--pf-font-display)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "#F5F5F7",
                    marginBottom: 6,
                  }}>
                    {t.title}
                  </div>
                  <div style={{
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.8125rem",
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.5)",
                  }}>
                    {t.body}
                  </div>
                </div>
              ))}
            </div>
          </Module>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL ═══════════════ */}
      <section style={{ background: "#000000", padding: "0 32px 120px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <Module label="SYS.END" crosshair chrome style={{ padding: 0 }}>
            <div style={{ padding: "64px 48px", textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--pf-font-mono)",
                fontSize: "0.6875rem",
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.4)",
                marginBottom: 24,
              }}>
                ● STANDBY · WAITING FOR OPERATOR
              </div>
              <h2 style={{
                fontFamily: "var(--pf-font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 20,
              }}>
                Inicia tu secuencia.
              </h2>
              <p style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1rem",
                color: "rgba(255,255,255,0.55)",
                margin: 0,
                marginBottom: 32,
                maxWidth: 480,
                marginLeft: "auto",
                marginRight: "auto",
                lineHeight: 1.6,
              }}>
                Plan Free con 3 modelos. Sin tarjeta. Sin fecha de vencimiento.
              </p>
              <Link to="/auth" className="pf-cta-glow" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                background: "#8B5CF6",
                color: "#FFFFFF",
                borderRadius: 6,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                textDecoration: "none",
              }}>
                Empezar gratis
                <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
          </Module>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default HomePage;
