// src/pages/HowItWorksPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowUpRight,
  Video,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw,
  Package,
  LifeBuoy,
  Flame,
  HelpCircle,
} from "lucide-react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import VideoPlayer from "../components/VideoPlayer";
import { Badge } from "../design/components/Badge";
import { Button } from "../design/components/Button";
import { Drawer } from "../design/components/Drawer";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { fadeInUp, staggerContainer } from "../design/motion";
import { radius as R } from "../design/tokens";

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

const STEPS = [
  { num: "01", id: "step-01", label: "Prepara tu cuenta" },
  { num: "02", id: "step-02", label: "Descarga tu workflow" },
  { num: "03", id: "step-03", label: "Enciende tu estación" },
  { num: "04", id: "step-04", label: "Empieza a crear" },
  { num: "05", id: "step-05", label: "Guarda y apaga" },
  { num: "06", id: "step-06", label: "Por qué confiar" },
];

type Platform = "kaggle" | "colab";

const PLATFORM_META: Record<Platform, { label: string; color: string; colorDeep: string; url: string; cta: string }> = {
  kaggle: { label: "Kaggle", color: "#20BEFF", colorDeep: "#1E9DE0", url: "https://www.kaggle.com/", cta: "Abrir Kaggle" },
  colab: { label: "Colab", color: "#F9AB00", colorDeep: "#FBBC04", url: "https://colab.research.google.com/", cta: "Abrir Colab" },
};

const useIsLight = (): boolean => {
  const [isLight, setIsLight] = React.useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return (document.documentElement.dataset.theme || "light") === "light";
  });
  React.useEffect(() => {
    const update = () => setIsLight((document.documentElement.dataset.theme || "light") === "light");
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return isLight;
};

const CALLOUT_PALETTE = {
  light: {
    tip: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.35)", color: "#047857", Icon: Lightbulb },
    info: { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.35)", color: "#4338CA", Icon: AlertCircle },
    warn: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.40)", color: "#B45309", Icon: AlertCircle },
  },
  dark: {
    tip: { bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.3)", color: "#34D399", Icon: Lightbulb },
    info: { bg: "rgba(99,102,241,0.10)", border: "rgba(99,102,241,0.3)", color: "#A5B4FC", Icon: AlertCircle },
    warn: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.3)", color: "#FBBF24", Icon: AlertCircle },
  },
};

// ---------------------------------------------------------------------------
// UTILITY COMPONENTS
// ---------------------------------------------------------------------------
const Callout: React.FC<{ kind: "tip" | "info" | "warn"; children: React.ReactNode }> = ({ kind, children }) => {
  const isLight = useIsLight();
  const palette = isLight ? CALLOUT_PALETTE.light : CALLOUT_PALETTE.dark;
  const config = palette[kind];
  return (
    <div style={{ background: config.bg, border: `1px solid ${config.border}`, borderRadius: R.base, padding: "16px 20px", margin: "20px 0", display: "flex", gap: 12, color: config.color, fontFamily: "var(--pf-font-ui)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
      <span style={{ flexShrink: 0, marginTop: 2 }}><config.Icon size={18} /></span>
      <div>{children}</div>
    </div>
  );
};

const Step: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
    <CheckCircle2 size={18} style={{ color: "#A78BFA", flexShrink: 0, marginTop: 4 }} />
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

const SubHeading: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first }) => (
  <h3 style={{ fontFamily: "var(--pf-font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--pf-text-primary)", marginTop: first ? 0 : 32, marginBottom: 12 }}>
    {children}
  </h3>
);

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code style={{ background: "var(--pf-bg-inset)", padding: "2px 6px", borderRadius: 4, fontFamily: "var(--pf-font-mono)", fontSize: "0.875em" }}>
    {children}
  </code>
);

const PlatformButton: React.FC<{ platform: Platform }> = ({ platform }) => {
  const meta = PLATFORM_META[platform];
  return (
    <a href={meta.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: `linear-gradient(135deg, ${meta.color}, ${meta.colorDeep})`, color: "#FFFFFF", borderRadius: R.full, fontFamily: "var(--pf-font-ui)", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", marginTop: 8 }}>
      {meta.cta}
      <ArrowUpRight size={16} />
    </a>
  );
};

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
      <div style={{ borderRadius: R.base, overflow: "hidden", margin: "28px 0", background: "var(--pf-bg-secondary)", border: "1px solid var(--pf-border-subtle)" }}>
        <img src={url} alt={label} style={{ width: "100%", display: "block" }} />
      </div>
    );
  }
  return (
    <div style={{ aspectRatio: "16/9", background: "rgba(139,92,246,0.04)", border: "2px dashed rgba(139,92,246,0.25)", borderRadius: R.base, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, margin: "28px 0", color: "var(--pf-text-muted)", fontFamily: "var(--pf-font-ui)", padding: "40px 20px", textAlign: "center" }}>
      {type === "video" ? <Video size={36} /> : <ImageIcon size={36} />}
      <div style={{ fontSize: "0.9375rem", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Disponible próximamente</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SIDEBAR NAV — sticky a la izquierda
// ---------------------------------------------------------------------------
const SidebarNav: React.FC<{ activeStep: string; onOpenFaq: () => void }> = ({ activeStep, onOpenFaq }) => {
  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);
  const completed = activeIndex + 1;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside style={{ position: "sticky", top: 96, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Progreso */}
      <div>
        <div style={{ fontFamily: "var(--pf-font-mono)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pf-text-muted)", marginBottom: 10 }}>
          PROGRESO
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontFamily: "var(--pf-font-mono)", marginBottom: 12 }}>
          <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--pf-text-primary)", letterSpacing: "-0.03em" }}>
            <NumberFlow value={completed} format={{ useGrouping: false }} />
          </span>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--pf-text-muted)" }}>
            / {STEPS.length} pasos
          </span>
        </div>
        <div style={{ height: 3, background: "var(--pf-border-subtle)", borderRadius: R.full, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${(completed / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: "100%", background: "linear-gradient(90deg, #8B5CF6, #EC4899)" }}
          />
        </div>
      </div>

      {/* Lista de pasos */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {STEPS.map((s, idx) => {
          const isActive = s.id === activeStep;
          const isDone = idx <= activeIndex;
          return (
            <button
              key={s.id}
              onClick={() => handleClick(s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                background: isActive ? "var(--pf-bg-elevated)" : "transparent",
                border: isActive ? "1px solid var(--pf-border-default)" : "1px solid transparent",
                borderRadius: R.sm,
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: isActive ? "var(--pf-text-primary)" : "var(--pf-text-muted)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 150ms ease-out",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--pf-font-mono)",
                  fontSize: "0.6875rem",
                  fontWeight: 800,
                  color: isDone ? "#8B5CF6" : "var(--pf-text-muted)",
                  letterSpacing: "-0.02em",
                  opacity: isDone ? 1 : 0.5,
                  minWidth: 20,
                }}
              >
                {s.num}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>

      {/* FAQ */}
      <button
        onClick={onOpenFaq}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          marginTop: 8,
          background: "transparent",
          border: "1px solid var(--pf-border-default)",
          borderRadius: R.sm,
          fontFamily: "var(--pf-font-ui)",
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "var(--pf-text-secondary)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <HelpCircle size={16} />
        Preguntas frecuentes
      </button>
    </aside>
  );
};



// ---------------------------------------------------------------------------
// FAQ ITEMS
// ---------------------------------------------------------------------------
const FAQ_ITEMS = [
  { q: "¿Por qué Pathfinder no ejecuta los modelos directamente?",
    a: "Ejecutar modelos de IA de alta calidad requiere GPUs costosas. Para mantener Pathfinder accesible, usamos la infraestructura gratuita de Kaggle y Google Colab en lugar de servidores propios. Cuando quieras, enciendes tu estación y generas." },
  { q: "¿Cuánto tarda la carga del modelo versus cada generación?",
    a: "La carga inicial del modelo tarda entre 5 y 15 minutos según el modelo y la plataforma. Ese tiempo es SOLO para preparar el modelo. Una vez que aparece el badge Estación lista, cada generación es rápida: imágenes en segundos, videos un poco más según modelo, duración y calidad. Puedes generar sin parar sin esperar de nuevo." },
  { q: "¿Kaggle o Colab? ¿Cuál uso?",
    a: "Depende del modelo. Algunos corren solo en Kaggle, otros solo en Colab. En Mi Estación, cada tarjeta te dice en qué plataforma corre el modelo. Puedes usar ambas al mismo tiempo si tu plan lo permite." },
  { q: "¿Es legal usar Kaggle o Colab para generar contenido?",
    a: "Kaggle y Google Colab son infraestructura gratuita diseñada para uso personal. Kaggle y Colab ponen el cómputo — la GPU, el runtime. Pathfinder pone la capa de productividad: workflows, modelos preconfigurados, nube (Cloudflare R2), interfaz de generación, monitoreo de estado en vivo y gestión de tu cuenta. Para uso comercial intensivo, recomendamos el plan Creator, que suma Colab como segunda plataforma y distribuye la carga entre dos proveedores. Los términos de uso de cada plataforma son responsabilidad de cada usuario." },
  { q: "¿Qué pasa si la ejecución se pausa o falla?",
    a: "No te quedas solo: Pathfinder Studio te avisa. El badge de tu estación cambia a rojo y aparece la indicación de qué hacer. En la práctica, solo abres Kaggle o Colab, revisas el notebook y das Run All de nuevo. Pathfinder continúa desde donde quedó. Si tras 3 intentos no termina, cierra la sesión y ábrela de nuevo." },
  { q: "¿Qué pasa si me olvido de apagar la sesión?",
    a: "Nada grave. Kaggle y Colab cierran la sesión automáticamente después de aproximadamente 1 hora sin generar nada. Además, los notebooks traen un apagado interno de seguridad. La sesión se libera sola y no consume recursos indefinidamente. Si quieres apagarla antes, puedes hacerlo desde Mi Estación con un solo clic." },
  { q: "¿Tengo que crear una cuenta nueva cada vez?",
    a: "No. Tu cuenta de Kaggle y tu cuenta de Google (para Colab) son permanentes. Solo las creas una vez. Después, cada vez que quieras usar Pathfinder, abres la plataforma, abres tu workflow y lo ejecutas." },
  { q: "¿Tengo que importar el workflow cada vez?",
    a: "No. Una vez importado, el workflow queda guardado en tu cuenta de Kaggle (o en tu Drive para Colab). La próxima vez que entres, lo abres desde tu lista y lo ejecutas directamente." },
  { q: "¿Puedo tener varios modelos cargados al mismo tiempo?",
    a: "Sí, pero cada modelo consume una sesión de cómputo. Para uso normal, te recomendamos cargar solo el modelo que vas a usar en ese momento. Cambiar de modelo es rápido si cierras uno y abres otro." },
  { q: "¿Por qué mis creaciones desaparecen de Pathfinder?",
    a: "Las creaciones que guardas en Mis Creaciones se conservan 7 días desde que las guardas. Después se eliminan automáticamente. Descárgalas antes si quieres conservarlas a largo plazo. Las creaciones que no guardaste desaparecen cuando apagas la estación." },
  { q: "¿Dónde pido soporte si me trabo?",
    a: "Puedes contratar soporte desde /pricing. Te acompañamos en la configuración inicial, la carga del modelo, o cualquier problema puntual con tu estación." },
  { q: "¿Cuánto cuesta usar Kaggle o Colab?",
    a: "Nada. Ambas plataformas son gratuitas. Kaggle te da 30 horas de GPU por semana, Colab asigna GPUs T4 según disponibilidad. Más que suficiente para uso normal." },
];

// ---------------------------------------------------------------------------
// FAQ DRAWER
// ---------------------------------------------------------------------------
const FaqDrawer: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => (
  <Drawer
    open={open}
    onOpenChange={onOpenChange}
    title="Preguntas frecuentes"
    subtitle="Todo lo que necesitas saber sobre el flujo completo."
    width="620px"
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {FAQ_ITEMS.map((f, i) => (
        <details
          key={i}
          style={{
            background: "var(--pf-bg-secondary)",
            border: "1px solid var(--pf-border-subtle)",
            borderRadius: R.base,
            padding: "16px 20px",
          }}
        >
          <summary
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "var(--pf-text-primary)",
              cursor: "pointer",
              listStyle: "none",
            }}
          >
            {f.q}
          </summary>
          <p
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.875rem",
              lineHeight: 1.65,
              color: "var(--pf-text-secondary)",
              margin: 0,
              marginTop: 12,
            }}
          >
            {f.a}
          </p>
        </details>
      ))}
    </div>
  </Drawer>
);

// ---------------------------------------------------------------------------
// BLOCK HEADER
// ---------------------------------------------------------------------------
const BlockHeader: React.FC<{ num: string; title: string; id: string }> = ({ num, title, id }) => (
  <div id={id} style={{ scrollMarginTop: 96, marginBottom: 24 }}>
    <div style={{ fontFamily: "var(--pf-font-mono)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pf-text-muted)", marginBottom: 12 }}>
      PASO {num} / 06
    </div>
    <h2 style={{ fontFamily: "var(--pf-font-display)", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: "var(--pf-text-primary)", margin: 0 }}>
      {title}
    </h2>
  </div>
);

// ---------------------------------------------------------------------------
// Block — contenedor con estilo de sección
// ---------------------------------------------------------------------------
const Block: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <section style={{ paddingTop: 64, paddingBottom: 64, borderTop: "1px solid var(--pf-border-subtle)" }}>
    <div style={{ fontFamily: "var(--pf-font-ui)", fontSize: "1rem", lineHeight: 1.7, color: "var(--pf-text-secondary)" }}>
      {children}
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// HowItWorksContent
// ---------------------------------------------------------------------------
export const HowItWorksContent: React.FC = () => {
  const { session, profile } = useAuth();
  const isLight = useIsLight();
  const [isMarking, setIsMarking] = useState(false);
  const [activeStep, setActiveStep] = useState("step-01");
  const [activePlatform, setActivePlatform] = useState<Platform>("kaggle");
  const [zoomedImage, setZoomedImage] = useState<{ url: string; alt: string } | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);

  useEffect(() => {
    if (!zoomedImage) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomedImage(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomedImage]);

  const hasViewedBefore = !!profile?.how_it_works_viewed_at;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveStep(entry.target.id); }); },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    STEPS.forEach((s) => { const el = document.getElementById(s.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const handleComplete = async () => {
    if (!session?.user?.id) { window.location.href = "/auth"; return; }
    setIsMarking(true);
    try {
      await supabase.from("profiles").update({ how_it_works_viewed_at: new Date().toISOString() }).eq("id", session.user.id);
    } catch (e) { void 0; }
    window.location.href = "/studio";
  };

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 32px 120px" }}>
      {/* LAYOUT: sidebar + main */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 64, alignItems: "flex-start" }} className="pf-hiw-layout">
        <SidebarNav activeStep={activeStep} onOpenFaq={() => setFaqOpen(true)} />

        <main style={{ minWidth: 0 }}>
          {/* HERO TÉCNICO */}
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} style={{ marginBottom: 48 }}>
            <motion.div variants={fadeInUp} style={{ fontFamily: "var(--pf-font-mono)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pf-text-muted)", marginBottom: 20, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span>MANUAL</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>6 PASOS</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>KAGGLE + COLAB</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} style={{ fontFamily: "var(--pf-font-display)", fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.05, color: "var(--pf-text-primary)", margin: 0, marginBottom: 20, maxWidth: 720 }}>
              Cómo funciona Pathfinder.
            </motion.h1>

            <motion.p variants={fadeInUp} style={{ fontFamily: "var(--pf-font-ui)", fontSize: "1.0625rem", lineHeight: 1.6, color: "var(--pf-text-secondary)", maxWidth: 620, margin: 0, marginBottom: 12 }}>
              Pathfinder no ejecuta los modelos en nuestros servidores. Enciendes tu propia estación en Kaggle o Colab, ella corre el modelo por ti, y desde Pathfinder Studio monitoreas y creas.
            </motion.p>

            <motion.p variants={fadeInUp} style={{ fontFamily: "var(--pf-font-ui)", fontSize: "1.0625rem", lineHeight: 1.6, color: "var(--pf-text-secondary)", maxWidth: 620, margin: 0, fontWeight: 500 }}>
              Toda la infraestructura — workflows, modelos, nube y monitoreo — la mantenemos nosotros. Kaggle y Colab solo ponen el cómputo.
            </motion.p>
          </motion.div>

          {/* TRUST ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 8 }}>
            {[
              { Icon: ShieldCheck, title: "Workflows probados", desc: "Cada notebook lo testeamos antes de publicarlo.", accent: "#8B5CF6", accentDeep: "#6D28D9" },
              { Icon: RefreshCw, title: "Mantenimiento continuo", desc: "Actualizamos los workflows regularmente.", accent: "#06B6D4", accentDeep: "#0E7490" },
              { Icon: Package, title: "Nuevos modelos", desc: "Cada modelo nuevo aparece en Mi Estación.", accent: "#EC4899", accentDeep: "#BE185D" },
              { Icon: LifeBuoy, title: "Soporte humano", desc: "Si te trabas, te acompañamos en el proceso.", accent: "#10B981", accentDeep: "#047857" },
            ].map(({ Icon, title, desc, accent, accentDeep }) => {
              const iconColor = isLight ? accentDeep : accent;
              return (
                <div key={title} style={{ padding: 18, background: "var(--pf-bg-secondary)", border: "1px solid var(--pf-border-subtle)", borderRadius: R.base }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}14`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor, marginBottom: 12 }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ fontFamily: "var(--pf-font-display)", fontSize: "0.875rem", fontWeight: 700, color: "var(--pf-text-primary)", marginBottom: 4 }}>{title}</div>
                  <div style={{ fontFamily: "var(--pf-font-ui)", fontSize: "0.75rem", lineHeight: 1.5, color: "var(--pf-text-muted)" }}>{desc}</div>
                </div>
              );
            })}
          </div>

          {/* ============ BLOQUE 01 ============ */}
          <Block>
            <BlockHeader id="step-01" num="01" title="Prepara tu cuenta" />
            <p style={{ marginBottom: 20 }}>Antes de encender tu primera estación necesitas una cuenta y verificarla una sola vez. Es un trámite rápido que no vuelves a repetir.</p>

            <SubHeading first>Para Kaggle</SubHeading>
            <Step>Abre <a href="https://www.kaggle.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pf-text-primary)", fontWeight: 600, textDecoration: "underline" }}>kaggle.com <ExternalLink size={12} style={{ display: "inline", marginLeft: 4 }} /></a> y crea tu cuenta con Google o con un correo electrónico.</Step>
            <Step>Ve a <a href="https://www.kaggle.com/settings" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pf-text-primary)", fontWeight: 600, textDecoration: "underline" }}>Settings <ExternalLink size={12} style={{ display: "inline", marginLeft: 4 }} /></a> y busca <strong>Phone Verification</strong>.</Step>
            <Step>Ingresa tu número de teléfono. Recibirás un código por SMS que debes confirmar.</Step>
            <Step>Cuando aparezca el check verde junto a tu nombre, tu cuenta ya puede usar GPUs. Listo.</Step>

            <MediaBlock type="image" label="Home de Kaggle" url={MEDIA_URLS.step1_register} />
            <MediaBlock type="video" label="Cómo verificar tu identidad en Kaggle" url={MEDIA_URLS.step1_verify} />

            <Callout kind="warn">Sin la verificación por SMS, Kaggle no te da acceso a GPUs. Este paso es obligatorio y se hace una sola vez.</Callout>

            <SubHeading>Para Google Colab (solo Creator y Founder)</SubHeading>
            <Step>Solo necesitas una cuenta de Google. Si ya tienes una (Gmail, Drive, YouTube), ya está — no hay que verificar nada más.</Step>
            <Step>Abre <a href="https://colab.research.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pf-text-primary)", fontWeight: 600, textDecoration: "underline" }}>colab.research.google.com <ExternalLink size={12} style={{ display: "inline", marginLeft: 4 }} /></a> e inicia sesión con esa cuenta.</Step>

            <Callout kind="info">Los notebooks de Colab están disponibles solo para los planes <strong>Creator</strong> y <strong>Founder</strong>. En el plan Free corres un modelo a la vez desde Kaggle. En Creator desbloqueas Colab y puedes correr dos modelos al mismo tiempo (Multi-Runtime).</Callout>
          </Block>

          {/* ============ BLOQUE 02 ============ */}
          <Block>
            <BlockHeader id="step-02" num="02" title="Descarga tu workflow" />
            <p style={{ marginBottom: 20 }}>Un <strong>workflow</strong> es la receta completa que Pathfinder preparó para cada modelo: le dice a Kaggle o Colab qué cargar, cómo configurarlo y qué hacer con tus prompts. Es una automatización lista para correr.</p>
            <p style={{ marginBottom: 20 }}>Técnicamente, el workflow vive dentro de un <strong>notebook</strong> — un archivo que Kaggle y Colab entienden de forma nativa. Cuando descargas un workflow desde Mi Estación, descargas el notebook que lo contiene.</p>
            <p style={{ marginBottom: 20 }}>En otras palabras: <strong>workflow es lo que haces, notebook es el archivo con el que lo haces.</strong></p>

            <Step>En Pathfinder, ve a <strong>Mi Estación</strong> desde el menú lateral.</Step>
            <Step>Verás una tarjeta por cada modelo. Elige el que quieras usar.</Step>
            <Step>Haz clic en <strong>Descargar workflow</strong>. Se descargará un archivo <Code>.ipynb</Code> a tu computadora.</Step>
            <Step>Guárdalo en una carpeta que puedas encontrar después. Lo vas a usar en el siguiente paso.</Step>

            <MediaBlock type="video" label="Cómo descargar tu workflow" url={MEDIA_URLS.step2_download} />

            <Callout kind="tip">Puedes descargar varios workflows y guardarlos. Así los tienes a mano cuando quieras cambiar de modelo.</Callout>
          </Block>

          {/* ============ BLOQUE 03 ============ */}
          <Block>
            <BlockHeader id="step-03" num="03" title="Enciende tu estación" />
            <p style={{ marginBottom: 20 }}>Cada modelo vive en su propia plataforma: algunos corren en Kaggle, otros en Google Colab. En Mi Estación cada tarjeta te dice en cuál va. Elige la pestaña que corresponda y sigue los pasos.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {(["kaggle", "colab"] as Platform[]).map((p) => {
                const meta = PLATFORM_META[p];
                const isActive = activePlatform === p;
                return (
                  <button
                    key={p}
                    onClick={() => setActivePlatform(p)}
                    style={{
                      padding: "10px 22px",
                      background: isActive ? `linear-gradient(135deg, ${meta.color}, ${meta.colorDeep})` : "transparent",
                      color: isActive ? "#FFFFFF" : "var(--pf-text-secondary)",
                      border: isActive ? "none" : "1px solid var(--pf-border-subtle)",
                      borderRadius: R.full,
                      fontFamily: "var(--pf-font-ui)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {activePlatform === "kaggle" && (
              <div>
                <Step>En Kaggle, haz clic en <strong>Create (+)</strong> arriba a la izquierda y elige <strong>Notebook</strong>.</Step>
                <Step>Ve a <strong>File</strong> → <strong>Import Notebook</strong> y arrastra el archivo <Code>.ipynb</Code>. Haz clic en <strong>Import</strong>.</Step>
                <Step>En el panel derecho, sección <strong>Session options</strong>: <strong>Accelerator → GPU T4 x2</strong> · <strong>Internet → ON</strong>.</Step>
                <Step>Enciende la sesión con el botón de encendido. Espera a que quede activo.</Step>
                <Step>Arriba, junto a "Save Version", haz clic en <strong>▶ Run All</strong>. No cierres la pestaña.</Step>
                <MediaBlock type="video" label="Cómo importar el workflow en Kaggle" url={MEDIA_URLS.step3_kaggle} />
                <div style={{ marginTop: 16 }}><PlatformButton platform="kaggle" /></div>
                <Callout kind="warn">Sin <strong>GPU T4 x2</strong> activado, el workflow no va a funcionar. Sin <strong>Internet</strong>, no puede descargar los modelos.</Callout>
              </div>
            )}

            {activePlatform === "colab" && (
              <div>
                <Step>Abre <a href="https://colab.research.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pf-text-primary)", fontWeight: 600, textDecoration: "underline" }}>Google Colab <ExternalLink size={12} style={{ display: "inline", marginLeft: 4 }} /></a> y haz clic en <strong>Subir notebook</strong>.</Step>
                <Step>Elige <strong>Explorar</strong> y busca el archivo <Code>.ipynb</Code> que descargaste. Ábrelo.</Step>
                <Step>En <strong>Entorno de ejecución → Cambiar tipo de entorno</strong>, selecciona <strong>GPU T4</strong>.</Step>
                <Step>En <strong>Entorno de ejecución → Ejecutar todo</strong>. No cierres la pestaña.</Step>
                <MediaBlock type="video" label="Cómo cargar tu workflow en Colab" url={MEDIA_URLS.step3_colab} />
                <div style={{ marginTop: 16 }}><PlatformButton platform="colab" /></div>
                <Callout kind="warn">Sin <strong>GPU T4</strong> activada, el workflow no va a funcionar. Colab asigna GPUs según disponibilidad — si no consigues una, intenta más tarde o usa Kaggle.</Callout>
              </div>
            )}

            <Callout kind="info"><strong>La espera es solo para cargar el modelo.</strong> La primera carga tarda entre 5 y 15 minutos. En las siguientes ejecuciones, arranca mucho más rápido.</Callout>
            <Callout kind="tip">Mientras se carga, puedes ir directo a <strong>Pathfinder Studio</strong>. Ahí ves el progreso en vivo. No necesitas quedarte mirando Kaggle ni Colab.</Callout>

            {/* Multi-Runtime */}
            <div style={{ marginTop: 32, padding: "24px 28px", background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.08))", border: "1px solid rgba(139,92,246,0.25)", borderRadius: R.lg }}>
              <Badge tone="brand">Multi-Runtime</Badge>
              <h3 style={{ fontFamily: "var(--pf-font-display)", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--pf-text-primary)", margin: "14px 0 12px" }}>Corre dos modelos al mismo tiempo</h3>
              <p style={{ fontFamily: "var(--pf-font-ui)", fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--pf-text-secondary)", margin: 0, marginBottom: 12 }}>
                Con el plan <strong>Creator</strong> puedes tener LTX en Kaggle mientras generas imágenes en Krea o audio en TTS Dual desde Colab. Los dos modelos corren en paralelo, dentro de la misma interfaz de Pathfinder Studio.
              </p>
              <p style={{ fontFamily: "var(--pf-font-ui)", fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--pf-text-secondary)", margin: 0 }}>
                Los notebooks de Colab están desbloqueados solo para Creator y Founder. En el plan Free, corres un modelo a la vez desde Kaggle.
              </p>
            </div>

            {/* Tarjeta Premium Creator */}
            <div style={{ position: "relative", marginTop: 24, padding: 28, borderRadius: R.lg, border: "1px solid rgba(139,92,246,0.3)", background: "linear-gradient(135deg, rgba(139,92,246,0.10), rgba(236,72,153,0.08))", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.35), transparent 70%)", pointerEvents: "none", filter: "blur(20px)" }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", background: isLight ? "rgba(220,38,38,0.08)" : "rgba(220,38,38,0.18)", border: isLight ? "1px solid rgba(220,38,38,0.35)" : "1px solid rgba(220,38,38,0.5)", borderRadius: R.full, fontFamily: "var(--pf-font-mono)", fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: isLight ? "#B91C1C" : "#FCA5A5", marginBottom: 14 }}>
                  <Flame size={12} strokeWidth={2.5} />
                  Precio de lanzamiento
                </div>
                <div style={{ fontFamily: "var(--pf-font-display)", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--pf-text-primary)", marginBottom: 10, lineHeight: 1.2 }}>
                  Desbloquea 5 modelos más.<br />
                  <span style={{ color: isLight ? "#6D28D9" : "#A5B4FC" }}>Corre Kaggle y Colab al mismo tiempo.</span>
                </div>
                <div style={{ fontFamily: "var(--pf-font-ui)", fontSize: "0.9375rem", color: "var(--pf-text-secondary)", lineHeight: 1.55, marginBottom: 20, maxWidth: 640 }}>
                  Sin créditos por generación. <strong style={{ color: "var(--pf-text-primary)" }}>$249/mes hasta el 31 dic</strong> — después sube a <s style={{ opacity: 0.7 }}>$399/mes</s>.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <Link to="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "linear-gradient(135deg, #8B5CF6, #EC4899)", color: "#FFFFFF", borderRadius: R.base, fontFamily: "var(--pf-font-ui)", fontSize: "0.9375rem", fontWeight: 700, textDecoration: "none", boxShadow: "0 12px 32px -8px rgba(139,92,246,0.8)" }}>
                    Ver planes
                  </Link>
                  <div style={{ fontFamily: "var(--pf-font-ui)", fontSize: "0.75rem", color: "var(--pf-text-muted)" }}>14 días de reembolso.</div>
                </div>
              </div>
            </div>
          </Block>

          {/* ============ BLOQUE 04 ============ */}
          <Block>
            <BlockHeader id="step-04" num="04" title="Empieza a crear" />
            <p style={{ marginBottom: 20 }}>Cuando el notebook termina de cargar, Pathfinder lo detecta automáticamente. En Studio aparece el badge <strong>"● Estación lista"</strong> en verde y el panel de generación selecciona el modelo solo.</p>

            <Callout kind="info"><strong>Los 5 a 15 minutos son SOLO la carga del modelo, no cada generación.</strong> A partir de que aparece "Estación lista", puedes generar imágenes, audio y video sin parar. Imágenes en segundos, videos un poco más según modelo, duración y calidad.</Callout>

            <Step>Vuelve a la pestaña de Pathfinder → <strong>Studio</strong>.</Step>
            <Step>Verifica el badge <strong>"● Estación lista"</strong> en verde.</Step>
            <Step>El <strong>Floating Command Center</strong> ya tiene el modelo seleccionado.</Step>
            <Step>Escribe un prompt, ajusta los parámetros si quieres, y haz clic en <strong>Generar</strong>.</Step>
            <Step>Cambia de modelo, genera otra cosa, repite. Todo desde Studio.</Step>

            <MediaBlock type="video" label="Cómo crear en Pathfinder Studio" url={MEDIA_URLS.step4_create} />

            <Callout kind="tip"><strong>No tienes que volver a Kaggle ni a Colab.</strong> No tienes que refrescar. Pathfinder te avisa, te muestra el estado y te deja crear.</Callout>
          </Block>

          {/* ============ BLOQUE 05 ============ */}
          <Block>
            <BlockHeader id="step-05" num="05" title="Guarda tu trabajo y apaga la estación" />
            <p style={{ marginBottom: 20 }}>Al terminar tu jornada hay dos cosas importantes que hacer: guardar tus creaciones y apagar la estación. En ese orden.</p>

            <SubHeading first>Guarda tu trabajo</SubHeading>
            <p style={{ marginBottom: 20 }}>Mientras tu estación está encendida, tus creaciones viven en la sesión. Antes de apagarla, tienes dos formas de conservarlas:</p>

            <Step><strong>Descargar a tu computadora.</strong> En el <strong>Floating Command Center</strong>, haz clic en el botón de <strong>Descargar</strong>.</Step>
            <Step><strong>Guardar en Mis Creaciones.</strong> En el mismo panel, haz clic en <strong>Guardar</strong>. La creación se sube a <strong>Cloudflare R2</strong> y queda disponible en <Link to="/creations" style={{ color: "var(--pf-text-primary)", fontWeight: 600, textDecoration: "underline" }}>Mis Creaciones</Link> durante <strong>7 días</strong>.</Step>

            <Callout kind="warn"><strong>Cuando apagas la estación, la sesión se borra y los archivos temporales desaparecen.</strong> Si no los descargaste ni los guardaste en Mis Creaciones, no se pueden recuperar.</Callout>

            <SubHeading>Apaga la estación</SubHeading>
            <p style={{ marginBottom: 20 }}>Tienes dos caminos. El primero es el más rápido y no requiere abrir Kaggle ni Colab.</p>

            <Step><strong>Desde Mi Estación (recomendado).</strong> Haz clic en <strong>Apagar estación</strong> sobre la tarjeta del modelo encendido.</Step>
            <Step><strong>Manual desde Kaggle.</strong> Menú de tres puntos → <strong>Stop Session</strong>.</Step>
            <Step><strong>Manual desde Colab.</strong> <strong>Entorno de ejecución → Desconectar y borrar el tiempo de ejecución</strong>.</Step>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 24 }}>
              {[
                { url: MEDIA_URLS.step5_shutdown_kaggle, alt: "Kaggle — Stop Session", caption: <>Kaggle · menú de tres puntos → <strong>Stop session</strong></> },
                { url: MEDIA_URLS.step5_shutdown_colab, alt: "Colab — Desconectar", caption: <>Colab · <strong>Desconectar y borrar el tiempo de ejecución</strong></> },
              ].map((img, i) => (
                <div key={i}>
                  <div
                    onClick={() => setZoomedImage({ url: img.url, alt: img.alt })}
                    style={{ borderRadius: R.base, overflow: "hidden", border: "1px solid var(--pf-border-subtle)", background: "var(--pf-bg-secondary)", cursor: "zoom-in", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px -8px rgba(0,0,0,0.25)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <img src={img.url} alt={img.alt} style={{ width: "100%", display: "block" }} />
                  </div>
                  <div style={{ fontFamily: "var(--pf-font-ui)", fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--pf-text-muted)", marginTop: 10, textAlign: "center" }}>{img.caption}</div>
                </div>
              ))}
            </div>

            <MediaBlock type="video" label="Guardar tus creaciones y apagar la estación" url={MEDIA_URLS.step5_save_shutdown} />

            <Callout kind="info"><strong>¿Y si me olvido de apagar?</strong> No pasa nada grave. Kaggle y Colab cierran la sesión automáticamente después de aproximadamente <strong>1 hora sin generar nada</strong>. Los notebooks traen un apagado interno de seguridad. La sesión se libera sola.</Callout>
            <Callout kind="tip">La próxima vez que quieras crear, no necesitas crear cuenta de nuevo ni volver a importar el workflow. Solo abres el notebook guardado, das <strong>Run All</strong> y vuelves a Pathfinder Studio.</Callout>

            <SubHeading>¿Necesitas ayuda?</SubHeading>
            <p style={{ marginBottom: 20 }}>Si te trabas en cualquier paso, puedes <Link to="/pricing" style={{ color: "var(--pf-text-primary)", fontWeight: 600, textDecoration: "underline" }}>contratar soporte</Link> y te acompañamos en la configuración, la carga del modelo o cualquier problema puntual.</p>
          </Block>

          {/* ============ BLOQUE 06 ============ */}
          <Block>
            <BlockHeader id="step-06" num="06" title="Por qué puedes confiar en Pathfinder" />
            <p style={{ marginBottom: 20 }}>Pathfinder no es una colección de scripts sueltos. Es una infraestructura construida, probada y mantenida para que tu experiencia sea sólida de principio a fin.</p>

            <Step><strong>Workflows creados desde cero por Pathfinder.</strong> Cada pipeline lo diseñamos nosotros específicamente para funcionar sobre esta infraestructura. No son plantillas genéricas.</Step>
            <Step><strong>Probados intensivamente, modelo por modelo.</strong> Antes de publicar cualquier workflow, lo corremos de punta a punta. Solo lo que pasa esas pruebas llega a Mi Estación.</Step>
            <Step><strong>Los modelos crecen contigo.</strong> Cuando mejoramos un modelo, publicamos la versión nueva. Vuelves a descargar el workflow actualizado y ya tienes las mejoras.</Step>
            <Step><strong>Actualizaciones sobre los mismos workflows.</strong> Los notebooks reciben nuevas capacidades sin cambiar la forma en que los usas.</Step>
            <Step><strong>Un solo ciclo para todos los modelos.</strong> Cada modelo nuevo se comporta exactamente igual: descargas, cargas, Run All, estado en Studio.</Step>
            <Step><strong>Infraestructura robusta y monitoreada.</strong> Detección de estado, heartbeat automático, apagado de seguridad y túneles redundantes.</Step>
            <Step><strong>Nube y persistencia gestionadas.</strong> Cuando guardas una creación, va a Cloudflare R2 y queda 7 días.</Step>
            <Step><strong>Soporte humano cuando lo necesites.</strong> Si algo no funciona, te acompañamos hasta resolverlo.</Step>

            <Callout kind="tip"><strong>La idea central:</strong> tú aportas la idea y creas. Pathfinder pone el resto — workflows propios, modelos preconfigurados, nube, monitoreo, actualizaciones y soporte.</Callout>
          </Block>

          {/* DISCLAIMER LEGAL */}
          <div style={{ marginTop: 48, padding: "20px 0", borderTop: "1px solid var(--pf-border-subtle)" }}>
            <p style={{ fontFamily: "var(--pf-font-ui)", fontSize: "0.75rem", color: "var(--pf-text-muted)", lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "var(--pf-text-secondary)" }}>Aviso legal.</strong> Pathfinder Studio no está afiliado a Kaggle ni a Google Colab. El uso de esas plataformas está sujeto a sus propios Términos de Servicio. Pathfinder provee la capa de orquestación, workflows, modelos preconfigurados y almacenamiento.
            </p>
          </div>

          {/* CTA FINAL */}
          <section style={{ marginTop: 48, padding: "40px 32px", background: "var(--pf-bg-elevated)", border: "1px solid var(--pf-border-subtle)", borderRadius: R.lg, textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--pf-font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em", margin: 0, marginBottom: 16, color: "var(--pf-text-primary)" }}>
              {hasViewedBefore ? "¿Listo para seguir creando?" : "¿Listo para empezar?"}
            </h2>
            <p style={{ fontFamily: "var(--pf-font-ui)", fontSize: "1rem", color: "var(--pf-text-secondary)", marginBottom: 28, maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.5 }}>
              {hasViewedBefore ? "Recuerda que cada vez que quieras usar un modelo, tienes que encender tu estación desde Kaggle o Colab." : "Ya conoces el proceso. Ahora sí, vamos a crear."}
            </p>
            {session ? (
              <Button variant="primary" size="lg" loading={isMarking} onClick={handleComplete}>
                {hasViewedBefore ? "Ir al Studio" : "Entendido, ir al Studio"}
              </Button>
            ) : (
              <Link to="/auth" style={{ textDecoration: "none" }}>
                <Button variant="primary" size="lg">Crear cuenta gratis</Button>
              </Link>
            )}
          </section>
        </main>
      </div>

      {/* FAQ DRAWER */}
      <FaqDrawer open={faqOpen} onOpenChange={setFaqOpen} />

      {/* LIGHTBOX */}
      {zoomedImage && (
        <div onClick={() => setZoomedImage(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, cursor: "zoom-out", animation: "pf-lightbox-fade 0.15s ease" }}>
          <button onClick={() => setZoomedImage(null)} aria-label="Cerrar" style={{ position: "absolute", top: 20, right: 20, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, fontSize: 22, lineHeight: 1 }}>
            ×
          </button>
          <img src={zoomedImage.url} alt={zoomedImage.alt} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8, boxShadow: "0 24px 80px -12px rgba(0,0,0,0.6)", cursor: "default" }} />
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
