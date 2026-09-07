# PATHFINDER STUDIO v07 - VISUAL REBUILD AGENT CONTEXT

## 🎯 OBJETIVO
Rebuild visual total del frontend. Eliminar paleta verde anterior. Implementar estética "Premium AI" (tipo Linear/Runway/Vercel).
Enfoque inicial: **Sistema Light Mode completo**. Dark mode vendrá después.

## 🎨 SISTEMA DE DISEÑO LIGHT MODE
- **Tipografía**:
  - UI (Títulos, botones, labels): 'Cal Sans', sans-serif.
  - Prompt/Input creativo: 'Satoshi', sans-serif (geométrica, limpia).
  - Importar via Fontshare CDN o Google Fonts.
- **Paleta Light**:
  - Fondo principal: #FFFFFF (Blanco puro).
  - Superficies secundarias: #FAFAFA.
  - Texto primario: #0A0A0A (Negro casi puro).
  - Texto secundario: #525252.
  - Bordes: #E5E5E5 (Gris muy sutil).
  - Acento: Monocromático (Botón Generar = #0A0A0A sólido).
- **Glassmorphism Premium**:
  - Efecto "cristal flotante" sobre fondo blanco.
  - `backdrop-filter: blur(24px) saturate(180%)`.
  - Fondo: rgba(255, 255, 255, 0.75).
  - Borde: 1px solid rgba(255, 255, 255, 0.6).
  - Sombra: 0 24px 48px -12px rgba(0, 0, 0, 0.12).
  - Border-radius: 24px o 32px.

## 🏗️ ARQUITECTURA (PROHIBIDO MODIFICAR)
- React 19 + TypeScript + Vite + React Router.
- `GenerationContext.tsx`: NO tocar lógica interna, solo adaptar UI si es estrictamente necesario.
- `useRuntime.ts`, `useCreations.ts`, `useGradioClient.ts`: INTACTOS.
- Supabase Auth/DB/Edge Functions: INTACTAS.
- Cloudflare R2 integration: INTACTA.
- Payloads de Gradio (Krea/Flux/LTX): INTACTOS.

## 📂 COMPONENTES CLAVE A REFACTORIZAR
1. `StudioPage.tsx`: Nuevo layout "Canvas + Floating Command Center".
2. `Sidebar.tsx`: Adaptar colores a tokens nuevos, mantener estructura.
3. `ImageGenerationForm.tsx`: Integrar en Command Center, tarjetas glass.
4. `CreationThumbnail.tsx` / `CreationsPage.tsx`: Tarjetas sin bordes duros, sombras sutiles.
5. `tokens.ts` y `globalStyles.ts`: Reescritura completa.

## ⚠️ REGLAS CRÍTICAS
- NO usar librerías de UI externas (Material, Bootstrap, Mantine). Solo CSS nativo/Tailwind.
- TypeScript estricto en todos los cambios.
- Usar tokens.ts para TODOS los colores/espaciados/radii.
- Mantener responsive.
- Preservar accesibilidad (aria-labels, focus states visibles).
- Commit atómico por cada fase completada.
