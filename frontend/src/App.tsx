// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GenerationProvider } from './context/GenerationContext';
import { useAuth } from './hooks/useAuth';
// Páginas Principales
import StudioPage from './pages/StudioPage';
import CreationsPage from './pages/CreationsPage';
import CreationDetailPage from './pages/CreationDetailPage';
// Placeholders
import { ProjectsPage } from './pages/placeholders/ProjectsPage';
import { AssetsPage } from './pages/placeholders/AssetsPage';
import { AcademyPage } from './pages/placeholders/AcademyPage';
import StationPage from './pages/placeholders/StationPage';
import SettingsPage from './pages/placeholders/SettingsPage';
// Componentes
import AuthScreen from './components/AuthScreen';

// Componente para rutas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  
  // Si no hay sesión, redirigir a la pantalla de bienvenida/auth
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { profile } = useAuth();
  const stationId = profile?.station_id || null;

  return (
    <GenerationProvider stationId={stationId}>
      <Routes>
        {/* Ruta pública de Bienvenida/Auth */}
        <Route path="/auth" element={<AuthScreen />} />
        
        {/* Rutas Protegidas (requieren login) */}
        <Route path="/studio" element={
          <ProtectedRoute>
            <StudioPage />
          </ProtectedRoute>
        } />
        <Route path="/creations" element={
          <ProtectedRoute>
            <CreationsPage />
          </ProtectedRoute>
        } />
        <Route path="/creations/:id" element={
          <ProtectedRoute>
            <CreationDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        } />
        <Route path="/assets" element={
          <ProtectedRoute>
            <AssetsPage />
          </ProtectedRoute>
        } />
        <Route path="/academy" element={
          <ProtectedRoute>
            <AcademyPage />
          </ProtectedRoute>
        } />
        <Route path="/station" element={
          <ProtectedRoute>
            <StationPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        
        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </GenerationProvider>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;