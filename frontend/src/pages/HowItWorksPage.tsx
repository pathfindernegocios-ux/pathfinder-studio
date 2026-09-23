// src/pages/HowItWorksPage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, CheckCircle2, AlertCircle, Lightbulb, Video, Image as ImageIcon, HelpCircle } from "lucide-react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";

// ---------------------------------------------------------------------------
// MEDIA URLs — vos agregás las URLs acá cuando subas los videos a Supabase
// Storage. Mientras esté vacío (""), se muestra un placeholder.
//
// Formato esperado:
//   "https://sxvgldvnxwjtvqownayr.supabase.co/storage/v1/object/public/how-it-works-media/nombre.mp4"
// ---------------------------------------------------------------------------
const MEDIA_URLS = {
  block2_verify:    "", // Video/captura: verificación de identidad en Kaggle
  block3_download:  "", // Video: descargar notebook desde Mi Estación
  block4_import:    "", // Video: import notebook en Kaggle
  block4_gpu:       "", // Captura: configurar GPU T4 x2 + Internet
  block5_run_all:   "", // Video: Run All hasta "Estación lista"
  block6_detection: "", // Captura: badge verde en Studio
  block7_shutdown:  "", // Video: Stop Session
};

// ---------------------------------------------------------------------------
// MediaPlaceholder — fallback hasta que el usuario suba el video
// ---------------------------------------------------------------------------
const MediaPlaceholder: React.FC<{
  type: "video" | "image";
  label: string;
  url?: string;
}> = ({ type, label, url }) => {
  if (url && url.length > 0) {
    return (
      <div style={{ borderRadius: "12px", overflow: "hidden", margin: "24px 0", background: "var(--pf-text-primary)" }}>
        {type === "video" ? (
          <video
            src={url}
            controls
            preload="metadata"
            style={{ width: "100%", display: "block" }}
          />
        ) : (
          <img src={url} alt={label} style={{ width: "100%", display: "block" }} />
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        aspectRatio: type === "video" ? "16 / 9" : "4 / 3",
        background: "linear-gradient(135deg, #FAFAFA 0%, #F4F4F5 100%)",
        border: "2px dashed var(--pf-border-default, #E5E5E5)",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        margin: "24px 0",
        color: "var(--pf-text-muted, #A1A1AA)",
        fontFamily: "var(--pf-font-ui, system-ui)",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      {type === "video" ? <Video size={36} /> : <ImageIcon size={36} />}
      <div style={{ fontSize: "0.9375rem", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Disponible próximamente
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Block — contenedor de bloque numerado
// ---------------------------------------------------------------------------
const Block: React.FC<{
  num: string;
  title: string;
  children: React.ReactNode;
}> = ({ num, title, children }) => (
  <section
    style={{
      scrollMarginTop: "100px",
      paddingTop: "40px",
      paddingBottom: "40px",
      borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
    }}
  >
    <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "20px" }}>
      <span
        style={{
          fontFamily: "var(--pf-font-display, system-ui)",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--pf-text-muted, #A1A1AA)",
          letterSpacing: "-0.04em",
        }}
      >
        {num}
      </span>
      <h2
        style={{
          fontFamily: "var(--pf-font-display, system-ui)",
          fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--pf-text-primary, #0A0A0A)",
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
    <div
      style={{
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "1rem",
        lineHeight: 1.7,
        color: "var(--pf-text-secondary, #525252)",
      }}
    >
      {children}
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// Callout — nota / tip / alerta
// ---------------------------------------------------------------------------
const Callout: React.FC<{
  kind: "tip" | "info" | "warn";
  children: React.ReactNode;
}> = ({ kind, children }) => {
  const config = {
    tip:  { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)", color: "#059669", Icon: Lightbulb },
    info: { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.3)", color: "#4F46E5", Icon: AlertCircle },
    warn: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", color: "#B45309", Icon: AlertCircle },
  }[kind];

  return (
    <div
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: "12px",
        padding: "16px 20px",
        margin: "20px 0",
        display: "flex",
        gap: "12px",
        color: config.color,
        fontFamily: "var(--pf-font-ui, system-ui)",
        fontSize: "0.9375rem",
        lineHeight: 1.6,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: "2px" }}>
        <config.Icon size={18} />
      </span>
      <div>{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step — paso numerado
// ---------------------------------------------------------------------------
const Step: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "flex",
      gap: "12px",
      alignItems: "flex-start",
      marginBottom: "12px",
    }}
  >
    <CheckCircle2
      size={18}
      style={{ color: "#10B981", flexShrink: 0, marginTop: "4px" }}
    />
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

// ---------------------------------------------------------------------------
// HowItWorksContent — contenido sin wrapper de layout
// Se usa tanto desde MarketingLayout (anon) como desde SidebarShell (logueado)
// ---------------------------------------------------------------------------
export const HowItWorksContent: React.FC = () => {
  const { session, profile } = useAuth();
  const [isMarking, setIsMarking] = useState(false);

  const hasViewedBefore = !!profile?.how_it_works_viewed_at;

  const handleComplete = async () => {
    if (!session?.user?.id) {
      window.location.href = "/auth";
      return;
    }
    setIsMarking(true);
    try {
      await supabase
        .from("profiles")
        .update({ how_it_works_viewed_at: new Date().toISOString() })
        .eq("id", session.user.id);
    } catch (e) {
      console.error("[HowItWorks] failed to mark as viewed:", e);
    }
    window.location.href = "/studio";
  };

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", padding: "60px 24px 120px" }}>
        {/* ==================== HERO ==================== */}
        <div style={{ marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "9999px",
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#4F46E5",
              marginBottom: "20px",
            }}
          >
            Guía de inicio
          </div>

          <h1
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "var(--pf-text-primary, #0A0A0A)",
              margin: 0,
              marginBottom: "20px",
            }}
          >
            Cómo funciona Pathfinder
          </h1>

          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1.125rem",
              lineHeight: 1.6,
              color: "var(--pf-text-secondary, #525252)",
              maxWidth: "620px",
              margin: 0,
            }}
          >
            Pathfinder no ejecuta los modelos en nuestros servidores. Cada vez que quieras crear,
            vas a encender tu propia estación de cómputo — una sesión en Kaggle que corre el modelo
            por vos. Es un paso simple que vas a repetir como parte de tu flujo de trabajo.
          </p>
        </div>

        {/* ==================== VISTA GENERAL ==================== */}
        <div
          style={{
            background: "var(--pf-bg-secondary, #FAFAFA)",
            border: "1px solid var(--pf-border-subtle, #F4F4F5)",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "48px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "1.125rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--pf-text-primary, #0A0A0A)",
              margin: 0,
              marginBottom: "24px",
            }}
          >
            En 3 pasos
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
            }}
          >
            {[
              { n: "1", t: "Crea tu cuenta en Kaggle", d: "Una sola vez. Es gratis." },
              { n: "2", t: "Descarga y ejecuta tu notebook", d: "Cada vez que quieras usar un modelo." },
              { n: "3", t: "Genera desde Pathfinder", d: "El Studio detecta tu estación y te deja crear." },
            ].map((s) => (
              <div key={s.n}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--pf-text-primary, #0A0A0A)",
                    color: "var(--pf-text-inverse, #FFFFFF)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    marginBottom: "12px",
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-display, system-ui)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--pf-text-primary, #0A0A0A)",
                    marginBottom: "4px",
                  }}
                >
                  {s.t}
                </div>
                <div
                  style={{
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.8125rem",
                    color: "var(--pf-text-muted, #A1A1AA)",
                    lineHeight: 1.5,
                  }}
                >
                  {s.d}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ==================== BLOQUE 1 ==================== */}
        <Block num="01" title="Crea tu cuenta en Kaggle">
          <p style={{ marginBottom: "20px" }}>
            Kaggle es una plataforma gratuita de Google que te da acceso a GPUs NVIDIA T4. Es donde
            van a correr los modelos de Pathfinder. Necesitás una cuenta para empezar.
          </p>

          <Step>
            Abre{" "}
            <a
              href="https://www.kaggle.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--pf-text-primary, #0A0A0A)", fontWeight: 600, textDecoration: "underline" }}
            >
              kaggle.com <ExternalLink size={12} style={{ display: "inline", marginLeft: "4px" }} />
            </a>{" "}
            y haz clic en <strong>Sign In</strong> o <strong>Register</strong>.
          </Step>
          <Step>
            Puedes registrarte con tu cuenta de Google o con un correo electrónico. Cualquiera de las dos
            opciones funciona.
          </Step>
          <Step>
            Una vez dentro, verifica que tu cuenta esté activa. Ya tienes todo listo para el siguiente
            paso.
          </Step>

          <Callout kind="info">
            Si ya tienes una cuenta de Kaggle, puedes saltar directamente al Bloque 2.
          </Callout>
        </Block>

        {/* ==================== BLOQUE 2 ==================== */}
        <Block num="02" title="Verifica tu identidad">
          <p style={{ marginBottom: "20px" }}>
            Kaggle requiere verificar tu identidad con un número de teléfono antes de darte acceso a
            GPUs. Sin este paso, no vas a poder ejecutar los modelos.
          </p>

          <Step>Entra a tu cuenta de Kaggle → <strong>Settings</strong>.</Step>
          <Step>
            Busca la sección <strong>Phone Verification</strong>.
          </Step>
          <Step>
            Ingresa tu número de teléfono. Recibirás un código por SMS que deberás confirmar.
          </Step>
          <Step>
            Una vez verificado, aparecerá un check verde junto a tu nombre. Listo.
          </Step>

          <MediaPlaceholder
            type="video"
            label="Cómo verificar tu identidad en Kaggle"
            url={MEDIA_URLS.block2_verify}
          />

          <Callout kind="warn">
            Sin la verificación por SMS, Kaggle no te permite usar GPUs. Este paso es obligatorio
            y se hace una sola vez.
          </Callout>
        </Block>

        {/* ==================== BLOQUE 3 ==================== */}
        <Block num="03" title="Descarga tu notebook desde Pathfinder">
          <p style={{ marginBottom: "20px" }}>
            El <strong>notebook</strong> es el archivo que le dice a Kaggle qué modelo cargar y cómo
            preparar tu estación. Cada modelo tiene el suyo. Los descargas desde Pathfinder.
          </p>

          <Step>
            En Pathfinder, ve a <strong>Mi Estación</strong> desde el menú lateral.
          </Step>
          <Step>
            Verás una tarjeta por cada modelo (Krea, Flux, LTX). Elige el que quieras usar.
          </Step>
          <Step>
            Haz clic en <strong>Descargar notebook</strong>. Se descargará un archivo{" "}
            <code
              style={{
                background: "var(--pf-bg-secondary, #FAFAFA)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "0.875em",
              }}
            >
              .ipynb
            </code>{" "}
            a tu computadora.
          </Step>
          <Step>
            Guarda el archivo en una carpeta que puedas encontrar después. Lo vas a usar en el
            siguiente paso.
          </Step>

          <MediaPlaceholder
            type="video"
            label="Cómo descargar tu notebook desde Mi Estación"
            url={MEDIA_URLS.block3_download}
          />

          <Callout kind="tip">
            Puedes descargar los 3 notebooks y guardarlos. Así los tienes a mano cuando quieras
            cambiar de modelo.
          </Callout>
        </Block>

        {/* ==================== BLOQUE 4 ==================== */}
        <Block num="04" title="Carga el notebook en Kaggle">
          <p style={{ marginBottom: "20px" }}>
            Ahora subes el notebook a Kaggle y configuras el entorno de cómputo.
          </p>

          <Step>
            En Kaggle, haz clic en <strong>Create (+)</strong> arriba a la izquierda y elige{" "}
            <strong>Notebook</strong>.
          </Step>
          <Step>
            Una vez abierto el notebook vacío, ve a <strong>File</strong> →{" "}
            <strong>Import Notebook</strong>.
          </Step>
          <Step>
            Arrastra o selecciona el archivo{" "}
            <code
              style={{
                background: "var(--pf-bg-secondary, #FAFAFA)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "0.875em",
              }}
            >
              .ipynb
            </code>{" "}
            que descargaste de Pathfinder. Haz clic en <strong>Import</strong>.
          </Step>
          <Step>
            En el panel derecho, sección <strong>Session options</strong>:
            <ul style={{ marginTop: "8px", marginBottom: "0", paddingLeft: "20px" }}>
              <li>
                <strong>Accelerator</strong> → selecciona <strong>GPU T4 x2</strong>
              </li>
              <li>
                <strong>Internet</strong> → actívalo (ON)
              </li>
            </ul>
          </Step>

          <MediaPlaceholder
            type="video"
            label="Cómo importar el notebook y configurar la GPU"
            url={MEDIA_URLS.block4_import}
          />

          <Callout kind="warn">
            Sin <strong>GPU T4 x2</strong> activado, el notebook no va a funcionar. Sin{" "}
            <strong>Internet</strong>, no puede descargar los modelos.
          </Callout>
        </Block>

        {/* ==================== BLOQUE 5 ==================== */}
        <Block num="05" title="Ejecuta Run All">
          <p style={{ marginBottom: "20px" }}>
            Este es el paso donde tu estación de trabajo se enciende. Vas a ver muchas líneas de
            texto pasar — todo es normal, no hay que tocar nada.
          </p>

          <Step>
            En el notebook, haz clic en <strong>▶ Run All</strong> (arriba, junto a "Save Version").
          </Step>
          <Step>
            El notebook va a instalar dependencias y descargar el modelo. Verás mucho texto,
            barras de progreso y mensajes. <strong>No cierres la pestaña.</strong>
          </Step>
          <Step>
            Espera a que termine. Los tiempos dependen del modelo:
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              {[
                { m: "Krea 2 Turbo", t: "~7 min" },
                { m: "Flux 2 Klein 4B", t: "~9-10 min" },
                { m: "LTX 2.3", t: "~10 min" },
              ].map((x) => (
                <div
                  key={x.m}
                  style={{
                    background: "var(--pf-bg-secondary, #FAFAFA)",
                    border: "1px solid var(--pf-border-subtle, #F4F4F5)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--pf-text-primary, #0A0A0A)",
                      marginBottom: "2px",
                    }}
                  >
                    {x.m}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--pf-text-muted, #A1A1AA)" }}>
                    {x.t}
                  </div>
                </div>
              ))}
            </div>
          </Step>
          <Step>
            Cuando termine, verás el mensaje <strong>"Estación lista"</strong> en la última celda
            del notebook. Eso significa que ya podés generar desde Pathfinder.
          </Step>

          <MediaPlaceholder
            type="video"
            label="Run All hasta ver Estación lista"
            url={MEDIA_URLS.block5_run_all}
          />

          <Callout kind="info">
            <strong>¿Qué pasa si Run All se pausa?</strong> A veces Kaggle detiene la ejecución antes
            de terminar. Si tras 15 minutos no ves "Estación lista", simplemente vuelve a dar{" "}
            <strong>Run All</strong>. Kaggle continúa desde donde quedó.
          </Callout>
        </Block>

        {/* ==================== BLOQUE 6 ==================== */}
        <Block num="06" title="Pathfinder detecta tu estación">
          <p style={{ marginBottom: "20px" }}>
            Aquí viene la parte mágica. Una vez que el notebook termina de cargar, Pathfinder lo
            detecta automáticamente.
          </p>

          <Step>
            Vuelve a la pestaña de Pathfinder → <strong>Studio</strong>.
          </Step>
          <Step>
            En la esquina superior derecha vas a ver el badge <strong>"● Estación lista"</strong>{" "}
            en verde (antes decía "Estación offline").
          </Step>
          <Step>
            El <strong>Floating Command Center</strong> (el panel de generación abajo) va a
            seleccionar automáticamente el modelo que cargaste.
          </Step>
          <Step>
            El banner naranja que decía "Tu estación está offline" desaparece. Ya puedes generar.
          </Step>
          <Step>
            Escribe un prompt, ajusta los parámetros si quieres, y haz clic en{" "}
            <strong>Generar</strong>.
          </Step>

          <MediaPlaceholder
            type="image"
            label="Badge verde + selector automático de modelo"
            url={MEDIA_URLS.block6_detection}
          />

          <Callout kind="tip">
            Si cargas el notebook de Krea y después el de LTX, Pathfinder cambia automáticamente el
            selector. Podés tener varios modelos encendidos al mismo tiempo (aunque consumen más
            recursos de Kaggle).
          </Callout>
        </Block>

        {/* ==================== BLOQUE 7 ==================== */}
        <Block num="07" title="Al terminar: descarga y apaga">
          <p style={{ marginBottom: "20px" }}>
            Cuando termines tu sesión de trabajo, hay dos cosas importantes que hacer.
          </p>

          <Step>
            <strong>Descarga tus creaciones.</strong> Las imágenes, videos y audios que generaste
            los vas a encontrar en{" "}
            <Link
              to="/creations"
              style={{ color: "var(--pf-text-primary, #0A0A0A)", fontWeight: 600, textDecoration: "underline" }}
            >
              Mis Creaciones
            </Link>
            . Descargalas antes de cerrar Kaggle.
          </Step>
          <Step>
            <strong>Detén la sesión de Kaggle.</strong> En la pestaña del notebook, haz clic en el
            menú de los <strong>tres puntos (⋮)</strong> arriba a la derecha →{" "}
            <strong>Stop Session</strong>.
          </Step>
          <Step>
            Si aparece la opción <strong>Disconnect and Delete Runtime</strong>, puedes elegirla.
            Ambas liberan los recursos correctamente.
          </Step>

          <MediaPlaceholder
            type="video"
            label="Descargar creaciones + Stop Session en Kaggle"
            url={MEDIA_URLS.block7_shutdown}
          />

          <Callout kind="warn">
            Kaggle borra todos los archivos temporales al cerrar la sesión. Si no descargas tus
            creaciones desde Pathfinder antes de apagar, se pierden. Pathfinder guarda tus
            creaciones por 7 días, pero solo si las has guardado explícitamente.
          </Callout>

          <Callout kind="tip">
            La próxima vez que quieras crear, no necesitas volver a crear cuenta ni importar el
            notebook. Solo ábrelo de nuevo en Kaggle (queda guardado en tu cuenta) y dale{" "}
            <strong>Run All</strong>.
          </Callout>
        </Block>

        {/* ==================== FAQ ==================== */}
        <section
          style={{
            paddingTop: "60px",
            borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "1.75rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--pf-text-primary, #0A0A0A)",
              marginBottom: "32px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <HelpCircle size={28} />
            Preguntas frecuentes
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              {
                q: "¿Por qué Pathfinder no ejecuta los modelos directamente?",
                a: "Ejecutar modelos de IA de alta calidad requiere GPUs costosas. Para mantener Pathfinder accesible a $0, usamos la infraestructura gratuita de Kaggle en lugar de servidores propios. Cuando quieras, encendés tu estación y generás.",
              },
              {
                q: "¿Es legal usar Kaggle para generar contenido?",
                a: "Sí. Kaggle permite uso personal de sus notebooks y GPUs. Pathfinder te da las herramientas y la interfaz, vos operás tu propia estación de trabajo.",
              },
              {
                q: "¿Qué pasa si Run All se pausa a la mitad?",
                a: "A veces Kaggle interrumpe la ejecución por límites de tiempo o recursos. Simplemente vuelve a dar Run All — continúa desde donde quedó. Si después de 3 intentos no termina, cierra la sesión y vuelve a abrirla.",
              },
              {
                q: "¿Tengo que crear una cuenta de Kaggle nueva cada vez?",
                a: "No. Tu cuenta de Kaggle es permanente. Solo la creas una vez. Después, cada vez que quieras usar Pathfinder, abrís Kaggle, abrís tu notebook y das Run All.",
              },
              {
                q: "¿Tengo que importar el notebook cada vez?",
                a: "No. Una vez importado, el notebook queda guardado en tu cuenta de Kaggle. La próxima vez que entres, lo abres desde tu lista de notebooks y das Run All directamente.",
              },
              {
                q: "¿Puedo tener varios modelos cargados al mismo tiempo?",
                a: "Sí, pero cada modelo consume una sesión de Kaggle. Para uso normal, te recomendamos cargar solo el modelo que vas a usar en ese momento. Cambiar de modelo es rápido si cierras uno y abres otro.",
              },
              {
                q: "¿Por qué mis creaciones desaparecen de Pathfinder?",
                a: "Las creaciones se guardan por 7 días desde que las guardas. Después se eliminan automáticamente. Descárgalas antes si quieres conservarlas.",
              },
              {
                q: "¿Puedo usar Google Colab en lugar de Kaggle?",
                a: "Próximamente. Por ahora Pathfinder está optimizado para Kaggle.",
              },
              {
                q: "¿Cuánto cuesta usar Kaggle?",
                a: "Nada. Kaggle es gratuito. Te da 30 horas de GPU por semana, más que suficiente para uso normal.",
              },
            ].map((f, i) => (
              <details
                key={i}
                style={{
                  background: "var(--pf-bg-elevated)",
                  border: "1px solid var(--pf-border-subtle, #F4F4F5)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                }}
              >
                <summary
                  style={{
                    fontFamily: "var(--pf-font-display, system-ui)",
                    fontSize: "1rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "var(--pf-text-primary, #0A0A0A)",
                    cursor: "pointer",
                    listStyle: "none",
                  }}
                >
                  {f.q}
                </summary>
                <p
                  style={{
                    fontFamily: "var(--pf-font-ui, system-ui)",
                    fontSize: "0.9375rem",
                    lineHeight: 1.6,
                    color: "var(--pf-text-secondary, #525252)",
                    margin: 0,
                    marginTop: "12px",
                  }}
                >
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ==================== CTA FINAL ==================== */}
        <section
          style={{
            marginTop: "60px",
            padding: "40px 32px",
            background: "var(--pf-text-primary, #0A0A0A)",
            color: "var(--pf-text-inverse, #FFFFFF)",
            borderRadius: "20px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--pf-font-display, system-ui)",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: "16px",
              color: "var(--pf-text-inverse, #FFFFFF)",
            }}
          >
            {hasViewedBefore ? "¿Listo para seguir creando?" : "¿Listo para empezar?"}
          </h2>
          <p
            style={{
              fontFamily: "var(--pf-font-ui, system-ui)",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "28px",
              maxWidth: "520px",
              margin: "0 auto 28px",
              lineHeight: 1.5,
            }}
          >
            {hasViewedBefore
              ? "Recordá que cada vez que quieras usar un modelo, tenés que encender tu estación desde Kaggle."
              : "Ya conocés el proceso. Ahora sí, vamos a crear."}
          </p>

          {session ? (
            <button
              onClick={handleComplete}
              disabled={isMarking}
              style={{
                padding: "16px 40px",
                background: "var(--pf-bg-elevated)",
                color: "var(--pf-text-primary, #0A0A0A)",
                border: "none",
                borderRadius: "9999px",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: isMarking ? "wait" : "pointer",
                opacity: isMarking ? 0.7 : 1,
              }}
            >
              {isMarking ? "Cargando..." : hasViewedBefore ? "Ir al Studio" : "Entendido, ir al Studio"}
            </button>
          ) : (
            <Link
              to="/auth"
              style={{
                display: "inline-block",
                textDecoration: "none",
                padding: "16px 40px",
                background: "var(--pf-bg-elevated)",
                color: "var(--pf-text-primary, #0A0A0A)",
                borderRadius: "9999px",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "1rem",
                fontWeight: 700,
              }}
            >
              Crear cuenta gratis
            </Link>
          )}
        </section>
    </div>
  );
};

// ---------------------------------------------------------------------------
// HowItWorksPage — wrapper público con MarketingLayout
// Solo se usa cuando NO hay sesión activa
// ---------------------------------------------------------------------------
const HowItWorksPage: React.FC = () => (
  <MarketingLayout>
    <HowItWorksContent />
  </MarketingLayout>
);

export default HowItWorksPage;
