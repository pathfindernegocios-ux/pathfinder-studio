import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/theme'

// Inicializar el tema ANTES del primer render para evitar flash.
// Lee localStorage y aplica data-theme="dark" si corresponde.
initTheme()

// StrictMode omitido a proposito: con React 19 + React Router v7, el
// doble-mount de StrictMode rompe la suscripcion del router al history
// (la URL cambia pero <Routes> no reacciona). Se puede reactivar cuando
// react-router publique el fix.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
