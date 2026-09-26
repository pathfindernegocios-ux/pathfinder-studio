import React from "react";
import { Ban } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const AccountSuspendedPage: React.FC = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--pf-bg-primary, #FFFFFF)",
        padding: "40px 20px",
        fontFamily: "var(--pf-font-ui, system-ui)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px", textAlign: "center" }}>
        <Ban size={48} strokeWidth={1.75} style={{ marginBottom: "16px", opacity: 0.6, color: "var(--pf-text-primary, #0A0A0A)" }} />
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            fontFamily: "var(--pf-font-display, system-ui)",
            color: "var(--pf-text-primary, #0A0A0A)",
            marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}
        >
          Tu cuenta está suspendida
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--pf-text-secondary, #525252)",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          Si crees que esto es un error, contáctanos a soporte para revisar tu caso.
        </p>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "14px",
            background: "transparent",
            color: "var(--pf-text-secondary, #525252)",
            border: "1px solid var(--pf-border-default, #E5E5E5)",
            borderRadius: "8px",
            fontSize: "0.9375rem",
            fontWeight: 500,
            fontFamily: "var(--pf-font-ui, system-ui)",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default AccountSuspendedPage;
