// src/pages/CreationsPage.tsx
import React, { useEffect, useState } from 'react';
import { useCreations } from '../hooks/useCreations';
import type { Creation } from '../types';
import { CreationThumbnail } from '../components/CreationThumbnail';

const CreationsPage: React.FC = () => {
  const { getCreations } = useCreations();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCreations();
        setCreations(data || []);
      } catch (err) {
        console.error('Error loading creations:', err);
        setError('No se pudieron cargar tus creaciones.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getCreations]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--pf-bg-primary)' }}>
        <div style={{ fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-muted)', fontSize: '1rem' }}>Cargando Mis creaciones...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--pf-bg-primary)' }}>
        <p style={{ fontFamily: 'var(--pf-font-ui)', color: 'var(--pf-text-muted)' }}>{error}</p>
      </div>
    );
  }

  if (creations.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--pf-bg-primary)', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '24px' }}>🎨</div>
        <h1 style={{ fontFamily: 'var(--pf-font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--pf-text-primary)', marginBottom: '16px' }}>Mis creaciones</h1>
        <p style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '1rem', color: 'var(--pf-text-secondary)' }}>
          Aún no tienes creaciones guardadas.
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pf-bg-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--pf-font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--pf-text-primary)', marginBottom: '32px' }}>
          Mis creaciones
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
          {creations.map((creation) => (
            <CreationThumbnail key={creation.id} creation={creation} isHovered={false} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreationsPage;