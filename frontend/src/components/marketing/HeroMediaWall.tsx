// src/components/marketing/HeroMediaWall.tsx
import React from "react";

interface HeroMediaWallProps {
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Placeholders — Fase 1
//
// 50 imágenes distribuidas en 3 filas (18 + 20 + 18 = 56 slots).
// Usamos Picsum Photos: imágenes reales, seed determinístico, sin API key.
//
// Cuando tengamos las imágenes reales de Pathfinder, este archivo se reemplaza
// por la versión que lee de Supabase Storage + tabla `hero_media`.
// ---------------------------------------------------------------------------

function buildRow(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}-${i + 1}`);
}

const ROW_TOP = buildRow("hero-top", 18);
const ROW_MIDDLE = buildRow("hero-middle", 20);
const ROW_BOTTOM = buildRow("hero-bottom", 18);

const buildUrl = (seed: string) =>
  `https://picsum.photos/seed/${seed}/400/400`;

const MediaRow: React.FC<{
  ids: string[];
  direction: "left" | "right";
  duration: number;
  blur: number;
  opacity: number;
  offsetY: string;
}> = ({ ids, direction, duration, blur, opacity, offsetY }) => {
  // Duplicamos para marquee infinito
  const doubled = [...ids, ...ids];

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        position: "absolute",
        left: "-10%",
        right: "-10%",
        top: offsetY,
        filter: `blur(${blur}px)`,
        opacity,
        animation: `${direction === "left" ? "heroScrollLeft" : "heroScrollRight"} ${duration}s linear infinite`,
        willChange: "transform",
      }}
    >
      {doubled.map((id, i) => (
        <div
          key={i}
          style={{
            flexShrink: 0,
            width: "180px",
            aspectRatio: "1 / 1",
            borderRadius: "12px",
            overflow: "hidden",
            background: "#1a1a1a",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <img
            src={buildUrl(id)}
            alt=""
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      ))}
    </div>
  );
};

const HeroMediaWall: React.FC<HeroMediaWallProps> = ({ children }) => {
  return (
    <section
      className="hero-media-wall"
      style={{
        position: "relative",
        minHeight: "90vh",
        overflow: "hidden",
        background: "#0A0A0A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 24px",
      }}
    >
      <div
        className="hero-media-wall__bg"
        style={{
          position: "absolute",
          inset: 0,
          transform: "perspective(1200px) rotateX(-6deg) scale(1.15)",
          transformOrigin: "center center",
          pointerEvents: "none",
        }}
      >
        <MediaRow ids={ROW_TOP} direction="left" duration={90} blur={3} opacity={0.55} offsetY="6%" />
        <MediaRow ids={ROW_MIDDLE} direction="right" duration={75} blur={2} opacity={0.7} offsetY="34%" />
        <MediaRow ids={ROW_BOTTOM} direction="left" duration={100} blur={4} opacity={0.5} offsetY="62%" />
      </div>

      <div
        className="hero-media-wall__overlay"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.65) 35%, rgba(10,10,10,0.4) 65%, rgba(10,10,10,0.75) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "780px",
          textAlign: "center",
          color: "#FFFFFF",
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes heroScrollLeft {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(calc(-50% - 8px), 0, 0); }
        }
        @keyframes heroScrollRight {
          from { transform: translate3d(calc(-50% - 8px), 0, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }

        @media (max-width: 767px) {
          .hero-media-wall__bg {
            transform: none !important;
            filter: blur(2px);
          }
          .hero-media-wall__overlay {
            background: radial-gradient(
              ellipse at center,
              rgba(10,10,10,0.9) 0%,
              rgba(10,10,10,0.75) 50%,
              rgba(10,10,10,0.85) 100%
            ) !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-media-wall__bg > div {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroMediaWall;
