// src/components/AssistantAvatar.tsx
//
// Colisión de estrellas de neutrones con ondas gravitacionales.
// Se renderiza dentro de un contenedor circular con fondo espacial.
//
// Ciclo 3s:
//   0-40%   → dos núcleos cyan orbitan y se acercan
//   40-55%  → colisión (flash cyan brillante)
//   55-100% → ondas gravitacionales expandiéndose + eyección

import React from "react";

interface AssistantAvatarProps {
  /** Tamaño del SVG en px. Default: 30 (para llenar el círculo). */
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
      <radialGradient id="pf-ns-flash-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
        <stop offset="35%" stopColor="#67E8F9" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="pf-ns-core-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
        <stop offset="45%" stopColor="#A5F3FC" stopOpacity="1" />
        <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Mini estrellas de fondo */}
    <circle cx="5" cy="6" r="0.35" fill="#A5F3FC" opacity="0.7" />
    <circle cx="27" cy="5" r="0.3" fill="#A5F3FC" opacity="0.5" />
    <circle cx="28" cy="26" r="0.35" fill="#A5F3FC" opacity="0.6" />
    <circle cx="4" cy="27" r="0.3" fill="#A5F3FC" opacity="0.5" />
    <circle cx="14" cy="3" r="0.25" fill="#A5F3FC" opacity="0.6" />
    <circle cx="22" cy="29" r="0.3" fill="#A5F3FC" opacity="0.5" />

    {/* Ondas gravitacionales — 4 anillos escalonados */}
    <circle cx="16" cy="16" r="3" fill="none" stroke="#22D3EE" strokeWidth="0.7" className="pf-ns-wave" style={{ animationDelay: "0s" }} />
    <circle cx="16" cy="16" r="3" fill="none" stroke="#67E8F9" strokeWidth="0.7" className="pf-ns-wave" style={{ animationDelay: "0.3s" }} />
    <circle cx="16" cy="16" r="3" fill="none" stroke="#22D3EE" strokeWidth="0.7" className="pf-ns-wave" style={{ animationDelay: "0.6s" }} />
    <circle cx="16" cy="16" r="3" fill="none" stroke="#67E8F9" strokeWidth="0.7" className="pf-ns-wave" style={{ animationDelay: "0.9s" }} />

    {/* Flash de colisión */}
    <circle
      cx="16"
      cy="16"
      r="5"
      fill="url(#pf-ns-flash-grad)"
      className="pf-ns-flash"
    />

    {/* Partículas eyectadas — 6 direcciones */}
    {[0, 60, 120, 180, 240, 300].map((angle) => (
      <g key={angle} transform={`rotate(${angle} 16 16)`}>
        <circle cx="16" cy="16" r="0.6" fill="#A5F3FC" className="pf-ns-eject" />
      </g>
    ))}

    {/* Estrella A — órbita horaria + acercamiento */}
    <g className="pf-ns-orbit-a">
      <g className="pf-ns-approach-a">
        <circle cx="24" cy="16" r="4" fill="url(#pf-ns-core-grad)" opacity="0.7" />
        <circle
          cx="24"
          cy="16"
          r="2.2"
          fill="#A5F3FC"
          style={{ filter: "drop-shadow(0 0 2px #67E8F9) drop-shadow(0 0 5px #22D3EE)" }}
        />
      </g>
    </g>

    {/* Estrella B — órbita antihoraria + acercamiento */}
    <g className="pf-ns-orbit-b">
      <g className="pf-ns-approach-b">
        <circle cx="8" cy="16" r="4" fill="url(#pf-ns-core-grad)" opacity="0.7" />
        <circle
          cx="8"
          cy="16"
          r="2.2"
          fill="#A5F3FC"
          style={{ filter: "drop-shadow(0 0 2px #67E8F9) drop-shadow(0 0 5px #22D3EE)" }}
        />
      </g>
    </g>
  </svg>
);

export default React.memo(AssistantAvatar);
