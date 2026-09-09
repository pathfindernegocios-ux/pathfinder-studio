// src/components/CreationThumbnail.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCreations } from '../hooks/useCreations';
import type { Creation } from '../types';

interface CreationThumbnailProps {
  creation: Creation;
  isHovered?: boolean;
}

export const CreationThumbnail: React.FC<CreationThumbnailProps> = ({ creation }) => {
  const { getDownloadUrl } = useCreations();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [urlError, setUrlError] = useState(false);
  const isMounted = useRef(true);

  // Detección robusta de video:
  // 1. media_type === "video"
  // 2. Si duration existe, es video (aunque media_type esté mal)
  const isVideo =
    creation.media_type === 'video' ||
    (creation.duration !== undefined && creation.duration !== null && creation.duration !== '');

  useEffect(() => {
    isMounted.current = true;
    const loadMediaUrl = async () => {
      if (creation.id && !urlError) {
        try {
          setLoadingUrl(true);
          const url = await getDownloadUrl(creation.id);
          if (isMounted.current) {
            if (url) {
              setMediaUrl(url);
              setUrlError(false);
            } else {
              setUrlError(true);
            }
          }
        } catch (error) {
          console.error('Error loading media URL:', error);
          if (isMounted.current) setUrlError(true);
        } finally {
          if (isMounted.current) setLoadingUrl(false);
        }
      }
    };
    loadMediaUrl();
    return () => { isMounted.current = false; };
  }, [creation.id, getDownloadUrl, urlError]);

  // Log temporal para diagnóstico (quitar después de confirmar)
  console.log('🎬 Thumbnail', {
    id: creation.id,
    media_type: creation.media_type,
    duration: creation.duration,
    mediaUrl,
    isVideo,
  });

  if (loadingUrl) {
    return (
      <div style={{ aspectRatio: '1', background: 'var(--pf-bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--pf-text-muted)' }}>Cargando...</span>
      </div>
    );
  }

  if (!mediaUrl || urlError) {
    return (
      <div style={{ aspectRatio: '1', background: 'var(--pf-bg-tertiary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--pf-text-muted)' }}>Sin vista previa</span>
      </div>
    );
  }

  return (
    <Link to={`/creations/${creation.id}`} style={{ textDecoration: 'none', display: 'block', borderRadius: '8px', overflow: 'hidden' }}>
      {isVideo ? (
        <video
          src={mediaUrl}
          muted
          loop
          autoPlay
          preload="metadata"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <img
          src={mediaUrl}
          alt={creation.prompt}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </Link>
  );
};

export default CreationThumbnail;