// src/components/NeonBackdrop.tsx
//
// Blobs de luz indigo/purple difusos sobre fondo negro puro.
// Se renderiza solo cuando el tema activo es "neon".
//
// Los valores están tomados del WelcomePage para asegurar
// continuidad visual Welcome → Studio.

import React from "react";
import { useTheme } from "../hooks/useTheme";

export const NeonBackdrop: React.FC = () => {
  const { resolved } = useTheme();

  if (resolved !== "neon") return null;

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "-20%",
          left: "-10%",
          width: "700px",
          height: "700px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          bottom: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </>
  );
};

export default NeonBackdrop;
