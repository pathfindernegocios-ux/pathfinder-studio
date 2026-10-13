// src/pages/WelcomePage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Rocket, Play, ArrowDown } from "lucide-react";
import PathfinderLogo from "../components/PathfinderLogo";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";

// ============================================================
// MEDIA URLs — subí los videos a Storage y pegá las URLs acá.
// Mientras estén vacíos (""), se muestra un placeholder dark.
//
// Formato esperado:
//   "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/welcome-media/nombre.mp4"
// ============================================================
const WELCOME_MEDIA_URLS = {
  step1_download: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step1-download.mp4", // Video: mock de Mi Estación → click Descargar
  step2_activate: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step2-activate.mp4", // Video: Kaggle → Import Notebook → Encender → Run All
  step3_ready:    "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step3-ready.mp4", // Video: Studio → progreso → Estación lista
};

// ============================================================
// VIDEO PLACEHOLDER (dark)
// ============================================================
const VideoPlaceholder: React.FC<{
  label: string;
  url: string;
}> = ({ label, url }) => {
  if (url && url.length > 0) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "880px",
          borderRadius: "24px",
          overflow: "hidden",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          boxShadow: "0 20px 60px -10px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.15) inset",
          background: "#0a0a12",
        }}
      >
        <VideoPlayer src={url} aspectRatio="16/9" objectFit="contain" background="transparent" autoPlay={false} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "880px",
        aspectRatio: "16 / 9",
        borderRadius: "24px",
        border: "1px dashed rgba(139, 92, 246, 0.4)",
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        boxShadow: "0 20px 60px -10px rgba(99, 102, 241, 0.2)",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "rgba(139, 92, 246, 0.15)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#a5b4fc",
        }}
      >
        <Play size={28} strokeWidth={1.8} />
      </div>
      <div
        style={{
          fontFamily: "var(--pf-font-ui, system-ui)",
          fontSize: "0.9375rem",
          fontWeight: 600,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--pf-font-ui, system-ui)",
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        Video próximamente
      </div>
    </div>
  );
};

// ============================================================
// ROCKET LAUNCH — efecto de despegue
// ============================================================
const RocketLaunch: React.FC = () => {
  return (
    <div
      style={{
        position: "relative",
        width: "200px",
        height: "200px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Anillo de glow pulsante */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%)",
          animation: "pf-welcome-glow 3s ease-in-out infinite",
        }}
      />

      {/* Anillos orbitando */}
      <div
        style={{
          position: "absolute",
          inset: "20px",
          borderRadius: "50%",
          border: "1px solid rgba(139, 92, 246, 0.25)",
          animation: "pf-welcome-spin 12s linear infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "40px",
          borderRadius: "50%",
          border: "1px solid rgba(168, 85, 247, 0.2)",
          animation: "pf-welcome-spin 8s linear infinite reverse",
        }}
      />

      {/* Cohete */}
      <div style={{ position: "relative", animation: "pf-welcome-rocket 2.4s ease-in-out infinite" }}>
        <Rocket size={72} strokeWidth={1.5} style={{ color: "#a5b4fc", filter: "drop-shadow(0 0 20px rgba(139, 92, 246, 0.8))" }} />
      </div>

      {/* Partículas ascendentes */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: "30%",
            left: `${40 + i * 4}%`,
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "#a5b4fc",
            opacity: 0,
            animation: `pf-welcome-particle 2.4s ${i * 0.15}s ease-out infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes pf-welcome-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes pf-welcome-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pf-welcome-rocket {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pf-welcome-particle {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-90px) scale(1.2); }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// WELCOME PAGE
// ============================================================
const TOS_VERSION = "2026-10-13";
const PRIVACY_VERSION = "2026-10-13";

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const totalSteps = 5;

  const scrollToStep = (index: number) => {
    const el = sectionRefs.current[index];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Intersection Observer para actualizar el dot activo y disparar animaciones
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveStep(idx);
            (entry.target as HTMLElement).classList.add("pf-visible");
          }
        });
      },
      {
        root: container,
        threshold: [0.4, 0.6],
      },
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleEnterStudio = async () => {
    if (!tosAccepted || isSubmitting) return;
    setIsSubmitting(true);
    if (session?.user?.id) {
      try {
        await supabase
          .from("profiles")
          .update({
            tos_accepted_at: new Date().toISOString(),
            tos_version: TOS_VERSION,
            privacy_version: PRIVACY_VERSION,
          })
          .eq("id", session.user.id);
      } catch (e) {
        void 0;
      }
    }
    navigate("/studio");
  };

  const accentColors = [
    ["#6366f1", "#8b5cf6"], // hero
    ["#6366f1", "#a855f7"], // step 1
    ["#8b5cf6", "#d946ef"], // step 2
    ["#a855f7", "#ec4899"], // step 3
    ["#10b981", "#06b6d4"], // final
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        scrollSnapType: "y proximity",
        scrollBehavior: "smooth",
        background: "#000000",
        color: "#ffffff",
        fontFamily: "var(--pf-font-ui, system-ui)",
      }}
    >
      {/* Blobs de fondo */}
      <div style={{ position: "fixed", top: "-20%", left: "-10%", width: "700px", height: "700px", background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-20%", right: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 }} />

      {/* Dots de progreso (fijos) */}
      <div
        style={{
          position: "fixed",
          top: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          display: "flex",
          gap: "10px",
          padding: "10px 16px",
          background: "rgba(10, 10, 18, 0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          borderRadius: "9999px",
        }}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToStep(i)}
            aria-label={`Ir al paso ${i + 1}`}
            style={{
              width: activeStep === i ? "24px" : "8px",
              height: "8px",
              borderRadius: "9999px",
              border: "none",
              background: activeStep === i ? "#a5b4fc" : "rgba(255,255,255,0.25)",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* ════════════════ PASO 0 — HERO ════════════════ */}
      <section
        ref={(el) => { sectionRefs.current[0] = el; }}
        style={{
          minHeight: "100vh",
          scrollSnapAlign: "start",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="pf-reveal" style={{ maxWidth: "720px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "32px",
              filter: "drop-shadow(0 4px 24px rgba(34, 211, 238, 0.55))",
            }}
          >
            <PathfinderLogo size={120} />
          </div>

          <h1
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(2.25rem, 5vw, 4rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              margin: 0,
              marginBottom: "20px",
              background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Bienvenido a tu estación.
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 1.8vw, 1.375rem)",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.65)",
              margin: 0,
              marginBottom: "48px",
              fontWeight: 400,
            }}
          >
            Aquí empieza tu historia.
          </p>

          <button
            onClick={() => scrollToStep(1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              padding: "16px 40px",
              fontSize: "1rem",
              fontWeight: 700,
              fontFamily: "var(--pf-font-ui, system-ui)",
              cursor: "pointer",
              boxShadow: "0 10px 30px -8px rgba(99, 102, 241, 0.5)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 16px 40px -8px rgba(99, 102, 241, 0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 30px -8px rgba(99, 102, 241, 0.5)";
            }}
          >
            Comenzar
            <ArrowDown size={18} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* ════════════════ PASO 1 — DESCARGA ════════════════ */}
      <section
        ref={(el) => { sectionRefs.current[1] = el; }}
        style={{
          minHeight: "100vh",
          scrollSnapAlign: "start",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="pf-reveal" style={{ width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: accentColors[1][0], marginBottom: "20px" }}>
            01 · Descarga
          </div>
          <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, margin: 0, marginBottom: "20px", color: "#ffffff" }}>
            Descarga tu workflow.
          </h2>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.6, color: "rgba(255,255,255,0.65)", margin: 0, marginBottom: "48px", maxWidth: "620px" }}>
            Mi Estación es donde viven todos los modelos disponibles. Cuando encuentres el que quieras usar, haz clic en <strong style={{ color: "#ffffff" }}>Descargar workflow</strong>.
          </p>
          <VideoPlaceholder label="Cómo descargar tu workflow" url={WELCOME_MEDIA_URLS.step1_download} />
        </div>
      </section>

      {/* ════════════════ PASO 2 — KAGGLE ════════════════ */}
      <section
        ref={(el) => { sectionRefs.current[2] = el; }}
        style={{
          minHeight: "100vh",
          scrollSnapAlign: "start",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="pf-reveal" style={{ width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: accentColors[2][0], marginBottom: "20px" }}>
            02 · Activa
          </div>
          <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, margin: 0, marginBottom: "20px", color: "#ffffff" }}>
            Actívalo en Kaggle o Colab.
          </h2>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: 0, marginBottom: "20px", maxWidth: "620px" }}>
            Cada modelo vive en su propia plataforma: algunos corren en Kaggle, otros en Google Colab. Abre el notebook que descargaste donde corresponde y ejecuta <strong style={{ color: "#ffffff" }}>Run All</strong>.
          </p>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: 0, marginBottom: "48px", maxWidth: "620px" }}>
            Y listo. No tienes que volver a mirar el notebook. Desde ese momento, <strong style={{ color: "#ffffff" }}>Pathfinder Studio te muestra el progreso de la instalación en tiempo real</strong> y te avisa cuando tu estación está lista.
          </p>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: 0, marginBottom: "48px", maxWidth: "620px" }}>
            La primera carga tarda entre 5 y 15 minutos. Las siguientes veces arranca mucho más rápido.
          </p>
          <VideoPlaceholder label="Cómo activar tu estación en Kaggle" url={WELCOME_MEDIA_URLS.step2_activate} />
        </div>
      </section>

      {/* ════════════════ PASO 3 — COHETE ════════════════ */}
      <section
        ref={(el) => { sectionRefs.current[3] = el; }}
        style={{
          minHeight: "100vh",
          scrollSnapAlign: "start",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="pf-reveal" style={{ width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: "32px" }}>
            <RocketLaunch />
          </div>
          <div style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: accentColors[3][0], marginBottom: "20px" }}>
            03 · Lista
          </div>
          <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, margin: 0, marginBottom: "20px", color: "#ffffff" }}>
            Pathfinder detecta tu estación.
          </h2>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: 0, marginBottom: "20px", maxWidth: "620px" }}>
            Pathfinder monitorea todo por ti. Mientras el modelo se instala, en Studio ves el progreso en vivo. Cuando termina, aparece el badge verde <strong style={{ color: "#10b981" }}>● Estación lista</strong> al lado del modelo — y ahí ya puedes crear.
          </p>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: 0, marginBottom: "20px", maxWidth: "620px" }}>
            No tienes que volver a Kaggle o Colab. No tienes que refrescar. No tienes que revisar el output del notebook. <strong style={{ color: "#ffffff" }}>Pathfinder te avisa.</strong>
          </p>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "rgba(255,255,255,0.5)", margin: 0, marginBottom: "48px", maxWidth: "620px" }}>
            Si eres de los que les gusta ver la cocina: la última celda del notebook también muestra <strong style={{ color: "#a5b4fc", fontFamily: "monospace" }}>READY</strong> cuando termina. Pero es opcional — el aviso te llega directo en Studio.
          </p>
          <VideoPlaceholder label="Cómo verificar que tu estación está lista" url={WELCOME_MEDIA_URLS.step3_ready} />
        </div>
      </section>

      {/* ════════════════ PASO 4 — FINAL ════════════════ */}
      <section
        ref={(el) => { sectionRefs.current[4] = el; }}
        style={{
          minHeight: "100vh",
          scrollSnapAlign: "start",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="pf-reveal" style={{ maxWidth: "720px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10b981",
              marginBottom: "32px",
            }}
          >
            <BadgeCheck size={32} strokeWidth={1.8} />
          </div>

          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(2rem, 4vw, 3.25rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: "20px",
              background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Estás dentro.
          </h2>

          <p
            style={{
              fontSize: "1.0625rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.65)",
              margin: 0,
              marginBottom: "40px",
              maxWidth: "560px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Abre el Studio y empieza a crear. Si te pierdes, la guía paso a paso te tiene cubierto.
          </p>

          {/* Checkbox de Términos */}
          <div
            style={{
              maxWidth: "560px",
              margin: "0 auto 32px",
              padding: "16px 20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              textAlign: "left",
            }}
          >
            <label
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                cursor: "pointer",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.875rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                style={{
                  marginTop: "3px",
                  width: "18px",
                  height: "18px",
                  accentColor: "#10b981",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <span>
                Acepto los{" "}
                <a
                  href="/legal/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#a5b4fc",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                  }}
                >
                  Términos de Servicio de Pathfinder
                </a>
                , los{" "}
                <a
                  href="https://www.kaggle.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#a5b4fc",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                  }}
                >
                  Términos de Kaggle
                </a>{" "}
                y los{" "}
                <a
                  href="https://research.google.com/colaboratory/tos.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#a5b4fc",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                  }}
                >
                  Términos de Google Colab
                </a>
                .
              </span>
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleEnterStudio}
              disabled={!tosAccepted || isSubmitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: tosAccepted
                  ? "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)"
                  : "rgba(255,255,255,0.08)",
                color: tosAccepted ? "#ffffff" : "rgba(255,255,255,0.4)",
                border: "none",
                borderRadius: "9999px",
                padding: "16px 40px",
                fontSize: "1rem",
                fontWeight: 700,
                fontFamily: "var(--pf-font-ui, system-ui)",
                cursor: !tosAccepted
                  ? "not-allowed"
                  : isSubmitting
                  ? "wait"
                  : "pointer",
                boxShadow: tosAccepted
                  ? "0 10px 30px -8px rgba(16, 185, 129, 0.5)"
                  : "none",
                transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
                opacity: isSubmitting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (tosAccepted && !isSubmitting) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 16px 40px -8px rgba(16, 185, 129, 0.7)";
                }
              }}
              onMouseLeave={(e) => {
                if (tosAccepted && !isSubmitting) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 10px 30px -8px rgba(16, 185, 129, 0.5)";
                }
              }}
            >
              {isSubmitting ? "Guardando..." : "Ir al Studio →"}
            </button>

            <button
              onClick={() => navigate("/how-it-works")}
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "9999px",
                padding: "16px 32px",
                fontSize: "0.9375rem",
                fontWeight: 600,
                fontFamily: "var(--pf-font-ui, system-ui)",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.75)";
              }}
            >
              Ver la guía paso a paso
            </button>
          </div>
        </div>
      </section>

      {/* Estilos globales */}
      <style>{`
        .pf-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pf-visible .pf-reveal {
          opacity: 1;
          transform: translateY(0);
        }

        /* Scrollbar sutil */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.5); }

        @media (max-width: 640px) {
          .pf-reveal { transform: translateY(20px); }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
