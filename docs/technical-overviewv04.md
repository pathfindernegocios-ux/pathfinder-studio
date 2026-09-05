# 📘 Documento Técnico — Pathfinder Studio v04

**Última actualización:** 2026-09-05  
**Estado:** Funcional en producción (Cloudflare Pages) y desarrollo local.

---

## 1. Descripción general

Pathfinder Studio es una plataforma de generación audiovisual con IA. Permite a usuarios autenticados crear videos a partir de una imagen inicial, un prompt y opcionalmente una imagen final y audio. El cómputo se ejecuta en notebooks de Kaggle (GPU T4) y la interfaz web orquesta la generación.

Los usuarios pueden **guardar temporalmente** sus creaciones, visualizarlas en una biblioteca personal **“Mis creaciones”**, descargarlas, reutilizarlas y eliminarlas. Las creaciones expiran automáticamente después de **7 días**.

Además, la aplicación cuenta con un **Sidebar real** con navegación entre secciones (Studio, Projects, Mis creaciones, Assets, Academy, Station, Settings), cada una con su ruta propia.

---

## 2. Flujo actual del usuario

1. Registro/login con Supabase Auth.
2. Descarga de notebook personalizado (edge function).
3. Subida y ejecución del notebook en Kaggle.
4. El notebook expone una API Gradio y registra su URL en Supabase.
5. El frontend descubre la URL y muestra el estado de la estación.
6. El usuario configura prompt, imagen inicial, imagen final, audio, resolución, duración, seed, etc.
7. Inicia la generación. El frontend observa progreso, logs y tiempo estimado.
8. Al terminar, puede:
   - **Descargar** el video.
   - **Guardar** en “Mis creaciones”.
   - **Descartar** el resultado.
9. En “Mis creaciones”:
   - Galería visual con miniaturas reales, lazy loading y hover con vista previa.
   - Filtros por tipo: Todo, Videos, Fotos, Audio.
   - Agrupación cronológica por fecha.
   - Clic en una tarjeta de video → abre el detalle y **reproduce automáticamente** (`?autoplay=1`).
   - Detalle tipo “salón de trofeos”: la obra como protagonista, metadata secundaria y configuración plegable.
   - Acciones: Descargar, Reutilizar, Eliminar (con modal de confirmación).
   - Reutilizar precarga el Studio con los parámetros de esa creación.
10. Navegación por Sidebar a secciones placeholder (Projects, Assets, Academy, Station, Settings) que preparan futuras funcionalidades.

---

## 3. Arquitectura general

```text
┌───────────────┐         ┌──────────────┐         ┌───────────────┐
│   Frontend    │  HTTP   │   Supabase   │  HTTP   │  Kaggle       │
│  React + Vite │◄───────►│  Auth/DB/EF  │◄───────►│  Notebook     │
│  Cloudflare   │         │              │         │  Gradio API   │
└───────┬───────┘         └──────┬───────┘         └───────────────┘
        │                        │
        │ presigned URLs         │
        ▼                        ▼
┌───────────────┐         ┌──────────────┐
│  Cloudflare R2│         │ PostgreSQL   │
│  (videos)     │         │ (metadata)   │
└───────────────┘         └──────────────┘
Frontend: React 19 + TypeScript + Vite + React Router.

Backend directo: notebooks Kaggle con LTX-2.3 y Gradio.

Backend de soporte: Supabase Auth, PostgreSQL, Edge Functions.

Almacenamiento de creaciones: Cloudflare R2 (privado, presigned URLs).

Estado de generación: desacoplado mediante GenerationProvider.

Navegación: Sidebar real con iconos SVG y rutas activas.

4. Frontend
4.1 Tecnologías
React 19 + TypeScript + Vite

@gradio/client

@supabase/supabase-js

react-router-dom

Estilos inline + globalStyles.ts

Fuentes: Bricolage Grotesque e Inter

4.2 Estructura de archivos
text
frontend/src/
├── App.tsx
├── main.tsx
├── index.css
├── components/
│   ├── FrameChip.tsx
│   ├── AudioChip.tsx
│   ├── Sidebar.tsx
│   ├── AuthScreen.tsx
│   ├── WelcomeScreen.tsx
│   ├── GenerationProgress.tsx
│   ├── GenerationResult.tsx
│   ├── CreationThumbnail.tsx
│   └── NavIcons.tsx
├── pages/
│   ├── StudioPage.tsx
│   ├── CreationsPage.tsx
│   ├── CreationDetailPage.tsx
│   └── placeholders/
│       ├── ProjectsPage.tsx
│       ├── AssetsPage.tsx
│       ├── AcademyPage.tsx
│       ├── StationPage.tsx
│       └── SettingsPage.tsx
├── context/
│   └── GenerationContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useRuntime.ts
│   ├── useGradioClient.ts
│   ├── useGeneration.ts
│   └── useCreations.ts
├── lib/
│   ├── supabaseClient.ts
│   └── helpers.ts
├── styles/
│   ├── tokens.ts
│   └── globalStyles.ts
└── types/
    └── index.ts
4.3 Estado de generación: GenerationProvider
La generación es un Job del sistema, no un estado local de StudioPage.

GenerationProvider centraliza estado, polling y recuperación.

StudioPage solo consume el contexto.

Recuperación ante refresh, navegación y desconexión mediante /generation_status.

Persistencia de inputs del formulario en localStorage.

Reutilización de creaciones mediante sessionStorage (pf_reuse_data).

4.4 Navegación (Sidebar real)
Todos los items del Sidebar están habilitados y navegan a su ruta.

Iconos SVG personalizados en NavIcons.tsx, sin emojis.

Rutas activas:

/studio

/projects

/creations

/assets

/academy

/station

/settings

Páginas placeholder en src/pages/placeholders/ que servirán de base para futuras funcionalidades.

4.5 Biblioteca “Mis creaciones”
Galería en CreationsPage.tsx:

Grid responsive (4/3/2 columnas).

Agrupación por fecha, orden cronológico descendente.

Miniaturas reales con lazy loading (CreationThumbnail.tsx).

Hover con overlay, reproducción silenciosa en video y acciones contextuales.

Filtros: Todo, Videos, Fotos, Audio.

Detalle en CreationDetailPage.tsx:

Diseño “salón de trofeos”: la obra en un escenario protagonista.

Autoplay cuando se navega desde una tarjeta de video (?autoplay=1).

Imagen con lightbox, audio con waveform animado.

Metadata secundaria y configuración plegable.

Modal de confirmación para eliminar (sin confirm()).

Acción Reutilizar que prellena Studio.

5. Backend en Kaggle (Notebook)
Sin cambios relevantes en esta iteración.

Endpoints Gradio:

/status

/generation_status

/generate

/cancel

/logs

El backend es la fuente autoritativa de verdad.

6. Supabase
6.1 Tablas
profiles

runtimes

creations

6.2 Edge Functions
generate-notebook

save-creation

complete-creation

get-creation-download-url

delete-creation

6.3 Cloudflare R2
Bucket privado pathfinder-generations.

Presigned URLs para subir/descargar.

CORS configurado con orígenes específicos.

Lifecycle rule de 7 días.

7. Persistencia de creaciones
Flujo de guardado:

save-creation → genera creationId, storageKey y presigned PUT.

Frontend sube a R2 directo.

complete-creation → valida JWT, valida storageKey, verifica HEAD en R2, inserta metadata.

Flujo de descarga:

get-creation-download-url → valida ownership y genera presigned GET (expira 300s).

Flujo de eliminación:

delete-creation → verifica ownership, elimina objeto R2 y registro.

Seguridad:

JWT validado.

user_id nunca confiado del frontend.

storageKey validado estrictamente.

R2 privado.

HEAD antes de insertar.

8. Problemas resueltos recientemente
8.1 Miniaturas no aparecían
Causa: carrera de React StrictMode por funciones sin memoizar y cancelación inadecuada.

Solución: useCallback en useCreations, fetchStartedRef y isMountedRef en CreationThumbnail.

Resultado: miniaturas reales cargan correctamente.

8.2 Autoplay al hacer clic en video
Solución: las tarjetas de video navegan a /creations/:id?autoplay=1.

El detalle lee el query param y reproduce automáticamente.

8.3 Detalle poco atractivo
Rediseño completo tipo “salón de trofeos”, con la obra como protagonista, acciones discretas y configuración plegable.

8.4 Emojis en Sidebar
Causa: iconos basados en caracteres Unicode que se veían poco profesionales.

Solución: se crearon iconos SVG personalizados (NavIcons.tsx) y se actualizó Sidebar.tsx.

Resultado: navegación limpia y coherente con la identidad Pathfinder.

9. Pendientes / próximos pasos
Restringir CORS en edge functions a dominios específicos (al final del desarrollo).

Implementar funcionalidad real en Projects, Assets, Academy, Station y Settings.

Implementar plantillas reutilizables.

Multi-modelo (Flux2, OmniVoice, Wan2V).

Pagos con Mercado Pago.

Persistir archivos de imagen/audio en el formulario.

Limpieza automática de registros expirados en Supabase.

10. Guía rápida para colaboradores
Clonar el repo.

cd frontend && npm install && npm run dev.

Revisar GenerationContext.tsx para el job de generación.

Revisar useCreations.ts para persistencia.

Revisar CreationThumbnail.tsx y CreationDetailPage.tsx para la biblioteca.

Revisar Sidebar.tsx y NavIcons.tsx para navegación.

Edge functions en supabase/functions/.

No exponer secretos en frontend.

Este documento es el baseline actual de Pathfinder Studio.
