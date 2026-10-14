// src/pages/WelcomePage.tsx
// Bienvenida — experiencia inmersiva v3.
// SpaceWarp interactivo + StationCore (ISS + Interstellar) + copy original.
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SealCheck,
  Play,
  ArrowDown,
  ArrowRight,
} from "@phosphor-icons/react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import SpaceWarp from "../components/marketing/SpaceWarp";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { fadeInUp, staggerContainer } from "../design/motion";

// ============================================================
// MEDIA URLs — 3 videos en Storage.
// ============================================================
const WELCOME_MEDIA_URLS = {
  step1_download: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step1-download.mp4",
  step2_activate: "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step2-activate.mp4",
  step3_ready:    "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/welcome-step3-ready.mp4",
};

// ============================================================
// AURORA ATMOSPHERE
// ============================================================
const AuroraAtmosphere: React.FC = () => (
  <>
    <div
      aria-hidden
      className="pf-aurora-1"
      style={{
        position: "fixed",
        top: "-20%",
        left: "-15%",
        width: "900px",
        height: "900px",
        background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)",
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
    <div
      aria-hidden
      className="pf-aurora-2"
      style={{
        position: "fixed",
        bottom: "-25%",
        right: "-10%",
        width: "800px",
        height: "800px",
        background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 40%, transparent 70%)",
        filter: "blur(90px)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        opacity: 0.025,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        zIndex: 1,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
      }}
    />
  </>
);

// ============================================================
// STATION CORE — ISS + Interstellar
// Anillo Endurance + brazos solares ISS + núcleo Pathfinder.
// ============================================================
// LIVING SPACE — animaciones ambientales
// ============================================================
const TWINKLE_STARS = [
  { top: "12%", left: "18%", size: 2, delay: 0, dur: 3.2 },
  { top: "8%",  left: "72%", size: 3, delay: 0.8, dur: 2.8 },
  { top: "22%", left: "38%", size: 2, delay: 1.6, dur: 3.6 },
  { top: "18%", left: "88%", size: 2, delay: 2.4, dur: 3.0 },
  { top: "32%", left: "12%", size: 3, delay: 0.4, dur: 2.6 },
  { top: "28%", left: "62%", size: 2, delay: 1.2, dur: 3.4 },
  { top: "42%", left: "82%", size: 2, delay: 2.0, dur: 2.9 },
  { top: "48%", left: "28%", size: 3, delay: 0.6, dur: 3.1 },
  { top: "55%", left: "8%",  size: 2, delay: 1.4, dur: 3.3 },
  { top: "62%", left: "48%", size: 2, delay: 2.2, dur: 2.7 },
  { top: "58%", left: "92%", size: 3, delay: 0.2, dur: 3.5 },
  { top: "72%", left: "22%", size: 2, delay: 1.0, dur: 3.0 },
  { top: "78%", left: "68%", size: 2, delay: 1.8, dur: 3.2 },
  { top: "82%", left: "42%", size: 3, delay: 2.6, dur: 2.8 },
  { top: "88%", left: "85%", size: 2, delay: 0.4, dur: 3.6 },
  { top: "92%", left: "15%", size: 2, delay: 1.6, dur: 2.9 },
  { top: "15%", left: "52%", size: 2, delay: 2.8, dur: 3.1 },
  { top: "38%", left: "5%",  size: 2, delay: 0.9, dur: 3.4 },
  { top: "52%", left: "72%", size: 3, delay: 2.1, dur: 2.7 },
  { top: "68%", left: "35%", size: 2, delay: 1.3, dur: 3.3 },
];

const DUST_PARTICLES = [
  { top: "20%", left: "10%", dx: 80,  dy: -40, dur: 18, delay: 0 },
  { top: "35%", left: "80%", dx: -60, dy: 30,  dur: 22, delay: 2 },
  { top: "50%", left: "25%", dx: 50,  dy: -50, dur: 20, delay: 4 },
  { top: "65%", left: "70%", dx: -70, dy: 20,  dur: 24, delay: 1 },
  { top: "15%", left: "50%", dx: 60,  dy: 40,  dur: 19, delay: 3 },
  { top: "75%", left: "15%", dx: 40,  dy: -30, dur: 21, delay: 5 },
  { top: "85%", left: "55%", dx: -50, dy: -40, dur: 23, delay: 2.5 },
  { top: "40%", left: "90%", dx: -80, dy: 30,  dur: 20, delay: 6 },
  { top: "60%", left: "5%",  dx: 70,  dy: -20, dur: 22, delay: 1.5 },
  { top: "30%", left: "40%", dx: -40, dy: 50,  dur: 19, delay: 4.5 },
  { top: "70%", left: "85%", dx: -60, dy: -30, dur: 25, delay: 0.5 },
  { top: "45%", left: "45%", dx: 30,  dy: 60,  dur: 21, delay: 3.5 },
];

const LivingSpace: React.FC = () => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
    }}
  >
    {TWINKLE_STARS.map((s, i) => (
      <div
        key={`t${i}`}
        style={{
          position: "absolute",
          top: s.top,
          left: s.left,
          width: s.size,
          height: s.size,
          borderRadius: "50%",
          background: "#FFFFFF",
          animation: `pf-twinkle-anim ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }}
      />
    ))}

    {DUST_PARTICLES.map((d, i) => (
      <div
        key={`d${i}`}
        style={{
          position: "absolute",
          top: d.top,
          left: d.left,
          width: 2,
          height: 2,
          borderRadius: "50%",
          background: "rgba(167,139,250,0.65)",
          boxShadow: "0 0 6px rgba(139,92,246,0.6)",
          animation: `pf-dust-drift ${d.dur}s ${d.delay}s ease-in-out infinite`,
          ["--dx" as string]: `${d.dx}px`,
          ["--dy" as string]: `${d.dy}px`,
        }}
      />
    ))}

    <div
      style={{
        position: "absolute",
        top: "18%",
        left: "-10%",
        width: 120,
        height: 2,
        background:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)",
        animation: "pf-shooting-star-anim 22s 4s linear infinite",
        opacity: 0,
      }}
    />
  </div>
);

// ============================================================
// NEBULA LAYER — 3 nebulosas viajeras con parallax
// ============================================================
const NebulaLayer: React.FC<{
  nebulaRef: React.MutableRefObject<number>;
}> = ({ nebulaRef }) => {
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ref3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const y = nebulaRef.current;
      if (ref1.current) ref1.current.style.transform = `translate3d(0, ${y * 0.4}px, 0)`;
      if (ref2.current) ref2.current.style.transform = `translate3d(0, ${y * 0.6}px, 0)`;
      if (ref3.current) ref3.current.style.transform = `translate3d(0, ${y * 0.9}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nebulaRef]);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: "-40% 0",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        ref={ref1}
        style={{
          position: "absolute",
          top: "15%",
          left: "10%",
          width: 620,
          height: 620,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.20) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)",
          filter: "blur(80px)",
          willChange: "transform",
        }}
      />
      <div
        ref={ref2}
        style={{
          position: "absolute",
          top: "45%",
          right: "5%",
          width: 540,
          height: 540,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(34,211,238,0.16) 0%, rgba(34,211,238,0.04) 40%, transparent 70%)",
          filter: "blur(90px)",
          willChange: "transform",
        }}
      />
      <div
        ref={ref3}
        style={{
          position: "absolute",
          top: "75%",
          left: "45%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(236,72,153,0.12) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)",
          filter: "blur(100px)",
          willChange: "transform",
        }}
      />
    </div>
  );
};

// ============================================================
// STATION STATUS PANEL — checklist del sistema
// ============================================================
const STATION_CHECKS = [
  { label: "Workflow descargado", status: "done" as const },
  { label: "Runtime activo", status: "done" as const },
  { label: "Modelo cargado", status: "done" as const },
  { label: "Listo para crear", status: "ready" as const },
];

const StationStatusPanel: React.FC = () => (
  <div
    aria-hidden
    style={{
      position: "relative",
      width: "100%",
      maxWidth: 440,
      margin: "0 auto",
      padding: "20px 22px",
      background: "rgba(15, 15, 18, 0.65)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(139,92,246,0.28)",
      borderRadius: 14,
      boxShadow:
        "0 24px 60px -20px rgba(139,92,246,0.35), 0 0 0 1px rgba(139,92,246,0.08) inset",
      overflow: "hidden",
    }}
  >
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: "-40%",
        right: "-30%",
        width: 260,
        height: 260,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.20), transparent 65%)",
        filter: "blur(40px)",
        pointerEvents: "none",
      }}
    />

    {/* Header */}
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        paddingBottom: 16,
        marginBottom: 16,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#10B981",
          boxShadow: "0 0 8px rgba(16,185,129,0.8)",
          animation: "pf-panel-dot-pulse 2s ease-in-out infinite",
        }}
      />
      <span
        style={{
          fontFamily: "var(--pf-font-mono)",
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#34D399",
          flex: 1,
        }}
      >
        Estación lista
      </span>
      <span
        style={{
          fontFamily: "var(--pf-font-mono)",
          fontSize: "0.6875rem",
          fontWeight: 500,
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.35)",
        }}
      >
        00:42s
      </span>
    </div>

    {/* Rows */}
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {STATION_CHECKS.map((c, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "var(--pf-font-mono)",
            fontSize: "0.8125rem",
            fontWeight: 500,
            letterSpacing: "0.02em",
            color: c.status === "ready" ? "#F5F5F7" : "rgba(255,255,255,0.55)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
              borderRadius: 4,
              background: c.status === "ready"
                ? "rgba(139,92,246,0.15)"
                : "rgba(16,185,129,0.12)",
              border: c.status === "ready"
                ? "1px solid rgba(139,92,246,0.45)"
                : "1px solid rgba(16,185,129,0.35)",
              color: c.status === "ready" ? "#A78BFA" : "#34D399",
              fontSize: "0.6875rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {c.status === "done" ? "✓" : "●"}
          </span>
          <span style={{ flex: 1 }}>{c.label}</span>
          {c.status === "ready" && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#A78BFA",
                boxShadow: "0 0 10px rgba(139,92,246,0.9)",
                animation: "pf-panel-dot-pulse 2s ease-in-out infinite",
              }}
            />
          )}
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// SCROLL DRIVER — actualiza parallaxRef sin re-renders
// ============================================================
const ScrollDriver: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  parallaxRef: React.MutableRefObject<number>;
  nebulaRef: React.MutableRefObject<number>;
}> = ({ containerRef, parallaxRef, nebulaRef }) => {
  const { scrollYProgress } = useScroll({ container: containerRef });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    parallaxRef.current = -v * 400;
    nebulaRef.current = -v * 800;
  });

  return null;
};

// ============================================================
// KEYFRAMES para LivingSpace
// ============================================================
const LivingSpaceStyles: React.FC = () => (
  <style>{`
    @keyframes pf-twinkle-anim {
      0%, 100% { opacity: 0.15; transform: scale(0.8); }
      50%      { opacity: 0.95; transform: scale(1.4); }
    }
    @keyframes pf-dust-drift {
      0%   { opacity: 0; transform: translate(0, 0); }
      20%  { opacity: 0.9; }
      80%  { opacity: 0.9; }
      100% { opacity: 0; transform: translate(var(--dx, 40px), var(--dy, -40px)); }
    }
    @keyframes pf-shooting-star-anim {
      0%   { opacity: 0; transform: translate(0, 0) rotate(22deg); }
      1%   { opacity: 1; }
      3%   { opacity: 1; transform: translate(120vw, 60vh) rotate(22deg); }
      4%   { opacity: 0; transform: translate(120vw, 60vh) rotate(22deg); }
      100% { opacity: 0; transform: translate(0, 0) rotate(22deg); }
    }
    @keyframes pf-panel-dot-pulse {
      0%, 100% { transform: scale(1); opacity: 0.9; }
      50%      { transform: scale(1.35); opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .pf-twinkle-anim, .pf-dust-drift, .pf-shooting-star-anim { animation: none !important; }
    }
  `}</style>
);

// ============================================================
// VIDEO PLACEHOLDER
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
          maxWidth: 880,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(139,92,246,0.28)",
          background: "#0a0a12",
          boxShadow: "0 24px 60px -20px rgba(139,92,246,0.35)",
        }}
      >
        <VideoPlayer
          src={url}
          aspectRatio="16/9"
          objectFit="contain"
          background="transparent"
          autoPlay={false}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 880,
        aspectRatio: "16 / 9",
        borderRadius: 16,
        border: "1px dashed rgba(139,92,246,0.35)",
        background:
          "linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(34,211,238,0.03) 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(139,92,246,0.12)",
          border: "1px solid rgba(139,92,246,0.30)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#A78BFA",
        }}
      >
        <Play size={24} weight="regular" />
      </div>
      <div
        style={{
          fontFamily: "var(--pf-font-ui)",
          fontSize: "0.9375rem",
          fontWeight: 600,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--pf-font-mono)",
          fontSize: "0.625rem",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        Video próximamente
      </div>
    </div>
  );
};

// ============================================================
// PROGRESS HUD — pill flotante con contador
// ============================================================
const ProgressHUD: React.FC<{
  activeStep: number;
  totalSteps: number;
  onDotClick: (i: number) => void;
}> = ({ activeStep, totalSteps, onDotClick }) => (
  <div
    style={{
      position: "fixed",
      top: 24,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "10px 18px",
      background: "rgba(10,10,18,0.72)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(139,92,246,0.22)",
      borderRadius: 9999,
      boxShadow: "0 12px 32px -12px rgba(0,0,0,0.7)",
    }}
  >
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          aria-label={`Ir al paso ${i + 1}`}
          style={{
            width: activeStep === i ? 22 : 6,
            height: 6,
            borderRadius: 9999,
            border: "none",
            background:
              activeStep === i
                ? "#A78BFA"
                : activeStep > i
                  ? "rgba(167,139,250,0.45)"
                  : "rgba(255,255,255,0.22)",
            cursor: "pointer",
            padding: 0,
            transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow:
              activeStep === i ? "0 0 10px rgba(139,92,246,0.7)" : "none",
          }}
        />
      ))}
    </div>

    <div
      style={{
        width: 1,
        height: 14,
        background: "rgba(255,255,255,0.12)",
      }}
    />

    <div
      style={{
        fontFamily: "var(--pf-font-mono)",
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.55)",
        minWidth: 44,
        textAlign: "right",
      }}
    >
      {String(activeStep + 1).padStart(2, "0")}{" "}
      <span style={{ color: "rgba(255,255,255,0.30)" }}>/</span>{" "}
      {String(totalSteps).padStart(2, "0")}
    </div>
  </div>
);

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
  const parallaxRef = useRef<number>(0);
  const nebulaRef = useRef<number>(0);

  const totalSteps = 5;

  const scrollToStep = (index: number) => {
    const el = sectionRefs.current[index];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Intersection Observer para actualizar el dot activo + disparar reveals
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
      { root: container, threshold: [0.4, 0.6] },
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
        color: "#FFFFFF",
      }}
    >
      {/* ─── Scroll driver (sin render) ─── */}
      <ScrollDriver
        containerRef={containerRef}
        parallaxRef={parallaxRef}
        nebulaRef={nebulaRef}
      />

      {/* ─── SpaceWarp deepfield + nebulosas + espacio vivo ─── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <SpaceWarp
          variant="deepfield"
          density={2000}
          intensity={1}
          centerX={0.5}
          centerY={0.4}
          parallaxRef={parallaxRef}
        />
        <NebulaLayer nebulaRef={nebulaRef} />
        <LivingSpace />
      </div>

      <LivingSpaceStyles />

      <AuroraAtmosphere />

      <ProgressHUD
        activeStep={activeStep}
        totalSteps={totalSteps}
        onDotClick={scrollToStep}
      />

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
          padding: "120px 24px 80px",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="pf-reveal"
          style={{ maxWidth: 720 }}
        >
          <motion.h1
            variants={fadeInUp}
            style={{
              fontFamily: "'Satoshi', system-ui, sans-serif",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              margin: 0,
              marginBottom: 24,
              background: "linear-gradient(135deg, #FFFFFF 0%, #A78BFA 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Bienvenido a tu estación.
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.62)",
              margin: 0,
              marginBottom: 48,
              fontWeight: 400,
              maxWidth: 560,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Aquí empieza tu historia.
          </motion.p>

          <motion.button
            variants={fadeInUp}
            onClick={() => scrollToStep(1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "#8B5CF6",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 9999,
              padding: "16px 36px",
              fontFamily: "var(--pf-font-ui)",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 12px 32px -8px rgba(139,92,246,0.6)",
              transition: "transform 200ms, background 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.background = "#7C66DD";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = "#8B5CF6";
            }}
          >
            Comenzar
            <ArrowDown size={16} weight="regular" />
          </motion.button>
        </motion.div>
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
          zIndex: 2,
        }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="pf-reveal"
          style={{ width: "100%", maxWidth: 900, display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <motion.div
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "#A78BFA",
              marginBottom: 24,
            }}
          >
            01 · Descarga
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-display-alt)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 24,
              color: "#F5F5F7",
            }}
          >
            Descarga tu workflow.
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "1.0625rem",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.6)",
              margin: 0,
              marginBottom: 48,
              maxWidth: 620,
            }}
          >
            Mi Estación es donde viven todos los modelos disponibles. Cuando
            encuentres el que quieras usar, haz clic en{" "}
            <strong style={{ color: "#F5F5F7" }}>Descargar workflow</strong>.
          </motion.p>

          <motion.div variants={fadeInUp} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <VideoPlaceholder
              label="Cómo descargar tu workflow"
              url={WELCOME_MEDIA_URLS.step1_download}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════ PASO 2 — ACTIVA ════════════════ */}
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
          zIndex: 2,
        }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="pf-reveal"
          style={{ width: "100%", maxWidth: 900, display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <motion.div
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "#A78BFA",
              marginBottom: 24,
            }}
          >
            02 · Activa
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-display-alt)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 24,
              color: "#F5F5F7",
            }}
          >
            Actívalo en Kaggle o Colab.
          </motion.h2>

          <motion.div
            variants={fadeInUp}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              marginBottom: 48,
              maxWidth: 620,
            }}
          >
            <p
              style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1.0625rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.6)",
                margin: 0,
              }}
            >
              Cada modelo vive en su propia plataforma: algunos corren en Kaggle,
              otros en Google Colab. Abre el notebook que descargaste donde
              corresponde y ejecuta{" "}
              <strong style={{ color: "#F5F5F7" }}>Run All</strong>.
            </p>
            <p
              style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1.0625rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.6)",
                margin: 0,
              }}
            >
              Y listo. No tienes que volver a mirar el notebook. Desde ese
              momento,{" "}
              <strong style={{ color: "#F5F5F7" }}>
                Pathfinder Studio te muestra el progreso de la instalación en
                tiempo real
              </strong>{" "}
              y te avisa cuando tu estación está lista.
            </p>
            <p
              style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1.0625rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.6)",
                margin: 0,
              }}
            >
              La primera carga tarda entre 5 y 15 minutos. Las siguientes veces
              arranca mucho más rápido.
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <VideoPlaceholder
              label="Cómo activar tu estación en Kaggle"
              url={WELCOME_MEDIA_URLS.step2_activate}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════ PASO 3 — STATION CORE ════════════════ */}
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
          zIndex: 2,
        }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="pf-reveal"
          style={{ width: "100%", maxWidth: 900, display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <motion.div variants={fadeInUp} style={{ marginBottom: 40 }}>
            <StationStatusPanel />
          </motion.div>

          <motion.div
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "#A78BFA",
              marginBottom: 24,
            }}
          >
            03 · Lista
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-display-alt)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 24,
              color: "#F5F5F7",
            }}
          >
            Pathfinder detecta tu estación.
          </motion.h2>

          <motion.div
            variants={fadeInUp}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              marginBottom: 48,
              maxWidth: 620,
            }}
          >
            <p
              style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1.0625rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.6)",
                margin: 0,
              }}
            >
              Pathfinder monitorea todo por ti. Mientras el modelo se instala, en
              Studio ves el progreso en vivo. Cuando termina, aparece el badge
              verde <strong style={{ color: "#10B981" }}>● Estación lista</strong>{" "}
              al lado del modelo — y ahí ya puedes crear.
            </p>
            <p
              style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "1.0625rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.6)",
                margin: 0,
              }}
            >
              No tienes que volver a Kaggle o Colab. No tienes que refrescar. No
              tienes que revisar el output del notebook.{" "}
              <strong style={{ color: "#F5F5F7" }}>Pathfinder te avisa.</strong>
            </p>
            <p
              style={{
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.45)",
                margin: 0,
              }}
            >
              Si eres de los que les gusta ver la cocina: la última celda del
              notebook también muestra{" "}
              <strong style={{ color: "#A78BFA", fontFamily: "var(--pf-font-mono)" }}>
                READY
              </strong>{" "}
              cuando termina. Pero es opcional — el aviso te llega directo en
              Studio.
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <VideoPlaceholder
              label="Cómo verificar que tu estación está lista"
              url={WELCOME_MEDIA_URLS.step3_ready}
            />
          </motion.div>
        </motion.div>
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
          zIndex: 2,
        }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="pf-reveal"
          style={{ maxWidth: 720, display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          {/* Badge "Estación lista" con dot pulsante */}
          <motion.div
            variants={fadeInUp}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 14px",
              background: "rgba(16,185,129,0.10)",
              border: "1px solid rgba(16,185,129,0.35)",
              borderRadius: 9999,
              fontFamily: "var(--pf-font-mono)",
              fontSize: "0.625rem",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#34D399",
              marginBottom: 28,
            }}
          >
            <span
              className="pf-status-dot"
              aria-hidden
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 8px rgba(16,185,129,0.7)",
              }}
            />
            Estación lista
          </motion.div>

          {/* Chip con SealCheck */}
          <motion.div
            variants={fadeInUp}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(34,211,238,0.14) 100%)",
              border: "1px solid rgba(16,185,129,0.32)",
              color: "#10B981",
              marginBottom: 32,
            }}
          >
            <SealCheck size={32} weight="regular" />
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            style={{
              fontFamily: "'Satoshi', system-ui, sans-serif",
              fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              margin: 0,
              marginBottom: 24,
              background:
                "linear-gradient(135deg, #FFFFFF 0%, #A78BFA 60%, #8B5CF6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Estás dentro.
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            style={{
              fontFamily: "var(--pf-font-ui)",
              fontSize: "1.0625rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.6)",
              margin: 0,
              marginBottom: 40,
              maxWidth: 560,
            }}
          >
            Abre el Studio y empieza a crear. Si te pierdes, la guía paso a paso
            te tiene cubierto.
          </motion.p>

          {/* TOS card */}
          <motion.div
            variants={fadeInUp}
            style={{
              width: "100%",
              maxWidth: 560,
              marginBottom: 32,
              padding: "18px 20px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              textAlign: "left",
            }}
          >
            <label
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                cursor: "pointer",
                fontFamily: "var(--pf-font-ui)",
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
                  marginTop: 3,
                  width: 18,
                  height: 18,
                  accentColor: "#10B981",
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
                    color: "#A78BFA",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
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
                    color: "#A78BFA",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
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
                    color: "#A78BFA",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                  }}
                >
                  Términos de Google Colab
                </a>
                .
              </span>
            </label>
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleEnterStudio}
              disabled={!tosAccepted || isSubmitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: tosAccepted
                  ? "linear-gradient(135deg, #10B981 0%, #22D3EE 100%)"
                  : "rgba(255,255,255,0.06)",
                color: tosAccepted ? "#FFFFFF" : "rgba(255,255,255,0.35)",
                border: "none",
                borderRadius: 9999,
                padding: "16px 36px",
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: !tosAccepted
                  ? "not-allowed"
                  : isSubmitting
                    ? "wait"
                    : "pointer",
                boxShadow: tosAccepted
                  ? "0 12px 32px -8px rgba(16,185,129,0.55)"
                  : "none",
                transition: "transform 200ms, background 200ms",
                opacity: isSubmitting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (tosAccepted && !isSubmitting) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {isSubmitting ? "Guardando..." : "Ir al Studio"}
              {!isSubmitting && <ArrowRight size={14} weight="regular" />}
            </button>

            <button
              onClick={() => navigate("/how-it-works")}
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 9999,
                padding: "16px 32px",
                fontFamily: "var(--pf-font-ui)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 150ms, color 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.75)";
              }}
            >
              Ver la guía paso a paso
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Estilos globales ─── */}
      <style>{`
        .pf-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pf-visible .pf-reveal {
          opacity: 1;
          transform: translateY(0);
        }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.30);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.50);
        }

        @media (max-width: 640px) {
          .pf-reveal { transform: translateY(16px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .pf-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
