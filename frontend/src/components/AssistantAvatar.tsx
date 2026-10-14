// src/components/AssistantAvatar.tsx
//
// AI Presence — orbe luminoso que respira.
// Usa los accents del tema activo (Space/Dark/Light).
// Referencia: el orbe de Her (2013), no HAL.

import React from "react";

interface AssistantAvatarProps {
  /** Tamaño del SVG en px. Default: 30. */
  size?: number;
}

const AssistantAvatar: React.FC<AssistantAvatarProps> = ({ size = 30 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    style={{ display: "block", overflow: "visible" }}
    aria-hidden
  >
    <defs>
      {/* Núcleo brillante — accent-primary → transparente */}
      <radialGradient id="pf-ai-core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--pf-accent-primary)" stopOpacity="1" />
        <stop offset="35%" stopColor="var(--pf-accent-primary)" stopOpacity="0.85" />
        <stop offset="75%" stopColor="var(--pf-accent-secondary)" stopOpacity="0.35" />
        <stop offset="100%" stopColor="var(--pf-accent-secondary)" stopOpacity="0" />
      </radialGradient>

      {/* Halo exterior — respira, del accent-secondary */}
      <radialGradient id="pf-ai-halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--pf-accent-secondary)" stopOpacity="0.42" />
        <stop offset="55%" stopColor="var(--pf-accent-primary)" stopOpacity="0.12" />
        <stop offset="100%" stopColor="var(--pf-accent-primary)" stopOpacity="0" />
      </radialGradient>

      {/* Segundo halo (contrafase) — respira desfasado */}
      <radialGradient id="pf-ai-halo2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--pf-accent-primary)" stopOpacity="0.35" />
        <stop offset="70%" stopColor="var(--pf-accent-primary)" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Halo exterior — respiración principal */}
    <circle
      cx="16"
      cy="16"
      r="15"
      fill="url(#pf-ai-halo)"
      className="pf-ai-halo"
    />

    {/* Segundo halo — respiración desfasada */}
    <circle
      cx="16"
      cy="16"
      r="11"
      fill="url(#pf-ai-halo2)"
      className="pf-ai-halo2"
    />

    {/* Anillo hairline interior */}
    <circle
      cx="16"
      cy="16"
      r="8.5"
      fill="none"
      stroke="var(--pf-accent-primary)"
      strokeOpacity="0.30"
      strokeWidth="0.5"
      className="pf-ai-ring"
    />

    {/* Núcleo brillante — respiración orgánica */}
    <circle
      cx="16"
      cy="16"
      r="5.5"
      fill="url(#pf-ai-core)"
      className="pf-ai-core"
    />

    {/* Punto interior — el "ser" */}
    <circle
      cx="16"
      cy="16"
      r="1.8"
      fill="var(--pf-accent-primary)"
      opacity="0.9"
      className="pf-ai-soul"
    />
    <circle
      cx="16"
      cy="16"
      r="0.7"
      fill="#FFFFFF"
      opacity="0.95"
    />

    {/* Partículas orbitales lentísimas — dan sensación de presencia viva */}
    <circle
      cx="16"
      cy="3"
      r="0.55"
      fill="var(--pf-accent-secondary)"
      opacity="0.65"
      className="pf-ai-p1"
      style={{ transformOrigin: "16px 16px" }}
    />
    <circle
      cx="28"
      cy="16"
      r="0.45"
      fill="var(--pf-accent-primary)"
      opacity="0.55"
      className="pf-ai-p2"
      style={{ transformOrigin: "16px 16px" }}
    />
    <circle
      cx="16"
      cy="28"
      r="0.5"
      fill="var(--pf-accent-secondary)"
      opacity="0.6"
      className="pf-ai-p3"
      style={{ transformOrigin: "16px 16px" }}
    />

    <style>{`
      /* Halo principal — respira 4.2s */
      .pf-ai-halo {
        animation: pfAiHalo 4.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        transform-origin: 16px 16px;
      }
      /* Segundo halo — respira desfasado (contrafase) */
      .pf-ai-halo2 {
        animation: pfAiHalo2 5.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        transform-origin: 16px 16px;
      }
      /* Núcleo — respira 3.4s, más rápido */
      .pf-ai-core {
        animation: pfAiCore 3.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        transform-origin: 16px 16px;
      }
      /* Anillo — solo opacity, nunca escala */
      .pf-ai-ring {
        animation: pfAiRing 4.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }
      /* Alma — pulso muy sutil */
      .pf-ai-soul {
        animation: pfAiSoul 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        transform-origin: 16px 16px;
      }
      /* Partículas — órbitas lentísimas, nunca sincronizadas */
      .pf-ai-p1 {
        animation: pfAiSpin 22s linear infinite;
      }
      .pf-ai-p2 {
        animation: pfAiSpin 28s linear infinite reverse;
      }
      .pf-ai-p3 {
        animation: pfAiSpin 34s linear infinite;
      }

      @keyframes pfAiHalo {
        0%, 100% { transform: scale(1);     opacity: 0.85; }
        50%      { transform: scale(1.14);  opacity: 1; }
      }
      @keyframes pfAiHalo2 {
        0%, 100% { transform: scale(1.06);  opacity: 1; }
        50%      { transform: scale(0.94);  opacity: 0.75; }
      }
      @keyframes pfAiCore {
        0%, 100% { transform: scale(1);     opacity: 0.92; }
        50%      { transform: scale(1.08);  opacity: 1; }
      }
      @keyframes pfAiRing {
        0%, 100% { stroke-opacity: 0.22; }
        50%      { stroke-opacity: 0.48; }
      }
      @keyframes pfAiSoul {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.18); }
      }
      @keyframes pfAiSpin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .pf-ai-halo, .pf-ai-halo2, .pf-ai-core, .pf-ai-ring, .pf-ai-soul,
        .pf-ai-p1, .pf-ai-p2, .pf-ai-p3 {
          animation: none !important;
        }
      }
    `}</style>
  </svg>
);

export default React.memo(AssistantAvatar);
