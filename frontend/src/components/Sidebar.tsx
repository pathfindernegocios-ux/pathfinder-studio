// src/components/Sidebar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { 
  StudioIcon, 
  CreationsIcon, 
  StationIcon, 
  AcademyIcon, 
  SettingsIcon 
} from './NavIcons';

// Ícono para "Cómo funciona" — agregado localmente para no tocar NavIcons
const HowItWorksIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1 2-2 2.5-.6.3-1 .7-1 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="17" r="0.8" fill="currentColor" />
  </svg>
);

// El ancho ya NO vive aquí adentro. Lo controla el padre (StudioPage) para que
// nunca haya un desfase entre "lo que el sidebar mide realmente" y "el espacio
// que el layout le reserva" (eso era lo que dejaba el rastro/franja gris al
// colapsar). Este componente solo pinta su contenido al 100% del contenedor
// que le pasen.
interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapsed }) => {
  const location = useLocation();
  const { session, profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Dropdown de usuario
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Datos de display del usuario
  const displayName =
    profile?.full_name?.split(' ')[0] ||
    profile?.username ||
    profile?.email?.split('@')[0] ||
    'Usuario';

  const avatarInitial = (
    profile?.username?.[0] ||
    profile?.full_name?.[0] ||
    profile?.email?.[0] ||
    'U'
  ).toUpperCase();

  const avatarUrl = profile?.avatar_url || null;

  // Configuración de navegación
  // featured: true -> Se muestra siempre (incluso colapsado)
  // featured: false -> Se oculta al colapsar
  const navItems = [
    { path: '/studio', label: 'Studio', icon: StudioIcon, featured: true },
    { path: '/creations', label: 'Mis Creaciones', icon: CreationsIcon, featured: true },
    { path: '/station', label: 'Mi Estación', icon: StationIcon, featured: true },
    { path: '/how-it-works', label: 'Cómo funciona', icon: HowItWorksIcon, featured: true },
    { path: '/academy', label: 'Academy', icon: AcademyIcon, featured: false },
    { path: '/settings', label: 'Configuración', icon: SettingsIcon, featured: false },
  ];

  return (
    <div 
      style={{ 
        width: '100%',
        height: '100%',
        background: 'var(--pf-bg-secondary, #1C1E22)', 
        borderRight: '1px solid var(--pf-border-subtle, #2A2D31)', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }}
    >
      {/* Header */}
      <div style={{ 
        height: '64px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 20px',
        borderBottom: '1px solid var(--pf-border-subtle, #2A2D31)' 
      }}>
        <Link 
          to="/"
          style={{ 
            opacity: collapsed ? 0 : 1, 
            transform: collapsed ? 'translateX(-10px)' : 'translateX(0)',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--pf-font-display, system-ui)', 
            fontSize: '1.25rem', 
            fontWeight: 800, 
            color: 'var(--pf-text-primary, #F2F2F2)', 
            letterSpacing: '-0.03em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textDecoration: 'none',
            pointerEvents: collapsed ? 'none' : 'auto'
          }}
        >
          Pathfinder
        </Link>
        
        <button 
          onClick={onToggleCollapsed} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            padding: '8px', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--pf-text-secondary, #9EA4AA)',
            transition: 'color 0.2s',
            flexShrink: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pf-text-primary, #F2F2F2)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pf-text-secondary, #9EA4AA)'}
        >
          {collapsed ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav style={{ 
        flex: 1, 
        padding: '20px 12px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '4px' 
      }}>
        {navItems.map((item) => {
          // Lógica de visibilidad: Si está colapsado, solo muestra los 'featured'
          if (collapsed && !item.featured) return null;

          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{ 
                textDecoration: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '14px', 
                padding: '10px 12px', 
                borderRadius: '10px', 
                background: isActive ? 'var(--pf-glass-surface, rgba(255,255,255,0.05))' : 'transparent', 
                border: isActive ? '1px solid var(--pf-border-default, #40454D)' : '1px solid transparent', 
                transition: 'all 0.2s ease', 
                color: isActive ? 'var(--pf-text-primary, #F2F2F2)' : 'var(--pf-text-secondary, #9EA4AA)',
                marginBottom: '2px'
              }}
              title={collapsed ? item.label : undefined}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                flexShrink: 0,
                color: isActive ? 'var(--pf-accent-primary, #D7DADF)' : 'currentColor'
              }}>
                <Icon className={isActive ? "text-accent" : ""} />
              </div>
              
              <span style={{ 
                fontFamily: 'var(--pf-font-ui, system-ui)', 
                fontSize: '0.9rem', 
                fontWeight: isActive ? 600 : 500,
                whiteSpace: 'nowrap',
                opacity: collapsed ? 0 : 1,
                transform: collapsed ? 'translateX(-10px)' : 'translateX(0)',
                transition: 'all 0.2s ease',
                overflow: 'hidden'
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid var(--pf-border-subtle, #2A2D31)', 
        background: 'var(--pf-glass-surface, rgba(255,255,255,0.02))', 
        backdropFilter: 'blur(12px)' 
      }}>
        {session && profile ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            {/* Botón de usuario (avatar + nombre) */}
            <button
              onClick={() => {
                // Si está colapsado, expandir el sidebar primero
                if (collapsed) {
                  onToggleCollapsed();
                  // Abrir el menú después de que el sidebar se expanda
                  setTimeout(() => setMenuOpen(true), 100);
                } else {
                  setMenuOpen((o) => !o);
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: menuOpen ? 'var(--pf-glass-surface, rgba(255,255,255,0.05))' : 'transparent',
                border: 'none',
                borderRadius: '10px',
                padding: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={(e) => {
                if (!menuOpen) e.currentTarget.style.background = 'var(--pf-glass-surface, rgba(255,255,255,0.05))';
              }}
              onMouseLeave={(e) => {
                if (!menuOpen) e.currentTarget.style.background = 'transparent';
              }}
              title={collapsed ? displayName : undefined}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--pf-font-ui)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  flexShrink: 0,
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  avatarInitial
                )}
              </div>

              {!collapsed && (
                <>
                  <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
                    <div
                      style={{
                        fontFamily: 'var(--pf-font-ui)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--pf-text-primary, #F2F2F2)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {displayName}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--pf-font-ui)',
                        fontSize: '0.7rem',
                        color: 'var(--pf-text-muted, #6E747D)',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      @{profile.username || 'usuario'}
                    </div>
                  </div>

                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      color: 'var(--pf-text-muted, #6E747D)',
                      transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </>
              )}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '0',
                  marginBottom: '8px',
                  minWidth: '220px',
                  background: '#FFFFFF',
                  border: '1px solid var(--pf-border-default, #E5E5E5)',
                  borderRadius: '12px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                  padding: '8px',
                  zIndex: 100,
                }}
              >
                {/* Header del dropdown */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--pf-border-subtle, #F4F4F5)',
                    marginBottom: '6px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--pf-font-ui, system-ui)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--pf-text-primary, #0A0A0A)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {profile.full_name || profile.username || 'Usuario'}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--pf-font-ui, system-ui)',
                      fontSize: '0.75rem',
                      color: 'var(--pf-text-muted, #A1A1AA)',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {profile.email}
                  </div>
                </div>

                {/* Opciones */}
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontFamily: 'var(--pf-font-ui, system-ui)',
                    fontSize: '0.875rem',
                    color: 'var(--pf-text-secondary, #525252)',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pf-bg-secondary, #FAFAFA)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
                  </svg>
                  Configuración
                </Link>

                {/* Divider */}
                <div
                  style={{
                    height: '1px',
                    background: 'var(--pf-border-subtle, #F4F4F5)',
                    margin: '6px 0',
                  }}
                />

                {/* Cerrar sesión */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'var(--pf-font-ui, system-ui)',
                    fontSize: '0.875rem',
                    color: '#EF4444',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/auth" style={{ textDecoration: 'none' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              padding: '10px', 
              background: 'var(--pf-text-primary, #F2F2F2)', 
              color: '#000000', 
              borderRadius: '10px', 
              fontFamily: 'var(--pf-font-ui)', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              transition: 'transform 0.2s'
            }}>
              <span style={{ width: '18px', height: '18px', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/></svg>
              </span>
              {!collapsed && <span>Iniciar sesión</span>}
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
