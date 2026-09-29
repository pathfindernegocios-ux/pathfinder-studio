// src/components/AuthBackdrop.tsx
//
// Nebulosa animada para el login/registro.
// 5 blobs (indigo, purple, blue, cyan, pink) con movimientos
// asimétricos y distintas duraciones para que se sienta "viva".
//
// Fondo negro puro. Se renderiza fijo detrás de todo el AuthScreen.

import React from "react";

const AuthBackdrop: React.FC = () => (
  <div className="pf-auth-backdrop" aria-hidden>
    <div className="pf-auth-blob pf-auth-blob-1" />
    <div className="pf-auth-blob pf-auth-blob-2" />
    <div className="pf-auth-blob pf-auth-blob-3" />
    <div className="pf-auth-blob pf-auth-blob-4" />
    <div className="pf-auth-blob pf-auth-blob-5" />
  </div>
);

export default AuthBackdrop;
