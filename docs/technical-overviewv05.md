# 📘 Documento Técnico — Pathfinder Studio v05

**Última actualización:** 2026-09-06  
**Estado:** Funcional en producción (Cloudflare Pages) y desarrollo local.

---

## 1. Descripción general

Pathfinder Studio es una plataforma de generación audiovisual con IA. Permite a usuarios autenticados crear **videos con audio** a partir de una imagen inicial, un prompt y opcionalmente una imagen final y audio. También permite **generar imágenes estáticas** mediante el modelo Krea-2 Turbo.

El cómputo se ejecuta en notebooks de Kaggle (GPU T4) y la interfaz web orquesta la generación. Los usuarios pueden guardar temporalmente sus creaciones, visualizarlas en una biblioteca personal **“Mis creaciones”**, descargarlas, reutilizarlas y eliminarlas.

Las creaciones expiran automáticamente después de **7 días**.

---

## 2. Flujo actual del usuario

1. Registro/login con Supabase Auth.
2. Descarga de notebook personalizado (edge function).
3. Subida y ejecución del notebook en Kaggle.
4. El notebook expone una API Gradio y registra su URL en Supabase.
5. El frontend descubre la URL y muestra el estado de la estación.
6. El usuario selecciona **modalidad**:
   - **Video** → carga imagen inicial, opcional imagen final, audio, prompt, resolución, duración, seed, etc.
   - **Imagen** → escribe prompt, negative prompt, steps, resolución, aspect ratio, seed y número de imágenes.
7. Inicia la generación. El frontend observa progreso, logs y tiempo estimado.
8. Al terminar:
   - **Video** → se muestra el reproductor. Puede descargar, guardar o descartar.
   - **Imagen** → se muestran las imágenes generadas en una galería. Puede guardar cada una en “Mis creaciones”.
9. En “Mis creaciones”:
   - Galería visual con miniaturas reales, lazy loading y hover con vista previa.
   - Filtros por tipo: Todo, Videos, Fotos, Audio.
   - Agrupación cronológica por fecha.
   - Clic en una tarjeta de video → abre el detalle y **reproduce automáticamente** (`?autoplay=1`).
   - Clic en una imagen → abre el detalle con vista previa ampliable.
   - Acciones: Descargar, Reutilizar, Eliminar (con modal de confirmación).
   - Reutilizar precarga el Studio con los parámetros de esa creación.
10. Navegación por Sidebar a secciones placeholder (Projects, Assets, Academy, Station, Settings).

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
│  (videos e    │         │ (metadata)   │
│   imágenes)   │         │              │
└───────────────┘         └──────────────┘
Frontend: React 19 + TypeScript + Vite + React Router.

Backend directo: notebooks Kaggle con LTX-2.3 (video) y Krea-2 Turbo (imagen) exponiendo API Gradio.

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
│   ├── ImageGenerationForm.tsx
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
│   ├── useGeneration.ts (deprecado, lógica en GenerationContext)
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

GenerationProvider centraliza:

capability (video/image/audio)

gradioUrl, status, sessionUptime (via useRuntime)

isLoading, generationInfo, logs

videoSrc, imageSrcs

errorMsg, statusMsg

handleGenerate, handleCancel

Recuperación ante refresh, navegación y desconexión mediante /generation_status.

Persistencia de inputs del formulario en localStorage.

Reutilización de creaciones mediante sessionStorage (pf_reuse_data).

4.4 Selección de modalidad y runtime
useRuntime ahora recibe capability y filtra en Supabase:

ts
const modelType = capability === "image" ? "image" : "video";
Consulta la tabla runtimes filtrando por station_id y model_type.

Si el usuario selecciona Imagen, busca un runtime con model_type = "image".

Si selecciona Video, busca model_type = "video".

El Sidebar recibe status y sessionUptime desde el contexto para mostrar la estación correcta.

4.5 Biblioteca “Mis creaciones”
Galería en CreationsPage.tsx:

Grid responsive (4/3/2 columnas).

Agrupación por fecha, orden cronológico descendente.

Miniaturas reales con lazy loading (CreationThumbnail.tsx).

Hover con overlay, reproducción silenciosa en video y acciones contextuales.

Filtros: Todo, Videos, Fotos, Audio.

Detalle en CreationDetailPage.tsx:

Diseño “salón de trofeos”.

Autoplay cuando se navega desde una tarjeta de video (?autoplay=1).

Imagen con lightbox, audio con waveform animado.

Metadata secundaria y configuración plegable.

Modal de confirmación para eliminar.

4.6 Correcciones recientes (v05)
Parseo robusto de respuesta de Krea
El endpoint /generate de Krea devolvía una estructura de objetos (Gallery), no un array de strings.
Se implementó un parser que reconoce:

strings directos

{ url: "..." }

{ image: { url: "..." } }

{ path: "..." }

{ image: { path: "..." } }

Conversión de rutas relativas a absolutas
Las URLs de imágenes se convierten usando el origen de la URL de Gradio.

Miniaturas y detalles de imagen
CreationThumbnail y CreationDetailPage ahora priorizan creation.media_type para decidir si renderizar <img> o <video>.
Se agregó soporte para modelos Krea (krea-2-turbo) en el fallback por modelo.

Corrección de getMediaType
Se unificó la función en todos los componentes para incluir media_type y soportar Krea.

5. Backend en Kaggle (Notebooks)
5.1 Notebook LTX-2.3 (Video)
Modelo: LTX-2.3 22B Distilled (GGUF Q4_K_M)

Motor: Wan2GP

Endpoint /generate: recibe prompt, imagen inicial, imagen final, audio, seed, duration, resolution, aspect ratio, guide scale, match_audio_dur y JWT.

Registro en Supabase: model_type = "video"

5.2 Notebook Krea-2 Turbo (Imagen)
Modelo: Krea-2 Turbo (quanto int8)

Motor: Wan2GP

Endpoint /generate: recibe prompt, negative prompt, steps, aspect ratio, resolution, seed, num_images y JWT.

Respuesta: lista de imágenes (archivos temporales) que Gradio expone como URLs.

Registro en Supabase: model_type = "image"

5.3 Endpoints comunes
Endpoint	Método	Descripción
/status	GET	Devuelve station_state (READY, BUSY, ERROR, UNKNOWN).
/generation_status	GET	Devuelve generation_info con progreso, etapa, tiempos y errores.
/generate	POST	Inicia generación. Recibe parámetros específicos y JWT.
/cancel	POST	Solicita cancelación cooperativa.
/logs	POST	Devuelve líneas de log nuevas desde un seq dado.
5.4 Autenticación en el backend
/generate valida JWT de Supabase.

Compara user_id del JWT con STATION_ID configurado.

Rechaza si no coinciden.

6. Supabase
6.1 Tablas
profiles

runtimes (ahora incluye model_type)

creations (ahora incluye media_type)

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
7.1 Guardado
save-creation → genera creationId, storageKey y presigned PUT.

Frontend sube a R2 directo.

complete-creation → valida JWT, valida storageKey, verifica HEAD en R2, inserta metadata (incluyendo media_type).

7.2 Descarga
get-creation-download-url → valida ownership y genera presigned GET (expira 300s).

7.3 Eliminación
delete-creation → verifica ownership, elimina objeto R2 y registro.

7.4 Seguridad
JWT validado.

user_id nunca confiado del frontend.

storageKey validado estrictamente.

R2 privado.

HEAD antes de insertar.

8. Problemas resueltos en v05
Imágenes generadas no se mostraban

Causa: parseo incorrecto de la respuesta de Krea (Gallery).

Solución: parser robusto + conversión a URLs absolutas.

Miniaturas de imagen tratadas como video

Causa: getMediaType no priorizaba media_type.

Solución: se agregó media_type como criterio principal y soporte para Krea.

Registro de runtimes sin model_type

Solución: migración SQL y actualización de notebooks para guardar model_type.

TypeScript en GenerationContext

Solución: casting correcto de result.data a unknown[].

9. Pendientes / próximos pasos
Restringir CORS en edge functions a dominios específicos.

Implementar funcionalidad real en Projects, Assets, Academy, Station y Settings.

Implementar plantillas reutilizables.

Multi-modelo (Flux2, OmniVoice, Wan2V).

Pagos con Mercado Pago.

Persistir archivos de imagen/audio en el formulario.

Limpieza automática de registros expirados en Supabase.

Soportar audio (actualmente placeholder).

10. Guía rápida para colaboradores
Clonar el repo.

cd frontend && npm install && npm run dev.

Revisar GenerationContext.tsx para el job de generación.

Revisar useCreations.ts para persistencia.

Revisar CreationThumbnail.tsx y CreationDetailPage.tsx para la biblioteca.

Revisar Sidebar.tsx y NavIcons.tsx para navegación.

Edge functions en supabase/functions/.

No exponer secretos en frontend.

11. Variables de entorno
En el frontend (.env local o variables de Cloudflare Pages):

text
VITE_SUPABASE_URL=https://sxvgldvnxwjtvqownayr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_s_7-CQWxf29Agvxn6529YA_Z67z2ii-
La anon key pública debe usarse en frontend; la service role key solo en edge functions.

Este documento refleja el estado actual de Pathfinder Studio tras la integración de generación de imágenes con Krea-2 Turbo.
