// src/components/marketing/Atmosphere.tsx
// Capas de atmósfera premium — aurora mesh + grain + espacio vivo.
// Compartidas por Welcome, Studio y cualquier página con tema Space.

import React from "react";

// ============================================================
// AURORA ATMOSPHERE — 2 radiales animados + grain
// ============================================================
export const AuroraAtmosphere: React.FC<{ zIndex?: number }> = ({ zIndex = 1 }) => (
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
        background:
          "radial-gradient(circle, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)",
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex,
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
        background:
          "radial-gradient(circle, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 40%, transparent 70%)",
        filter: "blur(90px)",
        pointerEvents: "none",
        zIndex,
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
        zIndex,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
      }}
    />
  </>
);

// ============================================================
// LIVING SPACE — twinkle + dust drift + shooting star
// ============================================================
const TWINKLE_STARS = [
  { top: "12%", left: "18%", size: 2, delay: 0, dur: 3.2 },
  { top: "8%", left: "72%", size: 3, delay: 0.8, dur: 2.8 },
  { top: "22%", left: "38%", size: 2, delay: 1.6, dur: 3.6 },
  { top: "18%", left: "88%", size: 2, delay: 2.4, dur: 3.0 },
  { top: "32%", left: "12%", size: 3, delay: 0.4, dur: 2.6 },
  { top: "28%", left: "62%", size: 2, delay: 1.2, dur: 3.4 },
  { top: "42%", left: "82%", size: 2, delay: 2.0, dur: 2.9 },
  { top: "48%", left: "28%", size: 3, delay: 0.6, dur: 3.1 },
  { top: "55%", left: "8%", size: 2, delay: 1.4, dur: 3.3 },
  { top: "62%", left: "48%", size: 2, delay: 2.2, dur: 2.7 },
  { top: "58%", left: "92%", size: 3, delay: 0.2, dur: 3.5 },
  { top: "72%", left: "22%", size: 2, delay: 1.0, dur: 3.0 },
  { top: "78%", left: "68%", size: 2, delay: 1.8, dur: 3.2 },
  { top: "82%", left: "42%", size: 3, delay: 2.6, dur: 2.8 },
  { top: "88%", left: "85%", size: 2, delay: 0.4, dur: 3.6 },
  { top: "92%", left: "15%", size: 2, delay: 1.6, dur: 2.9 },
  { top: "15%", left: "52%", size: 2, delay: 2.8, dur: 3.1 },
  { top: "38%", left: "5%", size: 2, delay: 0.9, dur: 3.4 },
  { top: "52%", left: "72%", size: 3, delay: 2.1, dur: 2.7 },
  { top: "68%", left: "35%", size: 2, delay: 1.3, dur: 3.3 },
];

const DUST_PARTICLES = [
  { top: "20%", left: "10%", dx: 80, dy: -40, dur: 18, delay: 0 },
  { top: "35%", left: "80%", dx: -60, dy: 30, dur: 22, delay: 2 },
  { top: "50%", left: "25%", dx: 50, dy: -50, dur: 20, delay: 4 },
  { top: "65%", left: "70%", dx: -70, dy: 20, dur: 24, delay: 1 },
  { top: "15%", left: "50%", dx: 60, dy: 40, dur: 19, delay: 3 },
  { top: "75%", left: "15%", dx: 40, dy: -30, dur: 21, delay: 5 },
  { top: "85%", left: "55%", dx: -50, dy: -40, dur: 23, delay: 2.5 },
  { top: "40%", left: "90%", dx: -80, dy: 30, dur: 20, delay: 6 },
  { top: "60%", left: "5%", dx: 70, dy: -20, dur: 22, delay: 1.5 },
  { top: "30%", left: "40%", dx: -40, dy: 50, dur: 19, delay: 4.5 },
  { top: "70%", left: "85%", dx: -60, dy: -30, dur: 25, delay: 0.5 },
  { top: "45%", left: "45%", dx: 30, dy: 60, dur: 21, delay: 3.5 },
];

export const LivingSpace: React.FC = () => (
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
// LIVING SPACE STYLES — keyframes centralizados
// ============================================================
export const LivingSpaceStyles: React.FC = () => (
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
    @media (prefers-reduced-motion: reduce) {
      .pf-twinkle-anim, .pf-dust-drift, .pf-shooting-star-anim { animation: none !important; }
    }
  `}</style>
);

// ============================================================
// ATMOSPHERE LAYER — combinación completa (SpaceWarp + aurora + living)
// ============================================================
import SpaceWarp from "./SpaceWarp";

export const AtmosphereLayer: React.FC = () => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 0,
    }}
  >
    <SpaceWarp variant="deepfield" density={2000} intensity={1} centerX={0.5} centerY={0.4} />
    <AuroraAtmosphere />
    <LivingSpace />
    <LivingSpaceStyles />
  </div>
);
