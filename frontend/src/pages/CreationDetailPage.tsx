// src/pages/CreationDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCreations } from '../hooks/useCreations';
import { useSignedUrl } from '../hooks/useSignedUrl';
import type { Creation } from '../types';
import { Trash2, ArrowLeft, Clock, Film, Image as ImageIcon, Cpu, Maximize2, X } from 'lucide-react';

const CreationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCreations, deleteCreation } = useCreations();
  
  const [creation, setCreation] = useState<Creation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Usamos el hook optimizado para la URL del media principal
  const { url: mediaUrl, loading: loadingUrl } = useSignedUrl(id || null);

  // Cargar detalles de la creación
  useEffect(() => {
    const loadCreation = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const allCreations = await getCreations();
        const found = allCreations.find((c: Creation) => c.id === id);
        setCreation(found || null);
      } catch (error) {
        console.error('Error loading creation:', error);
        setCreation(null);
      } finally {
        setLoading(false);
      }
    };

    loadCreation();
  }, [id, getCreations]);

  const handleDelete = useCallback(async () => {
    if (!creation) return;
    
    if (window.confirm('¿Estás seguro de que deseas eliminar esta creación? Esta acción no se puede deshacer.')) {
      setIsDeleting(true);
      try {
        await deleteCreation(creation.id);
        navigate('/creations', { replace: true });
      } catch (error) {
        console.error('Error deleting:', error);
        alert('No se pudo eliminar la creación. Inténtalo de nuevo.');
        setIsDeleting(false);
      }
    }
  }, [creation, deleteCreation, navigate]);

  // Detección robusta de video
  const isVideo = creation 
    ? (creation.media_type === 'video' || (creation.duration && creation.duration !== ''))
    : false;

  const toggleLightbox = () => setIsLightboxOpen(!isLightboxOpen);

  if (loading) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--pf-bg-primary)' 
      }}>
        <div style={{ 
          fontFamily: 'var(--pf-font-ui)', 
          color: 'var(--pf-text-muted)', 
          fontSize: '1rem',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid var(--pf-border-default)', borderTopColor: 'var(--pf-text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Cargando detalles...
        </div>
      </div>
    );
  }

  if (!creation) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--pf-bg-primary)', 
        padding: '40px 20px', 
        textAlign: 'center' 
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '24px', opacity: 0.5 }}>😕</div>
        <h1 className="pf-font-prompt" style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--pf-text-primary)', marginBottom: '16px' }}>
          Creación no encontrada
        </h1>
        <p style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '1rem', color: 'var(--pf-text-secondary)', marginBottom: '32px' }}>
          La creación que buscas no existe, ha sido eliminada o no tienes permiso para verla.
        </p>
        <Link
          to="/creations"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--pf-text-primary)',
            color: '#FFFFFF',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '1rem',
            fontWeight: 600,
            padding: '12px 24px',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <ArrowLeft size={18} />
          Volver a la Colección
        </Link>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      overflowY: 'auto', 
      background: 'var(--pf-bg-primary)',
      scrollBehavior: 'smooth'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>
        
        {/* Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <Link
            to="/creations"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: 'var(--pf-text-secondary)',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--pf-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--pf-text-secondary)')}
          >
            <ArrowLeft size={18} />
            Volver a la Colección
          </Link>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: isDeleting ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '9999px',
              padding: '10px 20px',
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isDeleting ? '#FFFFFF' : '#EF4444',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => !isDeleting && (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => !isDeleting && (e.currentTarget.style.opacity = '1')}
          >
            <Trash2 size={16} />
            {isDeleting ? 'Eliminando...' : 'Eliminar creación'}
          </button>
        </div>

        {/* Main Media Card - Premium Immersive Style */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          overflow: 'visible', // Cambiado para evitar recortes en sombras
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
          border: '1px solid var(--pf-border-subtle)',
          marginBottom: '40px',
          position: 'relative'
        }}>
          <div 
            onClick={!isVideo ? toggleLightbox : undefined}
            style={{ 
              background: '#FAFAFA', // Fondo gris muy suave en lugar de negro
              width: '100%', 
              minHeight: '400px', 
              maxHeight: '70vh',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              cursor: !isVideo ? 'zoom-in' : 'default'
            }}
          >
            {loadingUrl ? (
              <div style={{ color: 'var(--pf-text-muted)', fontFamily: 'var(--pf-font-ui)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '24px', height: '24px', border: '3px solid var(--pf-border-default)', borderTopColor: 'var(--pf-text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Cargando obra...</span>
              </div>
            ) : mediaUrl ? (
              <>
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    style={{ width: '100%', height: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={creation.prompt}
                    loading="lazy"
                    decoding="async"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      maxHeight: '70vh', 
                      objectFit: 'contain', 
                      display: 'block',
                      transition: 'transform 0.3s ease',
                      filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))'
                    }}
                  />
                )}
                
                {/* Overlay hint para imágenes */}
                {!isVideo && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(8px)',
                    padding: '8px 12px',
                    borderRadius: '99px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--pf-text-primary)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    pointerEvents: 'none',
                    opacity: 0.8
                  }}>
                    <Maximize2 size={14} />
                    Ver en detalle
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--pf-text-muted)', fontFamily: 'var(--pf-font-ui)' }}>
                No disponible
              </div>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '32px' 
        }}>
          {/* Prompt Section */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '12px',
              color: 'var(--pf-text-muted)',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.05em'
            }}>
              <Cpu size={14} />
              Prompt Generativo
            </div>
            <p className="pf-font-prompt" style={{
              fontFamily: 'var(--pf-font-display)',
              fontSize: '1.25rem',
              lineHeight: 1.6,
              color: 'var(--pf-text-primary)',
              margin: 0,
              paddingBottom: '24px',
              borderBottom: '1px solid var(--pf-border-subtle)'
            }}>
              {creation.prompt}
            </p>
          </div>

          {/* Details Cards */}
          <DetailCard 
            icon={<Clock size={18} />}
            label="Fecha de creación"
            value={new Date(creation.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          
          <DetailCard 
            icon={isVideo ? <Film size={18} /> : <ImageIcon size={18} />}
            label="Tipo de media"
            value={isVideo ? 'Video' : 'Imagen'}
            badge={isVideo && creation.duration ? creation.duration : undefined}
          />

          {creation.model_id && (
            <DetailCard 
              icon={<Cpu size={18} />}
              label="Modelo IA"
              value={creation.model_id}
            />
          )}
          
          {creation.aspect_ratio && (
            <DetailCard 
              icon={<ImageIcon size={18} />}
              label="Relación de aspecto"
              value={creation.aspect_ratio}
            />
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && mediaUrl && !isVideo && (
        <div 
          onClick={toggleLightbox}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out',
            cursor: 'zoom-out'
          }}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); toggleLightbox(); }}
            style={{
              position: 'absolute',
              top: '30px',
              right: '30px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
              zIndex: 1001
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <X size={24} />
          </button>
          
          <img
            src={mediaUrl}
            alt={creation.prompt}
            style={{
              maxWidth: '95%',
              maxHeight: '95vh',
              objectFit: 'contain',
              boxShadow: '0 0 50px rgba(0,0,0,0.5)',
              animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

// Sub-componente para tarjetas de metadatos consistente
const DetailCard = ({ icon, label, value, badge }: { icon: React.ReactNode, label: string, value: string, badge?: string | undefined }) => (
  <div style={{
    background: '#FFFFFF',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid var(--pf-border-subtle)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
  }}
  >
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      color: 'var(--pf-text-muted)',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {icon}
      {label}
    </div>
    <div style={{ 
      fontFamily: 'var(--pf-font-ui)', 
      fontSize: '1rem', 
      color: 'var(--pf-text-primary)',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    }}>
      {value}
      {badge && (
        <span style={{
          background: 'var(--pf-bg-secondary)',
          color: 'var(--pf-text-secondary)',
          fontSize: '0.75rem',
          padding: '4px 8px',
          borderRadius: '6px',
          fontWeight: 500
        }}>
          {badge}
        </span>
      )}
    </div>
  </div>
);

export default CreationDetailPage;