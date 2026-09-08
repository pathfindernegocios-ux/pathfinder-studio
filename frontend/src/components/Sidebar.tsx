// src/components/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { 
  StudioIcon, 
  CreationsIcon, 
  AssetsIcon, 
  StationIcon, 
  ProjectsIcon, 
  AcademyIcon, 
  SettingsIcon 
} from './NavIcons';

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

  // Configuración de navegación
  // featured: true -> Se muestra siempre (incluso colapsado)
  // featured: false -> Se oculta al colapsar
  const navItems = [
    { path: '/studio', label: 'Studio', icon: StudioIcon, featured: true },
    { path: '/projects', label: 'Proyectos', icon: ProjectsIcon, featured: false },
    { path: '/creations', label: 'Mis Creaciones', icon: CreationsIcon, featured: true },
    { path: '/assets', label: 'Assets', icon: AssetsIcon, featured: true },
    { path: '/academy', label: 'Academy', icon: AcademyIcon, featured: false },
    { path: '/station', label: 'Mi Estación', icon: StationIcon, featured: true },
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
        <div style={{ 
          opacity: collapsed ? 0 : 1, 
          transform: collapsed ? 'translateX(-10px)' : 'translateX(0)',
          transition: 'all 0.2s ease',
          fontFamily: 'var(--pf-font-display, system-ui)', 
          fontSize: '1.25rem', 
          fontWeight: 800, 
          color: 'var(--pf-text-primary, #F2F2F2)', 
          letterSpacing: '-0.03em',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          Pathfinder
        </div>
        
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
              color: '#FFFFFF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontFamily: 'var(--pf-font-ui)', 
              fontSize: '0.9rem', 
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              flexShrink: 0
            }}>
              {(profile.email || profile.user_metadata?.email || 'U')[0].toUpperCase()}
            </div>
            
            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ 
                  fontFamily: 'var(--pf-font-ui)', 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  color: 'var(--pf-text-primary, #F2F2F2)', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
                  {profile.email?.split('@')[0] || 'Usuario'}
                </div>
                <div style={{ 
                  fontFamily: 'var(--pf-font-ui)', 
                  fontSize: '0.75rem', 
                  color: 'var(--pf-text-muted, #6E747D)',
                  marginTop: '2px'
                }}>
                  En línea
                </div>
              </div>
            )}
            
            {!collapsed && (
              <button 
                onClick={handleLogout} 
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--pf-border-default, #40454D)', 
                  borderRadius: '8px', 
                  padding: '6px 12px', 
                  fontFamily: 'var(--pf-font-ui)', 
                  fontSize: '0.75rem', 
                  fontWeight: 500,
                  color: 'var(--pf-text-secondary, #9EA4AA)', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--pf-border-default, #40454D)';
                  e.currentTarget.style.color = 'var(--pf-text-secondary, #9EA4AA)';
                }}
              >
                Salir
              </button>
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
