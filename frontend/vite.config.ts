import svgr from "vite-plugin-svgr";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svgr(),
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Separa el bundle por dominio. Cada chunk se cachea por separado,
        // así actualizar una página no invalida el cache de react o icons.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'router';
          if (id.includes('react-dom')) return 'react-vendor';
          if (/node_modules\/react\//.test(id)) return 'react-vendor';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('@gradio')) return 'gradio';
          if (id.includes('zustand')) return 'zustand';
          // NO agrupamos iconos ni motion: manualChunks desactiva el
          // tree-shaking dentro del paquete. Sin chunk manual, Rollup
          // tree-shakea los iconos que no se usan (baja ~180 KB en phosphor)
          // y deja que motion viva dentro del chunk lazy que lo importa.
        },
      },
    },
  },
})
