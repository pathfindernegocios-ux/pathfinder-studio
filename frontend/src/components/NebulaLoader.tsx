// src/components/NebulaLoader.tsx
//
// Nebulosa animada — 3 blobs cyan/purple/blue que se mueven lentamente
// sobre fondo negro. Se usa como estado "CREANDO..." en el Studio.
//
// Sin dependencias. CSS puro.

import React from "react";

interface NebulaLoaderProps {
  /** Texto opcional debajo del efecto. Default: "CREANDO...". */
  label?: string;
}

const NebulaLoader: React.FC<NebulaLoaderProps> = ({ label = "CREANDO..." }) => (
  <div className="pf-nebula-wrap">
    <div className="pf-nebula-blob pf-nebula-blob-1" />
    <div className="pf-nebula-blob pf-nebula-blob-2" />
    <div className="pf-nebula-blob pf-nebula-blob-3" />
    <div className="pf-nebula-grain" />
    <div className="pf-nebula-label">{label}</div>
  </div>
);

export default NebulaLoader;
