// src/pages/WhatIsPathfinderPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "../components/marketing/MarketingLayout";
import { useAuth } from "../hooks/useAuth";
import {
  Sparkles,
  Layers,
  Cloud,
  Power,
  Cpu,
  Palette,
  Monitor,
  Image as ImageIcon,
  Video as VideoIcon,
  AudioLines,
  CheckCircle2,
} from "lucide-react";

// ============================================================
// SECTION
// ============================================================
const Section: React.FC<{ children: React.ReactNode; bg?: string; border?: boolean }> = ({ children, bg, border }) => (
  <section
    style={{
      padding: "80px 24px",
      background: bg ?? "#000000",
      borderTop: border ? "1px solid rgba(139, 92, 246, 0.1)" : undefined,
    }}
  >
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>{children}</div>
  </section>
);

// ============================================================
// FEATURE CARD
// ============================================================
const FeatureCard: React.FC<{
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  body: string;
}> = ({ Icon, title, body }) => (
  <div
    style={{
      background: "rgba(139, 92, 246, 0.04)",
      border: "1px solid rgba(139, 92, 246, 0.15)",
      borderRadius: "16px",
      padding: "28px",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "44px",
        height: "44px",
        borderRadius: "12px",
        background: "rgba(34, 211, 238, 0.08)",
        border: "1px solid rgba(34, 211, 238, 0.25)",
        color: "#67E8F9",
        marginBottom: "16px",
        boxShadow: "0 0 20px -8px rgba(34, 211, 238, 0.5)",
      }}
    >
      <Icon size={20} strokeWidth={2} />
    </div>
    <h3
      style={{
        fontFamily: "var(--pf-font-display, system-ui)",
        fontSize: "1rem",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        margin: 0,
        marginBottom: "8px",
        color: "#FFFFFF",
      }}
    >
      {title}
    </h3>
    <p
      style={{
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "0.875rem",
        lineHeight: 1.55,
        color: "rgba(255,255,255,0.6)",
        margin: 0,
      }}
    >
      {body}
    </p>
  </div>
);

// ============================================================
// CAPABILITY CARD
// ============================================================
const CapabilityCard: React.FC<{
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  body: string;
  models: string;
}> = ({ Icon, title, body, models }) => (
  <div
    style={{
      background: "rgba(139, 92, 246, 0.04)",
      border: "1px solid rgba(139, 92, 246, 0.15)",
      borderRadius: "20px",
      padding: "36px 32px",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "56px",
        height: "56px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))",
        border: "1px solid rgba(139, 92, 246, 0.25)",
        color: "#A5B4FC",
        marginBottom: "24px",
        boxShadow: "0 0 24px -8px rgba(139, 92, 246, 0.5)",
      }}
    >
      <Icon size={26} strokeWidth={2} />
    </div>
    <h3
      style={{
        fontFamily: "var(--pf-font-display, system-ui)",
        fontSize: "1.5rem",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        margin: 0,
        marginBottom: "12px",
        color: "#FFFFFF",
      }}
    >
      {title}
    </h3>
    <p
      style={{
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "0.9375rem",
        lineHeight: 1.6,
        color: "rgba(255,255,255,0.65)",
        margin: 0,
        marginBottom: "20px",
        flex: 1,
      }}
    >
      {body}
    </p>
    <div
      style={{
        paddingTop: "16px",
        borderTop: "1px solid rgba(139, 92, 246, 0.15)",
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "0.8125rem",
        color: "rgba(255,255,255,0.45)",
        lineHeight: 1.5,
      }}
    >
      <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Modelos: </span>
      {models}
    </div>
  </div>
);

// ============================================================
// COMPARE TABLE — 3 columnas, Pathfinder destacada
// ============================================================
const CompareTable: React.FC<{
  rows: { label: string; a: string; b: string; c: string }[];
}> = ({ rows }) => (
  <div
    style={{
      overflowX: "auto",
      border: "1px solid rgba(139, 92, 246, 0.18)",
      borderRadius: "16px",
      background: "rgba(139, 92, 246, 0.03)",
    }}
  >
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "0.875rem",
        minWidth: "720px",
      }}
    >
      <thead>
        <tr>
          <th style={{ width: "16%", padding: "18px 20px", textAlign: "left", borderBottom: "1px solid rgba(139, 92, 246, 0.15)" }}></th>
          <th style={{ padding: "18px 20px", textAlign: "left", borderBottom: "1px solid rgba(139, 92, 246, 0.15)", fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>Plataformas de créditos</th>
          <th style={{ padding: "18px 20px", textAlign: "left", borderBottom: "1px solid rgba(139, 92, 246, 0.15)", fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>ComfyUI o GPU alquilada</th>
          <th style={{ padding: "18px 20px", textAlign: "left", borderBottom: "2px solid #22D3EE", fontWeight: 700, color: "#67E8F9", background: "rgba(34, 211, 238, 0.05)" }}>Pathfinder</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td style={{ padding: "16px 20px", borderBottom: i < rows.length - 1 ? "1px solid rgba(139, 92, 246, 0.1)" : "none", fontWeight: 600, color: "#FFFFFF" }}>{r.label}</td>
            <td style={{ padding: "16px 20px", borderBottom: i < rows.length - 1 ? "1px solid rgba(139, 92, 246, 0.1)" : "none", color: "rgba(255,255,255,0.55)" }}>{r.a}</td>
            <td style={{ padding: "16px 20px", borderBottom: i < rows.length - 1 ? "1px solid rgba(139, 92, 246, 0.1)" : "none", color: "rgba(255,255,255,0.55)" }}>{r.b}</td>
            <td style={{ padding: "16px 20px", borderBottom: i < rows.length - 1 ? "1px solid rgba(139, 92, 246, 0.1)" : "none", color: "#FFFFFF", fontWeight: 500, background: "rgba(34, 211, 238, 0.04)" }}>{r.c}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ============================================================
// HIGHLIGHT CARD
// ============================================================
const HighlightCard: React.FC<{
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  body: string;
}> = ({ Icon, title, body }) => (
  <div
    style={{
      display: "flex",
      gap: "24px",
      alignItems: "flex-start",
      background: "rgba(34, 211, 238, 0.04)",
      border: "1px solid rgba(34, 211, 238, 0.2)",
      borderRadius: "20px",
      padding: "32px",
      marginTop: "32px",
      boxShadow: "0 0 40px -20px rgba(34, 211, 238, 0.4)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "56px",
        height: "56px",
        borderRadius: "16px",
        background: "rgba(34, 211, 238, 0.12)",
        border: "1px solid rgba(34, 211, 238, 0.3)",
        color: "#67E8F9",
        flexShrink: 0,
        boxShadow: "0 0 24px -8px rgba(34, 211, 238, 0.6)",
      }}
    >
      <Icon size={26} strokeWidth={2} />
    </div>
    <div style={{ flex: 1 }}>
      <h3
        style={{
          fontFamily: "var(--pf-font-display, system-ui)",
          fontSize: "1.25rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          margin: 0,
          marginBottom: "10px",
          color: "#FFFFFF",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "var(--pf-font-ui, system-ui)",
          fontSize: "0.9375rem",
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.65)",
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  </div>
);

// ============================================================
// PAGE
// ============================================================
const WhatIsPathfinderPage: React.FC = () => {
  const { session } = useAuth();

  const tableRows = [
    { label: "Cobro", a: "Créditos por generación", b: "Pago por hora de GPU", c: "Acceso mensual fijo" },
    { label: "Cómputo", a: "Compartido", b: "Tuyo, con setup manual", c: "Dedicado durante tu sesión" },
    { label: "Tu equipo", a: "Nada especial", b: "GPU propia o alquiler", c: "Cualquier PC con internet" },
    { label: "Setup", a: "Inmediato", b: "Alto: CUDA, nodos, LoRAs", c: "Workflow listo para activar" },
    { label: "Persistencia", a: "En la plataforma", b: "Manual, en tu disco", c: "En la nube, desde cualquier dispositivo" },
  ];

  const whatYouCanDo = [
    {
      Icon: ImageIcon,
      title: "Imagen",
      body: "Genera ilustraciones desde una descripción, edita fotos con referencias, crea variaciones de un mismo concepto.",
      models: "Krea 2 Turbo, Flux 2 Klein 4B",
    },
    {
      Icon: VideoIcon,
      title: "Video",
      body: "Crea videos desde texto, anima una imagen, genera escenas con audio sincronizado y lipsync.",
      models: "LTX 2.3, LTX 2.5 MSR, Wan 2.1 (i2v + t2v)",
    },
    {
      Icon: AudioLines,
      title: "Audio",
      body: "Genera voces sintéticas, clona una voz desde un audio de referencia, narra textos largos.",
      models: "OmniVoice, Index TTS",
    },
  ];

  const whatItSolves = [
    "Estación dedicada bajo demanda. Tu cómputo responde solo a ti mientras trabajas.",
    "Workflows listos para activar. Descargas, conectas y vuelves al Studio a crear.",
    "Sin créditos por generación. Pagas por acceso, no por cada imagen o video.",
  ];

  const steps = [
    { n: "01", title: "Elige tu modelo", body: "Imagen, video o audio. Cada modelo viene con su workflow ya preparado." },
    { n: "02", title: "Activa tu estación", body: "Descarga el workflow desde Pathfinder, ábrelo en Kaggle y actívalo. Kaggle es gratuito y solo necesitas una cuenta — sin pagar, sin tarjeta. Cuando esté listo, vuelves a Pathfinder Studio y generas desde ahí. La primera vez tarda unos minutos; después, cada sesión arranca más rápido." },
    { n: "03", title: "Crea y descarga", body: "Ya de vuelta en Pathfinder Studio, escribe tu prompt, ajusta los parámetros que quieras y genera. Tus resultados quedan en Mis Creaciones, listos para descargar cuando quieras." },
  ];

  return (
    <MarketingLayout>
      {/* HERO */}
      <section style={{ padding: "80px 24px 40px", textAlign: "center", background: "#000000" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.25)", borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.75rem", fontWeight: 600, color: "#C4B5FD", marginBottom: "24px" }}>
            Qué es Pathfinder
          </div>
          <h1 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, margin: 0, marginBottom: "20px", color: "#FFFFFF" }}>
            Tu estación creativa de IA
          </h1>
          <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1.0625rem", lineHeight: 1.6, color: "rgba(255,255,255,0.65)", margin: 0, marginBottom: "32px" }}>
            Una estación con workflows curados para imagen, video y audio. Eliges tu modelo, activas tu estación y creas sin créditos por generación.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to={session ? "/studio" : "/auth"} style={{ textDecoration: "none", padding: "14px 32px", background: "#FFFFFF", color: "#0A0A0A", borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.9375rem", fontWeight: 700, display: "inline-block" }}>
              {session ? "Ir al Studio" : "Empezar gratis"}
            </Link>
            <Link to="/pricing" style={{ textDecoration: "none", padding: "14px 32px", background: "transparent", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.9375rem", fontWeight: 600, display: "inline-block" }}>
              Ver planes
            </Link>
          </div>
        </div>
      </section>

      {/* QUÉ ES PATHFINDER */}
      <Section>
        <div style={{ maxWidth: "780px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, marginBottom: "20px", color: "#FFFFFF" }}>
            ¿Qué es Pathfinder?
          </h2>
          <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1.125rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: 0 }}>
            Pathfinder es una plataforma para crear imágenes, videos y audio con inteligencia artificial. Eliges el modelo, describes lo que quieres y generas desde tu navegador. Cada sesión corre en una estación dedicada que activas cuando la necesitas, con workflows ya preparados y sin créditos por generación.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginTop: "48px", maxWidth: "900px", margin: "48px auto 0" }}>
          {whatItSolves.map((text, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <CheckCircle2 size={20} strokeWidth={2.2} style={{ color: "#67E8F9", flexShrink: 0, marginTop: "2px" }} />
              <span style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.9375rem", lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* QUÉ PUEDES HACER */}
      <Section bg="#050505" border>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, marginBottom: "12px", color: "#FFFFFF" }}>
            ¿Qué puedes hacer en Pathfinder?
          </h2>
          <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1rem", color: "rgba(255,255,255,0.6)", maxWidth: "520px", margin: "0 auto" }}>
            Tres tipos de contenido, un mismo lugar.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {whatYouCanDo.map((c, i) => (
            <CapabilityCard key={i} Icon={c.Icon} title={c.title} body={c.body} models={c.models} />
          ))}
        </div>
      </Section>

      {/* QUÉ SOLUCIONA */}
      <section style={{ padding: "100px 24px", background: "#000000", color: "#FFFFFF", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, marginBottom: "24px", color: "#FFFFFF" }}>
            ¿Qué soluciona Pathfinder?
          </h2>
          <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1.125rem", lineHeight: 1.7, color: "rgba(255,255,255,0.85)", margin: 0 }}>
            Crear con IA de calidad solía requerir dos caminos: pagar créditos caros en plataformas cerradas, o montar tu propio entorno técnico con una GPU costosa. Pathfinder ofrece un tercer camino: acceso a modelos curados, workflows listos y cómputo dedicado, desde cualquier computadora.
          </p>
        </div>
      </section>

      {/* CÓMO SE COMPARA */}
      <Section border>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, marginBottom: "12px", color: "#FFFFFF" }}>
            Cómo se compara Pathfinder
          </h2>
          <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1rem", color: "rgba(255,255,255,0.6)", maxWidth: "520px", margin: "0 auto" }}>
            Tres formas de crear con IA. Tres modelos distintos.
          </p>
        </div>

        <CompareTable rows={tableRows} />

        <HighlightCard
          Icon={Monitor}
          title="No necesitas una computadora potente"
          body="Tu estación corre sobre Kaggle, una plataforma gratuita de cómputo. Tú trabajas siempre desde Pathfinder Studio, en tu navegador. Cualquier computadora con acceso a internet funciona — sin comprar hardware, sin configurar drivers, sin pagar por cómputo."
        />

        <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.9375rem", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", maxWidth: "720px", margin: "32px auto 0", textAlign: "center" }}>
          Si ya usas ComfyUI, Pathfinder se siente familiar. Si vienes de plataformas de créditos, el modelo es distinto: aquí pagas por acceso, no por generación.
        </p>
      </Section>

      {/* QUÉ INCLUYE */}
      <Section bg="#050505" border>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, marginBottom: "12px", color: "#FFFFFF" }}>
            Qué incluye tu estación
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          <FeatureCard Icon={Palette} title="Seis modelos curados" body="Krea 2 Turbo, Flux 2 Klein 4B, LTX 2.3, LTX 2.5 MSR, Wan 2.1 Dual y TTS Dual. Cada uno con su workflow listo para usar." />
          <FeatureCard Icon={Layers} title="Workers duales" body="Wan i2v + t2v en un mismo notebook. OmniVoice + Index TTS en otro. Cambia entre tareas sin reiniciar la estación." />
          <FeatureCard Icon={Sparkles} title="Sin créditos por generación" body="Dentro de tus horas de estación, generas lo que quieras. Sin tokens, sin unidades, sin sorpresas al final del mes." />
          <FeatureCard Icon={Cpu} title="Selección automática de modelo" body="El Studio detecta qué modelo está activo en tu estación y lo selecciona solo. Sin configuración manual." />
          <FeatureCard Icon={Cloud} title="Persistencia en la nube" body="Tus creaciones se guardan y quedan accesibles desde cualquier dispositivo, no solo desde el navegador donde generaste." />
          <FeatureCard Icon={Power} title="Apagado automático por inactividad" body="Si no generas nada durante una hora, la estación se apaga sola para no consumir tus horas." />
        </div>
      </Section>

      {/* CÓMO SE USA */}
      <Section>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, marginBottom: "12px", color: "#FFFFFF" }}>
            Cómo se usa
          </h2>
          <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1rem", color: "rgba(255,255,255,0.6)", maxWidth: "620px", margin: "0 auto" }}>
            De la idea al resultado en tres pasos. La primera vez incluye preparar tu estación; después, cada sesión arranca en segundos.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "28px" }}>
          {steps.map((s) => (
            <div key={s.n}>
              <div style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "2rem", fontWeight: 800, color: "#67E8F9", letterSpacing: "-0.04em", marginBottom: "12px", textShadow: "0 0 24px rgba(34, 211, 238, 0.45)" }}>
                {s.n}
              </div>
              <h3 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0, marginBottom: "8px", color: "#FFFFFF" }}>
                {s.title}
              </h3>
              <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.875rem", lineHeight: 1.55, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link to="/how-it-works" style={{ textDecoration: "none", display: "inline-block", padding: "12px 28px", background: "transparent", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "0.875rem", fontWeight: 600 }}>
            Ver la guía paso a paso
          </Link>
        </div>
      </Section>

      {/* CTA FINAL */}
      <section style={{ padding: "100px 24px", background: "#000000", color: "#FFFFFF", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--pf-font-display, system-ui)", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.03em", margin: 0, marginBottom: "16px", color: "#FFFFFF" }}>
            Empieza gratis hoy
          </h2>
          <p style={{ fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1rem", color: "rgba(255,255,255,0.7)", marginBottom: "32px", lineHeight: 1.6 }}>
            Plan Free con 3 modelos, sin tarjeta y sin fecha de vencimiento. Cuando quieras el Estudio completo, Creator o Founder están a un clic.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to={session ? "/studio" : "/auth"} style={{ textDecoration: "none", display: "inline-block", padding: "16px 40px", background: "#FFFFFF", color: "#0A0A0A", borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1rem", fontWeight: 700 }}>
              {session ? "Ir al Studio" : "Empezar gratis"}
            </Link>
            <Link to="/pricing" style={{ textDecoration: "none", display: "inline-block", padding: "16px 40px", background: "transparent", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "9999px", fontFamily: "var(--pf-font-ui, system-ui)", fontSize: "1rem", fontWeight: 600 }}>
              Ver planes
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default WhatIsPathfinderPage;
