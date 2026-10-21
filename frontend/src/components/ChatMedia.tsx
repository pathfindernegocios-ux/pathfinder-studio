import React, { useState, useEffect } from 'react';
import { useR2SignedUrl } from '../hooks/useR2SignedUrl';
import VideoPlayer from './VideoPlayer';

interface ChatMediaProps {
  r2Key: string;
  thumbKey?: string | null;
  mediaType: 'image' | 'video';
  aspectRatio?: string;
}

export const ChatMedia: React.FC<ChatMediaProps> = ({ r2Key, thumbKey, mediaType, aspectRatio }) => {
  // primaryKey: usa el thumbKey si es imagen y existe, sino el original.
  const primaryKey = mediaType === 'image' ? (thumbKey || r2Key) : r2Key;
  const [currentKey, setCurrentKey] = useState(primaryKey);
  
  const { url, loading, error } = useR2SignedUrl(currentKey);

  // BLINDAJE: Si falla la firma del thumbKey, cambiamos al original.
  // Gracias al fix del hook, el error se resetea y no hay falsos positivos.
  useEffect(() => {
    if (error && currentKey !== r2Key) {
      console.warn(`[ChatMedia] Falló el thumbKey, usando original: ${r2Key}`);
      setCurrentKey(r2Key);
    }
  }, [error, currentKey, r2Key]);

  // Sincronizar si las props cambian (ej. el item se actualiza en tiempo real)
  useEffect(() => {
    setCurrentKey(primaryKey);
  }, [primaryKey]);

  if (loading) {
    return (
      <div style={{ width: '100%', aspectRatio: aspectRatio || '16/9', background: 'var(--pf-bg-secondary)', borderRadius: 10, position: 'relative', overflow: 'hidden', border: '1px solid var(--pf-border-subtle)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, transparent 0%, rgba(139,92,246,0.06) 50%, transparent 100%)', animation: 'pfThumbShimmer 3.4s ease-in-out infinite' }} />
      </div>
    );
  }

  if (error || !url) {
    return <div style={{ width: '100%', aspectRatio: aspectRatio || '16/9', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F87171' }}>Error de conexión</div>;
  }

  if (mediaType === 'video') {
    return <VideoPlayer src={url} autoPlay={false} />;
  }

  return <img src={url} alt="Creación" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 10, aspectRatio }} />;
};
