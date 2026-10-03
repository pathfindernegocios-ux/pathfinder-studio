// src/components/PathfinderSpinner.tsx
//
// Orbe nebular — spinner premium del botón Generar.
// Dos anillos contrarrotantes + núcleo pulsante. SVG puro, sin dependencias.
// Paleta indigo/purple alineada con la nebulosa del Studio.

import React from "react";

interface PathfinderSpinnerProps {
  /** Tamaño en px. Default: 20. */
  size?: number;
  className?: string;
  /** Si es true, muestra el orbe congelado (sin animación). */
  paused?: boolean;
}

const PathfinderSpinner: React.FC<PathfinderSpinnerProps> = ({
  size = 20,
  className,
  paused = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    className={`pf-spinner${paused ? " pf-spinner-paused" : ""}${className ? ` ${className}` : ""}`}
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="pf-spin-grad-a" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#67E8F9" stopOpacity="1" />
        <stop offset="55%" stopColor="#22D3EE" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="pf-spin-grad-b" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="pf-spin-core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
        <stop offset="45%" stopColor="#67E8F9" stopOpacity="1" />
        <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle
      className="pf-spinner-ring-outer"
      cx="20"
      cy="20"
      r="17"
      fill="none"
      stroke="url(#pf-spin-grad-a)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="80 27"
    />
    <circle
      className="pf-spinner-ring-inner"
      cx="20"
      cy="20"
      r="11"
      fill="none"
      stroke="url(#pf-spin-grad-b)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="50 19"
    />
    <circle
      className="pf-spinner-core"
      cx="20"
      cy="20"
      r="4"
      fill="url(#pf-spin-core)"
    />
  </svg>
);

export default React.memo(PathfinderSpinner);
