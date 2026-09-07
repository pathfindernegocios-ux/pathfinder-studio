// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { session, profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { path: '/studio', label: 'Studio', icon: '🎨' },
    { path: '/projects', label: 'Projects', icon: '📁' },
    { path: '/creations', label: 'Mis creaciones', icon: '🖼️' },
    { path: '/assets', label: 'Assets', icon: '📦' },
    { path: '/academy', label: 'Academy', icon: '🎓' },
    { path: '/station', label: 'Station', icon: '🖥️' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: collapsed ? '80px' : '280px', background: 'var(--pf-bg-secondary)', borderRight: '1px solid var(--pf-border-subtle)', transition: 'width 0.3s ease', zIndex: 40, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--pf-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!collapsed && (
          <span style={{ fontFamily: 'var(--pf-font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--pf-text-primary)', letterSpacing: '-0.03em' }}>Pathfinder</span>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', marginBottom: '4px', borderRadius: '12px', background: isActive ? 'var(--pf-glass-surface)' : 'transparent', border: isActive ? '1px solid var(--pf-border-default)' : '1px solid transparent', transition: 'all 0.2s ease', color: isActive ? 'var(--pf-text-primary)' : 'var(--pf-text-secondary)' }}>
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              {!collapsed && <span style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '0.9375rem', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--pf-border-subtle)', background: 'var(--pf-glass-surface)', backdropFilter: 'blur(24px) saturate(180%)' }}>
        {session && profile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--pf-text-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--pf-font-ui)', fontSize: '1rem', fontWeight: 600 }}>
              {(profile.email || profile.user_metadata?.email || 'U')[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--pf-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.email?.split('@')[0] || 'Usuario'}
                </div>
                <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '0.75rem', color: 'var(--pf-text-muted)' }}>Online</div>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--pf-border-default)', borderRadius: '8px', padding: '6px 12px', fontFamily: 'var(--pf-font-ui)', fontSize: '0.75rem', color: 'var(--pf-text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                Salir
              </button>
            )}
          </div>
        ) : (
          <Link to="/auth" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'var(--pf-text-primary)', color: '#FFFFFF', borderRadius: '12px', fontFamily: 'var(--pf-font-ui)', fontSize: '0.875rem', fontWeight: 600 }}>
            <span>🔐</span>
            {!collapsed && <span>Iniciar sesión</span>}
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;