// src/components/PathfinderLogo.tsx
//
// Logo de Pathfinder (cubo isométrico neón, PNG sin fondo).

import React from "react";

interface PathfinderLogoProps {
  /** Tamaño en px. Default: 40. */
  size?: number;
}

const PathfinderLogo: React.FC<PathfinderLogoProps> = ({ size = 40 }) => (
  <img
    src="/pathfinder-logo.png"
    alt="Pathfinder"
    width={size}
    height={size}
    draggable={false}
    style={{
      width: size,
      height: size,
      objectFit: "contain",
      display: "block",
      userSelect: "none",
      pointerEvents: "none",
      flexShrink: 0,
    }}
  />
);

export default PathfinderLogo;
