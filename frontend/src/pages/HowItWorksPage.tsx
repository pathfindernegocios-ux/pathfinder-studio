// src/pages/HowItWorksPage.tsx
// Manual de operación — premium, sin estrellas, mismo ecosistema
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Warning,
  Info,
  Lightbulb,
  CheckCircle,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
  ArrowsClockwise,
  Package,
  Headset,
  Fire,
} from "@phosphor-icons/react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { fadeInUp, staggerContainer } from "../design/motion";

// ---------------------------------------------------------------------------
// MEDIA URLs
// ---------------------------------------------------------------------------
const MEDIA_URLS = {
  step1_register: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/block1-register.png.jpg",
  step1_verify: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/block2-verify.mp4",
  step2_download: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step1-download.mp4",
  step3_kaggle: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step2-activate.mp4",
  step3_colab: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/step3_colab.mp4",
  step4_create: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step3-ready.mp4",
  step5_save_shutdown: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/step5_save_shutdown.mp4",
  step5_shutdown_kaggle: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/step5_shutdown_kaggle.png",
  step5_shutdown_colab: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/step5_shutdown_colab.png",
};

type Platform = "kaggle" | "colab";

const PLATFORM_META: Record<Platform, { label: string; color: string; colorDeep: string; url: string; cta: string; badge: string }> = {
  kaggle: { label: "Kaggle", color: "#20BEFF", colorDeep: "#1E9DE0", url: "https://www.kaggle.com/", cta: "Abrir Kaggle", badge: "30 h/semana" },
  colab: { label: "Colab", color: "#F9AB00", colorDeep: "#FBBC04", url: "https://colab.research.google.com/", cta: "Abrir Colab", badge: "Hasta 12 h" },
};

// ---------------------------------------------------------------------------
// ATMÓSFERA
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
        background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)",
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
        background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, rgba(34,211,238,0.03) 40%, transparent 70%)",
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
// PRIMITIVAS
// ---------------------------------------------------------------------------
const Callout: React.FC<{ kind: "tip" | "info" | "warn"; children: React.ReactNode }> = ({ kind, children }) => {
  const config = {
    tip: { Icon: Lightbulb, border: "rgba(16,185,129,0.30)", bg: "rgba(16,185,129,0.05)", color: "#34D399" },
    info: { Icon: Info, border: "rgba(139,92,246,0.30)", bg: "rgba(139,92,246,0.05)", color: "#A78BFA" },
    warn: { Icon: Warning, border: "rgba(245,158,11,0.30)", bg: "rgba(245,158,11,0.05)", color: "#FBBF24" },
  }[kind];
  return (
    <div style={{
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 10,
      padding: "16px 20px",
      margin: "20px 0",
      display: "flex",
      gap: 12,
      color: config.color,
      fontFamily: "var(--pf-font-ui)",
      fontSize: "0.9375rem",
      lineHeight: 1.65,
    }}>
      <span style={{ flexShrink: 0, marginTop: 2 }}><config.Icon size={18} weight="regular" /></span>
      <div>{children}</div>
    </div>
  );
};

const Step: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
    <CheckCircle size={18} weight="regular" style={{ color: "#A78BFA", flexShrink: 0, marginTop: 4 }} />
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code style={{
    background: "rgba(255,255,255,0.04)",
    padding: "2px 6px",
    borderRadius: 4,
    fontFamily: "var(--pf-font-mono)",
    fontSize: "0.85em",
    color: "#F5F5F7",
  }}>
    {children}
  </code>
);

const MediaBlock: React.FC<{ type: "video" | "image"; label: string; url?: string }> = ({ type, label, url }) => {
  if (url && url.length > 0) {
    if (type === "video") {
      return (
        <div style={{ margin: "28px 0" }}>
          <VideoPlayer src={url} aspectRatio="16/9" objectFit="contain" background="transparent" autoPlay={false} />
        </div>
      );
    }
    return (
      <div style={{
        borderRadius: 12,
        overflow: "hidden",
        margin: "28px 0",
        background: "#141416",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <img src={url} alt={label} style={{ width: "100%", display: "block" }} />
      </div>
    );
  }
  return (
    <div style={{
      aspectRatio: "16/9",
      background: "rgba(139,92,246,0.03)",
      border: "2px dashed rgba(139,92,246,0.20)",
      borderRadius: 12,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      margin: "28px 0",
      color: "rgba(255,255,255,0.4)",
      fontFamily: "var(--pf-font-ui)",
      padding: "40px 20px",
      textAlign: "center",
    }}>
      <PlayCircle size={36} weight="regular" />
      <div style={{ fontSize: "0.9375rem", fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: "var(--pf-font-mono)", fontSize: "0.6875rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>
        Disponible próximamente
      </div>
    </div>
  );
};

const Divider: React.FC = () => (
  <div aria-hidden style={{
    height: 1,
    background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.30) 50%, transparent 100%)",
    margin: "80px 0",
  }} />
);

const BigNumber: React.FC<{ num: string }> = ({ num }) => (
  <div style={{ position: "relative", display: "inline-block", marginBottom: 24 }}>
    <div aria-hidden style={{
      position: "absolute",
      inset: "-40px",
      background: "radial-gradient(circle, rgba(139,92,246,0.20) 0%, transparent 60%)",
      filter: "blur(30px)",
      pointerEvents: "none",
    }} />
    <div style={{
      position: "relative",
      fontFamily: "var(--pf-font-display-alt)",
      fontSize: "clamp(3rem, 6vw, 5rem)",
      fontWeight: 600,
      letterSpacing: "-0.04em",
      lineHeight: 1,
      color: "#F5F5F7",
    }}>
      {num}
    </div>
  </div>
);

const BlockTitle: React.FC<{ num: string; title: string; subtitle?: string }> = ({ num, title, subtitle }) => (
  <div style={{ marginBottom: 48 }}>
    <BigNumber num={num} />
    <h2 style={{
      fontFamily: "var(--pf-font-display-alt)",
      fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
      fontWeight: 600,
      letterSpacing: "-0.03em",
      lineHeight: 1.1,
      color: "#F5F5F7",
      margin: 0,
      marginBottom: subtitle ? 14 : 0,
    }}>
      {title}
    </h2>
    {subtitle && (
      <p style={{
        fontFamily: "var(--pf-font-ui)",
        fontSize: "1rem",
        lineHeight: 1.6,
        color: "rgba(255,255,255,0.55)",
        margin: 0,
        maxWidth: 620,
      }}>
        {subtitle}
      </p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// COLUMNA PLATAFORMA
// ---------------------------------------------------------------------------
const PlatformColumn: React.FC<{
  platform: Platform;
  showPlatformButton?: boolean;
  children: React.ReactNode;
}> = ({ platform, showPlatformButton, children }) => {
  const meta = PLATFORM_META[platform];
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        padding: "36px 32px",
        background: "#0F0F11",
        border: `1px solid ${hover ? `${meta.color}40` : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16,
        transition: "border-color 200ms",
        overflow: "hidden",
      }}
    >
      <div aria-hidden style={{
        position: "absolute",
        top: -80,
        right: -80,
        width: 260,
        height: 260,
        background: `radial-gradient(circle, ${meta.color}${hover ? "20" : "14"}, transparent 70%)`,
        filter: "blur(40px)",
        pointerEvents: "none",
        transition: "opacity 200ms",
      }} />

      <div style={{ position: "relative" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: meta.color,
              boxShadow: `0 0 10px ${meta.color}99`,
            }} />
            <span style={{
              fontFamily: "var(--pf-font-display-alt)",
              fontSize: "1.125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "#F5F5F7",
            }}>
              {meta.label}
            </span>
          </div>
          <span style={{
            fontFamily: "var(--pf-font-mono)",
            fontSize: "0.625rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            padding: "4px 10px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 9999,
          }}>
            {meta.badge}
          </span>
        </div>

        {children}

        {showPlatformButton && (
          <a
            href={meta.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 20,
              padding: "10px 20px",
              background: `linear-gradient(135deg, ${meta.color}, ${meta.colorDeep})`,
              color: "#FFFFFF",
              borderRadius: 9999,
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {meta.cta}
            <ArrowRight size={14} weight="regular" />
          </a>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// TRUST ITEM
// ---------------------------------------------------------------------------
const TrustItem: React.FC<{
  Icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold" }>;
  title: string;
  body: string;
}> = ({ Icon, title, body }) => (
  <div style={{
    padding: "24px 22px",
    background: "rgba(255,255,255,0.015)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
  }}>
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 14,
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: "rgba(139,92,246,0.10)",
        border: "1px solid rgba(139,92,246,0.25)",
        color: "#A78BFA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Icon size={16} weight="regular" />
      </div>
      <span style={{
        fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
        fontSize: "0.9375rem",
        fontWeight: 600,
        color: "#F5F5F7",
      }}>
        {title}
      </span>
    </div>
    <p style={{
      fontFamily: "var(--pf-font-ui)",
      fontSize: "0.875rem",
      lineHeight: 1.6,
      color: "rgba(255,255,255,0.55)",
      margin: 0,
    }}>
      {body}
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
const FAQ_ITEMS = [
  { q: "¿Por qué Pathfinder no ejecuta los modelos directamente?", a: "Ejecutar modelos de IA de alta calidad requiere GPUs costosas. Para mantener Pathfinder accesible, usamos la infraestructura gratuita de Kaggle y Google Colab en lugar de servidores propios. Cuando quieras, enciendes tu estación y generas." },
  { q: "¿Cuánto tarda la carga del modelo versus cada generación?", a: "La carga inicial del modelo tarda entre 5 y 15 minutos según el modelo y la plataforma. Ese tiempo es SOLO para preparar el modelo. Una vez que aparece el badge Estación lista, cada generación es rápida: imágenes en segundos, videos un poco más según modelo, duración y calidad." },
  { q: "¿Kaggle o Colab? ¿Cuál uso?", a: "Depende del modelo. Algunos corren solo en Kaggle, otros solo en Colab. En Mi Estación, cada tarjeta te dice en qué plataforma corre el modelo. Puedes usar ambas al mismo tiempo si tu plan lo permite." },
  { q: "¿Es legal usar Kaggle o Colab para generar contenido?", a: "Kaggle y Google Colab son infraestructura gratuita diseñada para uso personal. Pathfinder pone la capa de productividad: workflows, modelos preconfigurados, nube, interfaz de generación y monitoreo. Para uso comercial intensivo, recomendamos el plan Creator. Los términos de uso de cada plataforma son responsabilidad de cada usuario." },
  { q: "¿Qué pasa si la ejecución se pausa o falla?", a: "No te quedas solo: Pathfinder Studio te avisa. El badge de tu estación cambia a rojo y aparece la indicación de qué hacer. En la práctica, solo abres Kaggle o Colab, revisas el notebook y das Run All de nuevo. Pathfinder continúa desde donde quedó." },
  { q: "¿Qué pasa si me olvido de apagar la sesión?", a: "Nada grave. Kaggle y Colab cierran la sesión automáticamente después de aproximadamente 1 hora sin generar nada. Además, los notebooks traen un apagado interno de seguridad. Si quieres apagarla antes, puedes hacerlo desde Mi Estación con un solo clic." },
  { q: "¿Tengo que crear una cuenta nueva cada vez?", a: "No. Tu cuenta de Kaggle y tu cuenta de Google son permanentes. Solo las creas una vez." },
  { q: "¿Tengo que importar el workflow cada vez?", a: "No. Una vez importado, el workflow queda guardado en tu cuenta. La próxima vez que entres, lo abres desde tu lista y lo ejecutas directamente." },
  { q: "¿Puedo tener varios modelos cargados al mismo tiempo?", a: "Sí, pero cada modelo consume una sesión de cómputo. Para uso normal, te recomendamos cargar solo el modelo que vas a usar en ese momento." },
  { q: "¿Por qué mis creaciones desaparecen de Pathfinder?", a: "Las creaciones que guardas en Mis Creaciones se conservan 7 días desde que las guardas. Descárgalas antes si quieres conservarlas a largo plazo." },
  { q: "¿Dónde pido soporte si me trabo?", a: "Puedes contratar soporte desde /pricing. Te acompañamos en la configuración inicial, la carga del modelo, o cualquier problema puntual." },
  { q: "¿Cuánto cuesta usar Kaggle o Colab?", a: "Nada. Ambas plataformas son gratuitas. Kaggle te da 30 horas de GPU por semana, Colab asigna GPUs T4 según disponibilidad." },
];

const FAQBlock: React.FC = () => (
  <section style={{ paddingTop: 80 }}>
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
    >
      <motion.div variants={fadeInUp} style={{
        fontFamily: "var(--pf-font-mono)",
        fontSize: "0.6875rem",
        fontWeight: 500,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
        marginBottom: 14,
      }}>
        Preguntas frecuentes
      </motion.div>
      <motion.h2 variants={fadeInUp} style={{
        fontFamily: "var(--pf-font-display-alt)",
        fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
        fontWeight: 600,
        letterSpacing: "-0.025em",
        color: "#F5F5F7",
        margin: 0,
        marginBottom: 40,
      }}>
        Lo que suelen preguntar
      </motion.h2>
      <motion.div variants={fadeInUp} style={{ display: "flex", flexDirection: "column" }}>
        {FAQ_ITEMS.map((f, i) => (
          <details key={i} style={{
            borderBottom: i < FAQ_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <summary style={{
              padding: "20px 0",
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.9375rem",
              fontWeight: 500,
              color: "#F5F5F7",
              cursor: "pointer",
              listStyle: "none",
            }}>
              {f.q}
            </summary>
            <p style={{
              paddingBottom: 20,
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.875rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.55)",
              margin: 0,
            }}>
              {f.a}
            </p>
          </details>
        ))}
      </motion.div>
    </motion.div>
  </section>
);

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------
export const HowItWorksContent: React.FC = () => {
  const { session, profile } = useAuth();
  const [isMarking, setIsMarking] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; alt: string } | null>(null);

  const hasViewedBefore = !!profile?.how_it_works_viewed_at;

  useEffect(() => {
    if (!zoomedImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomedImage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomedImage]);

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
    <div style={{ background: "#000000" }}>
      {/* ═══════════ HERO ═══════════ */}
      <section style={{
        position: "relative",
        padding: "140px 80px 100px",
        overflow: "hidden",
        textAlign: "center",
      }}>
        <div aria-hidden style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 900,
          height: 500,
          background: "radial-gradient(ellipse, rgba(139,92,246,0.16) 0%, transparent 65%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }} />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          style={{ position: "relative", maxWidth: 780, margin: "0 auto" }}
        >
          <motion.div variants={fadeInUp} style={{
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
          }}>
            Manual de operación
          </motion.div>

          <motion.h1 variants={fadeInUp} style={{
            fontFamily: "var(--pf-font-display)",
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "#F5F5F7",
            margin: 0,
            marginBottom: 28,
          }}>
            Cómo funciona Pathfinder
          </motion.h1>

          <motion.p variants={fadeInUp} style={{
            fontFamily: "var(--pf-font-ui)",
            fontSize: "1.125rem",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.6)",
            margin: 0,
            maxWidth: 560,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            De la idea al resultado en cinco pasos. La primera vez incluye
            preparar tu estación; después, cada sesión arranca en segundos.
          </motion.p>
        </motion.div>
      </section>

      {/* ═══════════ FLUJO ═══════════ */}
      <section style={{
        position: "relative",
        padding: "0 80px 140px",
        overflow: "hidden",
      }}>
        <AuroraAtmosphere />

        <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto" }}>

          {/* ─── 01 · PREPARA TU CUENTA ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <BlockTitle
                num="01"
                title="Prepara tu cuenta"
                subtitle="Antes de encender tu primera estación necesitas una cuenta y verificarla una sola vez. Es un trámite rápido que no vuelves a repetir."
              />
            </motion.div>

            <motion.div
              variants={fadeInUp}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
              className="pf-split-grid"
            >
              <PlatformColumn platform="kaggle" showPlatformButton>
                <Step>Crear cuenta con Google o email.</Step>
                <Step>Verificar identidad con número de teléfono (SMS). Se hace una sola vez.</Step>
                <Step>Listo — tu cuenta ya puede usar GPUs.</Step>
                <MediaBlock type="image" label="Home de Kaggle — Sign In / Register" url={MEDIA_URLS.step1_register} />
                <MediaBlock type="video" label="Cómo verificar tu identidad en Kaggle" url={MEDIA_URLS.step1_verify} />
                <Callout kind="warn">Sin la verificación por SMS, Kaggle no te da acceso a GPUs. Es obligatorio y se hace una sola vez.</Callout>
              </PlatformColumn>

              <PlatformColumn platform="colab" showPlatformButton>
                <Step>Solo necesitas una cuenta de Google. Si ya tienes Gmail, Drive o YouTube, ya está.</Step>
                <Step>Abrir Google Colab e iniciar sesión con esa cuenta.</Step>
                <Step>Colab está disponible solo en planes Creator y Founder.</Step>
                <Callout kind="info">Los notebooks de Colab están disponibles solo para los planes <strong>Creator</strong> y <strong>Founder</strong>. En el plan Free corres un modelo a la vez desde Kaggle.</Callout>
              </PlatformColumn>
            </motion.div>
          </motion.div>

          <Divider />

          {/* ─── 02 · DESCARGA TU WORKFLOW ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <BlockTitle
                num="02"
                title="Descarga tu workflow"
                subtitle="Un workflow es la receta completa que Pathfinder preparó para cada modelo. Le dice a Kaggle o Colab qué cargar, cómo configurarlo y qué hacer con tus prompts."
              />
            </motion.div>

            <motion.div variants={fadeInUp} style={{ maxWidth: 720 }}>
              <Step>En Pathfinder, ve a <strong>Mi Estación</strong> desde el menú lateral.</Step>
              <Step>Verás una tarjeta por cada modelo. Elige el que quieras usar.</Step>
              <Step>Haz clic en <strong>Descargar workflow</strong>. Se descargará un archivo <Code>.ipynb</Code> a tu computadora.</Step>
              <Step>Guárdalo en una carpeta que puedas encontrar después.</Step>
              <Callout kind="tip">Puedes descargar varios workflows y guardarlos. Así los tienes a mano cuando quieras cambiar de modelo.</Callout>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <MediaBlock type="video" label="Cómo descargar tu workflow" url={MEDIA_URLS.step2_download} />
            </motion.div>
          </motion.div>

          <Divider />

          {/* ─── 03 · ENCIENDE TU ESTACIÓN (SPLIT + Marketing) ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <BlockTitle
                num="03"
                title="Enciende tu estación"
                subtitle="Cada modelo vive en su plataforma. Abre el notebook en la que corresponda, configúralo y ejecuta todo."
              />
            </motion.div>

            <motion.div
              variants={fadeInUp}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
                marginBottom: 40,
              }}
              className="pf-split-grid"
            >
              <PlatformColumn platform="kaggle">
                <Step>Haz clic en <strong>Create (+)</strong> → <strong>Notebook</strong>.</Step>
                <Step>Ve a <strong>File</strong> → <strong>Import Notebook</strong> y arrastra el <Code>.ipynb</Code>.</Step>
                <Step>En <strong>Session options</strong>: <strong>Accelerator → GPU T4 x2</strong> · <strong>Internet → ON</strong>.</Step>
                <Step>Enciende la sesión con el botón de encendido.</Step>
                <Step>Haz clic en <strong>▶ Run All</strong>. No cierres la pestaña.</Step>
                <MediaBlock type="video" label="Cómo activar tu estación en Kaggle" url={MEDIA_URLS.step3_kaggle} />
                <Callout kind="warn">Sin <strong>GPU T4 x2</strong> activado, el workflow no va a funcionar. Sin <strong>Internet</strong>, no puede descargar los modelos.</Callout>
              </PlatformColumn>

              <PlatformColumn platform="colab">
                <Step>Abre Google Colab y haz clic en <strong>Subir notebook</strong>.</Step>
                <Step>Elige <strong>Explorar</strong> y busca el <Code>.ipynb</Code> que descargaste.</Step>
                <Step>En <strong>Entorno de ejecución → Cambiar tipo</strong>: selecciona <strong>GPU T4</strong>.</Step>
                <Step>En <strong>Entorno de ejecución → Ejecutar todo</strong>. No cierres la pestaña.</Step>
                <MediaBlock type="video" label="Cómo activar tu estación en Colab" url={MEDIA_URLS.step3_colab} />
                <Callout kind="warn">Sin <strong>GPU T4</strong> activada, el workflow no va a funcionar.</Callout>
              </PlatformColumn>
            </motion.div>

            <motion.div variants={fadeInUp} style={{ maxWidth: 900 }}>
              <Callout kind="info"><strong>La espera es solo para cargar el modelo.</strong> La primera carga tarda entre 5 y 15 minutos. En las siguientes ejecuciones, arranca mucho más rápido.</Callout>
            </motion.div>

            {/* ─── MARKETING · Multi-Runtime (bloque destacado) ─── */}
            <motion.div
              variants={fadeInUp}
              style={{
                position: "relative",
                marginTop: 40,
                padding: "40px 36px",
                background: "linear-gradient(135deg, rgba(139,92,246,0.10), rgba(236,72,153,0.06))",
                border: "1px solid rgba(139,92,246,0.30)",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <div aria-hidden style={{
                position: "absolute",
                top: -80,
                right: -80,
                width: 320,
                height: 320,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(236,72,153,0.35), transparent 70%)",
                filter: "blur(50px)",
                pointerEvents: "none",
              }} />

              <div style={{ position: "relative", maxWidth: 720 }}>
                <div style={{
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
                }}>
                  <Fire size={12} weight="fill" />
                  Precio de lanzamiento · Quedan 80 días
                </div>

                <h3 style={{
                  fontFamily: "var(--pf-font-display-alt)",
                  fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                  color: "#F5F5F7",
                  margin: 0,
                  marginBottom: 14,
                }}>
                  Desbloquea 5 modelos más.
                  <br />
                  <span style={{ color: "#A78BFA" }}>Corre Kaggle y Colab al mismo tiempo.</span>
                </h3>

                <p style={{
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.9375rem",
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.6,
                  margin: 0,
                  marginBottom: 14,
                  maxWidth: 640,
                }}>
                  ¿Quieres sacarle el máximo a Pathfinder? Activa Creator y
                  desbloquea todos los workflows, incluidos los modelos nuevos
                  que compiten con la industria — más Colab y Multi-Runtime desde
                  el primer día.
                </p>

                <p style={{
                  fontFamily: "var(--pf-font-ui)",
                  fontSize: "0.9375rem",
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.6,
                  margin: 0,
                  marginBottom: 24,
                  maxWidth: 640,
                }}>
                  Sin créditos por generación.{" "}
                  <strong style={{ color: "#F5F5F7" }}>$249/mes hasta el 31 dic</strong>{" "}
                  — después sube a <s style={{ opacity: 0.6 }}>$399/mes</s>.
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <Link to="/pricing" style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                    color: "#FFFFFF",
                    borderRadius: 9999,
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    boxShadow: "0 12px 32px -8px rgba(139,92,246,0.6)",
                  }}>
                    Suscribirme — $249/mes
                  </Link>
                  <div style={{
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.4)",
                  }}>
                    14 días de reembolso. Cancela cuando quieras.
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <Divider />

          {/* ─── 04 · EMPIEZA A CREAR ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <BlockTitle
                num="04"
                title="Empieza a crear"
                subtitle="Cuando el notebook termina de cargar, Pathfinder lo detecta automáticamente. En Studio aparece el badge ● Estación lista en verde."
              />
            </motion.div>

            <motion.div variants={fadeInUp} style={{ maxWidth: 720 }}>
              <Step>Vuelve a la pestaña de Pathfinder → <strong>Studio</strong>.</Step>
              <Step>Verifica el badge <strong>● Estación lista</strong> en verde.</Step>
              <Step>El <strong>Floating Command Center</strong> ya tiene el modelo seleccionado.</Step>
              <Step>Escribe un prompt y haz clic en <strong>Generar</strong>.</Step>
              <Step>Cambia de modelo, genera otra cosa, repite.</Step>
              <Callout kind="tip"><strong>Los 5-15 minutos son SOLO la carga del modelo, no cada generación.</strong> A partir de "Estación lista", puedes generar sin parar. Imágenes en segundos, videos un poco más según modelo.</Callout>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <MediaBlock type="video" label="Cómo crear en Pathfinder Studio" url={MEDIA_URLS.step4_create} />
            </motion.div>
          </motion.div>

          <Divider />

          {/* ─── 05 · GUARDA Y APAGA (SPLIT) ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <BlockTitle
                num="05"
                title="Guarda tu trabajo y apaga"
                subtitle="Al terminar tu jornada, guarda tus creaciones y apaga la estación. En ese orden."
              />
            </motion.div>

            <motion.div variants={fadeInUp} style={{ maxWidth: 720, marginBottom: 40 }}>
              <h3 style={{
                fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
                fontSize: "1.0625rem",
                fontWeight: 600,
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 16,
              }}>
                Guarda tu trabajo
              </h3>
              <Step><strong>Descargar a tu computadora.</strong> En el <strong>Floating Command Center</strong>, clic en <strong>Descargar</strong>.</Step>
              <Step><strong>Guardar en Mis Creaciones.</strong> Clic en <strong>Guardar</strong>. La creación se sube a <strong>Cloudflare R2</strong> y queda disponible en <Link to="/creations" style={{ color: "#F5F5F7", fontWeight: 600, textDecoration: "underline" }}>Mis Creaciones</Link> durante <strong>7 días</strong>.</Step>

              <Callout kind="warn"><strong>Cuando apagas la estación, la sesión se borra y los archivos temporales desaparecen.</strong> Si no los descargaste ni los guardaste en Mis Creaciones, no se pueden recuperar.</Callout>
            </motion.div>

            <motion.div variants={fadeInUp} style={{ maxWidth: 720, marginBottom: 24 }}>
              <h3 style={{
                fontFamily: "'Satoshi', var(--pf-font-display-alt), system-ui, sans-serif",
                fontSize: "1.0625rem",
                fontWeight: 600,
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 16,
              }}>
                Apaga la estación
              </h3>
              <Step><strong>Desde Mi Estación (recomendado).</strong> Clic en <strong>Apagar estación</strong> sobre la tarjeta del modelo encendido.</Step>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
              className="pf-split-grid"
            >
              <PlatformColumn platform="kaggle">
                <Step>En la pestaña del notebook, clic en el menú de <strong>tres puntos (⋮)</strong> arriba a la derecha.</Step>
                <Step>Elige <strong>Stop Session</strong>.</Step>
                <MediaBlock type="image" label="Kaggle — Stop Session" url={MEDIA_URLS.step5_shutdown_kaggle} />
              </PlatformColumn>

              <PlatformColumn platform="colab">
                <Step>En el menú superior, ve a <strong>Entorno de ejecución</strong>.</Step>
                <Step>Elige <strong>Desconectar y borrar el tiempo de ejecución</strong>.</Step>
                <MediaBlock type="image" label="Colab — Desconectar" url={MEDIA_URLS.step5_shutdown_colab} />
              </PlatformColumn>
            </motion.div>

            <motion.div variants={fadeInUp} style={{ maxWidth: 720 }}>
              <MediaBlock type="video" label="Guardar tus creaciones y apagar la estación" url={MEDIA_URLS.step5_save_shutdown} />
              <Callout kind="info"><strong>¿Y si me olvido de apagar?</strong> Kaggle y Colab cierran la sesión automáticamente después de aproximadamente 1 hora sin generar nada.</Callout>
            </motion.div>
          </motion.div>

          <Divider />

          {/* ─── 06 · POR QUÉ CONFIAR ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <BlockTitle
                num="06"
                title="Por qué puedes confiar en Pathfinder"
                subtitle="Pathfinder no es una colección de scripts sueltos. Es una infraestructura construida, probada y mantenida para que tu experiencia sea sólida de principio a fin."
              />
            </motion.div>

            <motion.div
              variants={fadeInUp}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
                marginBottom: 32,
              }}
            >
              <TrustItem
                Icon={ShieldCheck}
                title="Workflows creados desde cero"
                body="Cada pipeline lo diseñamos específicamente para funcionar sobre esta infraestructura. No son plantillas genéricas."
              />
              <TrustItem
                Icon={CheckCircle}
                title="Probados intensivamente"
                body="Antes de publicar cualquier workflow, lo corremos de punta a punta: instalación, descarga, generación real y estabilidad."
              />
              <TrustItem
                Icon={ArrowsClockwise}
                title="Los modelos crecen contigo"
                body="Cuando mejoramos un modelo, publicamos la versión nueva. Vuelves a descargar y ya tienes las mejoras."
              />
              <TrustItem
                Icon={Package}
                title="Un solo ciclo para todos"
                body="Cada modelo nuevo se comporta exactamente igual: descargas, cargas, Run All, estado en Studio."
              />
              <TrustItem
                Icon={ShieldCheck}
                title="Infraestructura robusta"
                body="Detección de estado, heartbeat automático, apagado de seguridad y túneles redundantes."
              />
              <TrustItem
                Icon={Package}
                title="Nube gestionada"
                body="Cuando guardas una creación, va a Cloudflare R2 y queda en tu cuenta por 7 días."
              />
              <TrustItem
                Icon={Headset}
                title="Soporte humano"
                body="Si algo no funciona como esperabas, no estás solo. Puedes contratar soporte y te acompañamos."
              />
            </motion.div>

            <motion.div variants={fadeInUp} style={{ maxWidth: 720 }}>
              <Callout kind="tip">
                <strong>La idea central:</strong> tú aportas la idea y creas. Pathfinder
                pone el resto — workflows propios, modelos preconfigurados, nube,
                monitoreo en vivo, actualizaciones continuas y soporte. Kaggle y
                Colab solo aportan el cómputo; toda la capa de Pathfinder es nuestra.
              </Callout>
            </motion.div>
          </motion.div>

          <Divider />

          {/* ─── SOPORTE ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} style={{ maxWidth: 720 }}>
              <h3 style={{
                fontFamily: "var(--pf-font-display-alt)",
                fontSize: "1.5rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 14,
              }}>
                ¿Necesitas ayuda?
              </h3>
              <p style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.55)",
                margin: 0,
              }}>
                Si te trabas en cualquier paso, puedes{" "}
                <Link to="/pricing" style={{ color: "#F5F5F7", fontWeight: 600, textDecoration: "underline" }}>
                  contratar soporte
                </Link>{" "}
                y te acompañamos en la configuración, la carga del modelo o
                cualquier problema puntual con tu estación. No estás solo con la
                infraestructura.
              </p>
            </motion.div>
          </motion.div>

          <Divider />

          {/* ─── FAQ ─── */}
          <FAQBlock />

          {/* ─── LEGAL ─── */}
          <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 720,
            }}>
              <strong style={{ color: "rgba(255,255,255,0.5)" }}>Aviso legal.</strong>{" "}
              Pathfinder Studio no está afiliado a Kaggle ni a Google Colab. El uso de esas plataformas está sujeto a sus propios Términos de Servicio. Pathfinder provee la capa de orquestación, workflows, modelos preconfigurados y almacenamiento.
            </p>
          </div>

          {/* ─── CTA FINAL ─── */}
          <div style={{
            marginTop: 64,
            padding: "64px 40px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(139,92,246,0.20)",
            borderRadius: 20,
          }}>
            <div aria-hidden style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 800,
              height: 400,
              background: "radial-gradient(ellipse, rgba(139,92,246,0.16) 0%, transparent 65%)",
              filter: "blur(70px)",
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative" }}>
              <h2 style={{
                fontFamily: "var(--pf-font-display-alt)",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: "#F5F5F7",
                margin: 0,
                marginBottom: 16,
              }}>
                {hasViewedBefore ? "¿Listo para seguir creando?" : "¿Listo para empezar?"}
              </h2>
              <p style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1rem",
                color: "rgba(255,255,255,0.6)",
                marginBottom: 32,
                maxWidth: 520,
                margin: "0 auto 32px",
                lineHeight: 1.6,
              }}>
                {hasViewedBefore
                  ? "Recuerda que cada vez que quieras usar un modelo, tienes que encender tu estación desde Kaggle o Colab."
                  : "Ya conoces el proceso. Ahora sí, vamos a crear."}
              </p>
              {session ? (
                <button
                  onClick={handleComplete}
                  disabled={isMarking}
                  style={{
                    padding: "15px 32px",
                    background: "#8B5CF6",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 9999,
                    fontFamily: "var(--pf-font-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    cursor: isMarking ? "wait" : "pointer",
                    opacity: isMarking ? 0.7 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {isMarking ? "Cargando..." : hasViewedBefore ? "Ir al Studio" : "Entendido, ir al Studio"}
                  {!isMarking && <ArrowRight size={14} weight="regular" />}
                </button>
              ) : (
                <Link
                  to="/auth"
                  style={{
                    textDecoration: "none",
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
                  }}
                >
                  Crear cuenta gratis
                  <ArrowRight size={14} weight="regular" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setZoomedImage(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.9)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              cursor: "zoom-out",
            }}
          >
            <img
              src={zoomedImage.url}
              alt={zoomedImage.alt}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// WRAPPER
// ---------------------------------------------------------------------------
const HowItWorksPage: React.FC = () => (
  <MarketingLayout>
    <HowItWorksContent />
  </MarketingLayout>
);

export default HowItWorksPage;
