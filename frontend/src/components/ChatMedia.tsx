import React from 'react';
import { useR2SignedUrl } from '../hooks/useR2SignedUrl';
import VideoPlayer from './VideoPlayer'; // <--- Importamos tu reproductor personalizado

interface ChatMediaProps {
  r2Key: string;
  mediaType: 'image' | 'video';
  aspectRatio?: string;
}

export const ChatMedia: React.FC<ChatMediaProps> = ({ r2Key, mediaType, aspectRatio }) => {
  const { url, loading, error } = useR2SignedUrl(r2Key);

  // SKELETON INDUSTRIAL: Sin textos, solo un placeholder con brillo
  if (loading) {
    return (
      <div style={{ 
        width: '100%', 
        aspectRatio: aspectRatio || '16/9', 
        background: 'var(--pf-bg-secondary)', 
        borderRadius: 10, 
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--pf-border-subtle)'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(115deg, transparent 0%, rgba(139,92,246,0.06) 50%, transparent 100%)',
          animation: 'pfThumbShimmer 3.4s ease-in-out infinite',
        }} />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div style={{ width: '100%', aspectRatio: aspectRatio || '16/9', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F87171' }}>
        Error de conexión
      </div>
    );
  }

  if (mediaType === 'video') {
    // USAMOS TU COMPONENTE EN LUGAR DE LA ETIQUETA NATIVA
    return <VideoPlayer src={url} autoPlay={false} />;
  }

  return <img src={url} alt="Creación" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 10, aspectRatio }} />;
};
