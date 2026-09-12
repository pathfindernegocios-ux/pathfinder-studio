// src/components/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Image, 
  FolderOpen, 
  Box, 
  GraduationCap, 
  Radio, 
  LogOut,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  path: string;
  // Permitimos que icon sea un componente o un elemento JSX
  icon: React.ElementType | React.ReactNode; 
  label: string;
  activePaths?: string[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  // Nuevas props para modo móvil
  isMobile?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/studio', icon: LayoutDashboard, label: 'Studio', activePaths: ['/studio'] },
  { path: '/creations', icon: Image, label: 'Mis Creaciones', activePaths: ['/creations'] },
  { path: '/projects', icon: FolderOpen, label: 'Proyectos', activePaths: ['/projects'] },
  { path: '/assets', icon: Box, label: 'Assets', activePaths: ['/assets'] },
  { path: '/academy', icon: GraduationCap, label: 'Academy', activePaths: ['/academy'] },
  { path: '/station', icon: Radio, label: 'Station', activePaths: ['/station'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  onToggleCollapsed, 
  isMobile = false,
  onClose 
}) => {
  const location = useLocation();
  const { setHasEnteredStudio } = useAuth();

  const isActive = (itemPath: string, activePaths?: string[]) => {
    if (activePaths) {
      return activePaths.some(p => location.pathname.startsWith(p));
    }
    return location.pathname === itemPath;
  };

  const handleLogout = () => {
    // Limpiamos el estado de "entrada al estudio" para volver a la welcome screen
    setHasEnteredStudio(false);
    // Recargamos o redirigimos para limpiar sesión si es necesario
    // En una implementación real con Supabase Auth, aquí llamarías a supabase.auth.signOut()
    window.location.href = '/auth'; 
  };

  const renderIcon = (icon: React.ElementType | React.ReactNode, size: number = 20) => {
    if (typeof icon === 'function') {
      const IconComponent = icon as React.ElementType;
      return <IconComponent size={size} />;
    }
    return icon;
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#FFFFFF',
        borderRight: isMobile ? 'none' : '1px solid #E5E7EB',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Header con Logo y Botón de Cierre (Móvil) o Colapso (Desktop) */}
      <div style={{ 
        padding: isMobile ? '20px' : '24px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: isMobile ? '1px solid #F3F4F6' : 'none',
        marginBottom: isMobile ? '12px' : '0'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          opacity: (isMobile || !collapsed) ? 1 : 0,
          pointerEvents: (isMobile || !collapsed) ? 'auto' : 'none',
          transition: 'opacity 0.2s ease'
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '8px', 
            background: '#111827', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '18px',
            fontWeight: 700
          }}>
            P
          </div>
          {(isMobile || !collapsed) && (
            <span style={{ 
              fontFamily: 'var(--pf-font-display)', 
              fontSize: '1.125rem', 
              fontWeight: 700, 
              color: '#111827',
              whiteSpace: 'nowrap'
            }}>
              Pathfinder
            </span>
          )}
        </div>

        {/* Botón de Acción Derecha */}
        <button
          onClick={isMobile ? onClose : onToggleCollapsed}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: 'none',
            background: '#F9FAFB',
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F3F4F6';
            e.currentTarget.style.color = '#111827';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
            e.currentTarget.style.color = '#6B7280';
          }}
          aria-label={isMobile ? "Cerrar menú" : "Colapsar sidebar"}
        >
          {isMobile ? <X size={18} /> : (collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
        </button>
      </div>

      {/* Navegación Principal */}
      <nav style={{ flex: 1, padding: isMobile ? '0 12px' : '0 12px 24px', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path, item.activePaths);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                marginBottom: '4px',
                borderRadius: '12px',
                textDecoration: 'none',
                background: active ? '#F9FAFB' : 'transparent',
                color: active ? '#111827' : '#6B7280',
                transition: 'all 0.2s ease',
                fontWeight: active ? 600 : 500,
                fontSize: '0.9375rem',
                fontFamily: 'var(--pf-font-ui)'
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.color = '#111827';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6B7280';
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                color: 'inherit'
              }}>
                {renderIcon(item.icon)}
              </div>
              
              {(isMobile || !collapsed) && (
                <span style={{ whiteSpace: 'nowrap', opacity: 1, transition: 'opacity 0.2s' }}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer con Logout */}
      <div style={{ 
        padding: isMobile ? '16px 12px' : '16px 12px 24px', 
        borderTop: '1px solid #F3F4F6' 
      }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: '#EF4444', // Color rojo para logout
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: 500,
            fontSize: '0.9375rem',
            fontFamily: 'var(--pf-font-ui)',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={20} />
          {(isMobile || !collapsed) && (
            <span>Cerrar Sesión</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;