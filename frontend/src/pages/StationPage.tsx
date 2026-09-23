// src/pages/StationPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Lock, Sparkles, Clock, CheckCircle2, Loader2, ExternalLink, HelpCircle } from 'lucide-react';
import { useModels } from '../hooks/useModels';
import type { ModelCatalogEntry } from '../hooks/useModels';
import { supabase } from '../lib/supabaseClient';
import { Client } from '@gradio/client';
import { Power } from 'lucide-react';
import { useGenerationContext } from '../context/GenerationContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// ============================================================
// Download de notebook
// ============================================================
async function downloadNotebook(modelId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('No hay sesión activa');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-notebook`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ modelId }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Error ${res.status}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pathfinder-${modelId}.ipynb`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ============================================================
// Shutdown de estación
// ============================================================
async function shutdownStation(modelId: string, stationId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('No hay sesión activa');

  // 1. Buscar el runtime más reciente de este modelo
  let gradioUrl: string | null = null;
  try {
    const { data } = await supabase
      .from('runtimes')
      .select('gradio_url, created_at')
      .eq('station_id', stationId)
      .eq('model_id', modelId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.gradio_url) gradioUrl = data.gradio_url;
  } catch { /* ignorar */ }

  // 2. Best-effort: llamar al endpoint /shutdown del notebook
  if (gradioUrl) {
    try {
      const client = await Promise.race([
        Client.connect(gradioUrl),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
      await Promise.race([
        client.predict('/shutdown', [token]),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
    } catch {
      // El notebook puede estar ya muerto o sin responder — seguimos igual
    }
  }

  // 3. Esperar 2.5s para dar tiempo al notebook a procesar su shutdown
  await new Promise((r) => setTimeout(r, 2500));

  // 4. Borrar todas las filas de este modelo (el notebook también lo intenta, pero por las dudas)
  await supabase
    .from('runtimes')
    .delete()
    .eq('station_id', stationId)
    .eq('model_id', modelId);
}

// ============================================================
// Card de modelo (owned / locked / coming soon)
// ============================================================
type CardVariant = 'owned' | 'locked' | 'coming_soon';

interface ModelCardProps {
  model: ModelCatalogEntry;
  variant: CardVariant;
  onDownload?: (modelId: string) => void;
  isDownloading?: boolean;
  isOnline?: boolean;
  onShutdown?: (modelId: string) => void;
  isShuttingDown?: boolean;
}

const CAPABILITY_LABEL: Record<string, string> = {
  image: 'Imagen',
  video: 'Video',
  audio: 'Audio',
};

const ModelCard: React.FC<ModelCardProps> = ({ model, variant, onDownload, isDownloading, isOnline, onShutdown, isShuttingDown }) => {
  const badge = (() => {
    if (variant === 'owned') return { text: 'Disponible', color: '#10B981', bg: 'rgba(16,185,129,0.1)', Icon: CheckCircle2 };
    if (variant === 'coming_soon') return { text: 'Próximamente', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', Icon: Clock };
    return { text: 'Bloqueado', color: 'var(--pf-text-muted)', bg: 'rgba(107,114,128,0.1)', Icon: Lock };
  })();

  return (
    <div
      style={{
        background: 'var(--pf-bg-primary)',
        border: '1px solid var(--pf-border-default)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Thumbnail / placeholder */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/9',
          background: 'var(--pf-bg-tertiary)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--pf-text-muted)',
          fontSize: '2rem',
          overflow: 'hidden',
        }}
      >
        {model.thumbnail_url ? (
          <img
            src={model.thumbnail_url}
            alt={model.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Sparkles size={32} />
        )}
      </div>

      {/* Header: nombre + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--pf-font-display)',
              fontSize: '1.0625rem',
              fontWeight: 600,
              color: 'var(--pf-text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '2px',
            }}
          >
            {model.name}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--pf-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>{CAPABILITY_LABEL[model.capability] || model.capability}</span>
            {variant === 'owned' && isOnline !== undefined && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  letterSpacing: '0',
                  color: isOnline ? '#10B981' : 'var(--pf-text-muted)',
                }}
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isOnline ? '#10B981' : 'var(--pf-text-muted)',
                }} />
                {isOnline ? 'Estación ON' : 'Estación OFF'}
              </span>
            )}
          </div>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '0.6875rem',
            fontWeight: 600,
            fontFamily: 'var(--pf-font-ui)',
            color: badge.color,
            background: badge.bg,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <badge.Icon size={11} />
          {badge.text}
        </span>
      </div>

      {/* Descripción */}
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--pf-font-ui)',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
          color: 'var(--pf-text-secondary)',
          flex: 1,
        }}
      >
        {model.description}
      </p>

      {/* Acción */}
      {variant === 'owned' && onDownload && (
        <button
          onClick={() => onDownload(model.id)}
          disabled={isDownloading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: isDownloading ? 'var(--pf-bg-tertiary)' : 'var(--pf-text-primary)',
            color: isDownloading ? 'var(--pf-text-muted)' : 'var(--pf-bg-elevated)',
            border: 'none',
            borderRadius: '10px',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isDownloading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Descargando...
            </>
          ) : (
            <>
              <Download size={14} />
              Descargar notebook
            </>
          )}
        </button>
      )}

      {variant === 'owned' && onShutdown && (
        <button
          onClick={() => onShutdown(model.id)}
          disabled={isShuttingDown}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--pf-bg-primary)',
            color: 'var(--pf-text-secondary)',
            border: '1px solid var(--pf-border-default)',
            borderRadius: '10px',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.875rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            cursor: isShuttingDown ? 'not-allowed' : 'pointer',
            opacity: isShuttingDown ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (isShuttingDown) return;
            e.currentTarget.style.borderColor = 'var(--pf-error)';
            e.currentTarget.style.color = 'var(--pf-error)';
          }}
          onMouseLeave={(e) => {
            if (isShuttingDown) return;
            e.currentTarget.style.borderColor = 'var(--pf-border-default)';
            e.currentTarget.style.color = 'var(--pf-text-secondary)';
          }}
        >
          {isShuttingDown ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Apagando...
            </>
          ) : (
            <>
              <Power size={14} />
              Apagar estación
            </>
          )}
        </button>
      )}

      {variant === 'locked' && (
        <button
          disabled
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--pf-bg-secondary)',
            color: 'var(--pf-text-muted)',
            border: '1px solid var(--pf-border-default)',
            borderRadius: '10px',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'not-allowed',
          }}
        >
          <Lock size={14} />
          Bloqueado
        </button>
      )}

      {variant === 'coming_soon' && (
        <button
          disabled
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--pf-bg-secondary)',
            color: 'var(--pf-text-muted)',
            border: '1px solid var(--pf-border-default)',
            borderRadius: '10px',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'not-allowed',
          }}
        >
          <Clock size={14} />
          Próximamente
        </button>
      )}
    </div>
  );
};

// ============================================================
// Página principal
// ============================================================
const StationPage: React.FC = () => {
  const { ownedModels, lockedModels, comingSoonModels, loading, error, refresh } = useModels();
  const { stationStatusMap, refreshStationStatus } = useGenerationContext();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [shuttingDownId, setShuttingDownId] = useState<string | null>(null);

  const handleShutdown = async (modelId: string) => {
    const confirmed = window.confirm(
      `¿Seguro que querés apagar tu estación? Se perderán todos tus datos.\n\n` +
      `Asegurate de guardar tus creaciones antes de continuar.`
    );
    if (!confirmed) return;

    setShuttingDownId(modelId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const stationId = session?.user?.id;
      if (!stationId) throw new Error('No hay sesión activa');

      await shutdownStation(modelId, stationId);
      await refreshStationStatus();
    } catch (e) {
      console.error('Error apagando estación:', e);
      alert('Hubo un problema al apagar la estación. Intenta de nuevo.');
    } finally {
      setShuttingDownId(null);
    }
  };

  const handleDownload = async (modelId: string) => {
    setDownloadingId(modelId);
    try {
      await downloadNotebook(modelId);
    } catch (e) {
      console.error('Error descargando notebook:', e);
      alert('No se pudo descargar el notebook. Intenta de nuevo.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: 'var(--pf-bg-primary)',
        color: 'var(--pf-text-primary)',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '48px 32px 80px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1
            style={{
              fontFamily: 'var(--pf-font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              margin: 0,
              marginBottom: '8px',
            }}
          >
            Mi Estación
          </h1>
          <p
            style={{
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.9375rem',
              color: 'var(--pf-text-secondary)',
              margin: 0,
              maxWidth: '560px',
              lineHeight: 1.6,
            }}
          >
            Descarga tus notebooks para correrlos en Kaggle. Cada modelo requiere un runtime activo.
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            <a
              href="https://www.kaggle.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "var(--pf-text-primary, #0A0A0A)",
                color: "var(--pf-bg-elevated)",
                borderRadius: "10px",
                textDecoration: "none",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Abrir Kaggle
              <ExternalLink size={14} />
            </a>
            <Link
              to="/how-it-works"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "transparent",
                color: "var(--pf-text-primary, #0A0A0A)",
                border: "1px solid var(--pf-border-default, #E5E5E5)",
                borderRadius: "10px",
                textDecoration: "none",
                fontFamily: "var(--pf-font-ui, system-ui)",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--pf-bg-secondary, #FAFAFA)";
                e.currentTarget.style.borderColor = "var(--pf-text-primary, #0A0A0A)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--pf-border-default, #E5E5E5)";
              }}
            >
              <HelpCircle size={14} />
              ¿Cómo enciendo mi estación?
            </Link>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--pf-text-muted)' }}>
            <Loader2 size={24} className="animate-spin" />
            <div style={{ marginTop: '12px', fontFamily: 'var(--pf-font-ui)', fontSize: '0.875rem' }}>
              Cargando modelos...
            </div>
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid #EF4444',
              borderRadius: '12px',
              color: '#EF4444',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.875rem',
              marginBottom: '32px',
            }}
          >
            {error}
            <button
              onClick={refresh}
              style={{
                marginLeft: '12px',
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontFamily: 'var(--pf-font-ui)',
                fontSize: '0.875rem',
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Sección 1: Mis notebooks */}
        {!loading && !error && ownedModels.length > 0 && (
          <section style={{ marginBottom: '56px' }}>
            <h2
              style={{
                fontFamily: 'var(--pf-font-display)',
                fontSize: '1.125rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: 0,
                marginBottom: '20px',
                color: 'var(--pf-text-primary)',
              }}
            >
              Mis notebooks
              <span
                style={{
                  marginLeft: '10px',
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--pf-text-muted)',
                }}
              >
                {ownedModels.length}
              </span>
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {ownedModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  variant="owned"
                  onDownload={handleDownload}
                  isDownloading={downloadingId === model.id}
                  isOnline={stationStatusMap[model.id] === 'online'}
                  onShutdown={handleShutdown}
                  isShuttingDown={shuttingDownId === model.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sección 2: Catálogo */}
        {!loading && !error && (lockedModels.length > 0 || comingSoonModels.length > 0) && (
          <section>
            <h2
              style={{
                fontFamily: 'var(--pf-font-display)',
                fontSize: '1.125rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: 0,
                marginBottom: '20px',
                color: 'var(--pf-text-primary)',
              }}
            >
              Explorar catálogo
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {[...lockedModels, ...comingSoonModels].map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  variant={model.coming_soon ? 'coming_soon' : 'locked'}
                />
              ))}
            </div>
          </section>
        )}

        {/* Estado vacío (nada en ninguna sección) */}
        {!loading && !error && ownedModels.length === 0 && lockedModels.length === 0 && comingSoonModels.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--pf-text-muted)' }}>
            <Sparkles size={32} style={{ marginBottom: '16px' }} />
            <p style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '0.9375rem', margin: 0 }}>
              Todavía no hay modelos disponibles en el catálogo.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default StationPage;
