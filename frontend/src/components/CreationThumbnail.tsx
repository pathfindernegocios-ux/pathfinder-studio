// src/components/CreationThumbnail.tsx
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSignedUrl } from '../hooks/useSignedUrl';
import type { Creation } from '../types';

interface CreationThumbnailProps {
  creation: Creation;
}

export const CreationThumbnail: React.FC<CreationThumbnailProps> = ({ creation }) => {
  const { url, loading, error } = useSignedUrl(creation.id);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detección robusta de video
  const isVideo =
    creation.media_type === 'video' ||
    (creation.duration !== undefined && creation.duration !== null && creation.duration !== '');

  // Intersection Observer: Control de reproducción de video según visibilidad
  useEffect(() => {
    // Solo necesitamos observar si es un video y ya tenemos URL
    if (!isVideo || !url) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        
        if (videoRef.current) {
          if (entry.isIntersecting) {
            // Intentar reproducir al entrar en viewport
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                // Ignorar errores de autoplay si el navegador lo bloquea
              });
            }
          } else {
            // Pausar al salir para ahorrar recursos
            videoRef.current.pause();
          }
        }
      },
      {
        rootMargin: '200px', // Cargar un poco antes de que sea totalmente visible
        threshold: 0.1,
      }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isVideo, url]);

  // Estados de carga y error
  if (loading) {
    return (
      <div 
        id={`thumb-${creation.id}`}
        style={{ 
          aspectRatio: '1', 
          background: 'var(--pf-bg-secondary)', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--pf-border-default)',
          borderTopColor: 'var(--pf-text-muted)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div 
        id={`thumb-${creation.id}`}
        style={{ 
          aspectRatio: '1', 
          background: 'var(--pf-bg-tertiary)', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--pf-text-muted)',
          fontSize: '0.75rem',
          fontFamily: 'var(--pf-font-ui)'
        }}
      >
        Sin vista previa
      </div>
    );
  }

  return (
    <Link 
      to={`/creations/${creation.id}`} 
      id={`thumb-${creation.id}`}
      style={{ 
        textDecoration: 'none', 
        display: 'block', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
        background: isVideo ? '#000' : 'var(--pf-bg-secondary)', // Fondo negro solo para videos
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
      }}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={url}
          muted
          loop
          playsInline
          preload="metadata"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            display: 'block' 
          }}
        />
      ) : (
        <img
          src={url}
          alt={creation.prompt}
          loading="lazy"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            display: 'block' 
          }}
        />
      )}
      
      {/* Badge de Video (Solo si es video) */}
      {isVideo && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          borderRadius: '99px',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'none'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
      )}

      {/* Overlay gradual inferior */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
        pointerEvents: 'none'
      }} />
    </Link>
  );
};

export default CreationThumbnail;