// src/components/WelcomeScreen.tsx
import React from 'react';

interface WelcomeScreenProps {
  onEnter?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#0f0f0f', 
      color: '#fff',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Bienvenido a Pathfinder</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '600px', color: '#aaa' }}>
        Tu estación de creación con IA está lista. Al continuar, aceptarás los términos de uso y comenzarás tu sesión en el estudio.
      </p>
      
      <button
        onClick={() => {
          console.log("Botón presionado, llamando a onEnter...");
          if (onEnter) onEnter();
        }}
        style={{
          padding: '16px 32px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: '#fff',
          background: '#E0B84B', // Color accent
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        Entrar al Estudio 🎨
      </button>
    </div>
  );
};

export default WelcomeScreen;