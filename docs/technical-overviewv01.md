📘 Documentación Técnica — Pathfinder Studio
Última actualización: 2026-09-05
Estado: Funcional en producción (Cloudflare Pages) y en desarrollo local.

1. Descripción general
Pathfinder es una plataforma que permite a los usuarios generar videos con audio a partir de una imagen, un prompt de texto y opcionalmente una imagen final y audio. El cómputo se ejecuta en notebooks de Kaggle (GPU T4) y la aplicación web actúa como interfaz para orquestar la generación.

Cada usuario registrado obtiene su propio notebook personalizado, lo sube a su cuenta de Kaggle, lo ejecuta, y luego controla la generación desde el frontend. La comunicación se realiza a través de una API de Gradio expuesta por el notebook.

Además, los usuarios pueden guardar temporalmente sus creaciones en la nube, verlas en una sección “Mis creaciones”, descargarlas y eliminarlas.

2. Flujo actual del usuario
El usuario se registra/inicia sesión en Pathfinder Studio.

Descarga su notebook personalizado (generado por una edge function de Supabase).

Sube el notebook a su cuenta de Kaggle y lo ejecuta (Run All).

El notebook carga el modelo LTX-2.3, arranca un servidor Gradio con share=True y registra la URL pública en Supabase.

El frontend consulta la URL de Gradio asociada al usuario y muestra el estado de la estación.

Cuando el estado es READY, el usuario puede:

Subir una imagen inicial.

Opcionalmente una imagen final.

Opcionalmente un audio.

Escribir un prompt de video.

Ajustar resolución, duración, aspect ratio, seed, prompt influence.

Generar video.

Ver progreso, logs y tiempo estimado.

Cancelar la generación.

Guardar la generación en “Mis creaciones”.

Descartar el resultado si no desea conservarlo.

En “Mis creaciones”:

Ver todas las creaciones guardadas.

Descargar el video mediante URL firmada temporal.

Eliminar la creación (borra archivo en R2 y registro en Supabase).

Las creaciones expiran automáticamente después de 7 días.

3. Arquitectura general
text
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
Frontend: React + Vite + TypeScript desplegado en Cloudflare Pages.

Backend directo: notebooks de Kaggle que ejecutan modelos de generación y exponen API mediante Gradio.

Backend de soporte: Supabase para autenticación, base de datos (PostgreSQL), edge functions.

Almacenamiento de creaciones: Cloudflare R2 (privado, con presigned URLs).

4. Frontend
4.1 Tecnologías
React 19 + TypeScript + Vite

@gradio/client para comunicarse con la API de Gradio.

@supabase/supabase-js para autenticación y base de datos.

react-router-dom para navegación.

Estilos inline + hoja de estilos global en globalStyles.ts.

Fuentes: Bricolage Grotesque (display) e Inter (UI).

4.2 Estructura de archivos
text
frontend/src/
├── App.tsx                     # Enrutador principal con React Router
├── main.tsx                    # Punto de entrada de Vite
├── index.css                   # Estilos mínimos
├── components/
│   ├── FrameChip.tsx
│   ├── AudioChip.tsx
│   ├── Sidebar.tsx
│   ├── AuthScreen.tsx
│   ├── WelcomeScreen.tsx
│   ├── GenerationProgress.tsx
│   └── GenerationResult.tsx
├── pages/
│   ├── StudioPage.tsx          # Página de generación
│   └── CreationsPage.tsx       # Vista "Mis creaciones"
├── hooks/
│   ├── useAuth.ts
│   ├── useRuntime.ts
│   ├── useGradioClient.ts
│   ├── useGeneration.ts
│   └── useCreations.ts         # Persistencia de creaciones
├── lib/
│   ├── supabaseClient.ts
│   └── helpers.ts
├── styles/
│   ├── tokens.ts
│   └── globalStyles.ts
└── types/
    └── index.ts
4.3 Responsabilidades de los hooks
useAuth: autenticación (login/registro/logout), sesión, perfil.

useRuntime: obtiene gradio_url desde Supabase, hace polling de /status, controla uptime, crea cliente Gradio.

useGradioClient: gestiona una única conexión reutilizable con Gradio y la cierra al desmontar o cambiar URL.

useGeneration: maneja todo el ciclo de generación (/generate, /cancel, polling de progreso y logs), tiempos, errores y resultado.

useCreations: gestiona la persistencia posterior a la generación:

saveCreation() → obtiene presigned URL, sube a R2, completa metadata.

getCreations() → lista creaciones del usuario.

deleteCreation() → elimina objeto y registro.

getDownloadUrl() → obtiene URL firmada de descarga.

4.4 Estado global
No hay biblioteca de estado global (Redux/Zustand). El estado se maneja con hooks locales y se comunica por props o retornos de hooks.

5. Backend en Kaggle (Notebook)
5.1 Propósito
Ejecutar el modelo LTX-2.3 22B Distilled (GGUF Q4_K_M) con offloading mediante mmgp para caber en una GPU T4 (14.6 GB VRAM). Expone una API de Gradio para que el frontend pueda controlar la generación.

5.2 Endpoints expuestos por Gradio
Endpoint	Método	Descripción
/status	GET	Devuelve station_state (READY, BUSY, ERROR, UNKNOWN).
/generation_status	GET	Devuelve generation_info con progreso, etapa, tiempos y errores.
/generate	POST	Inicia generación. Recibe prompt, archivos, parámetros y JWT.
/cancel	POST	Solicita cancelación cooperativa de la generación actual.
/logs	POST	Devuelve líneas de log nuevas desde un seq dado (polling incremental).
5.3 Autenticación en el backend
/generate valida un token JWT de Supabase.

El backend compara el user_id del JWT con STATION_ID configurado en el notebook.

Si no coinciden, rechaza la solicitud.

5.4 Registro de la URL pública
Al iniciar Gradio con share=True, obtiene una URL *.gradio.live. Luego la registra en la tabla runtimes de Supabase con el STATION_ID correspondiente.

6. Supabase
6.1 Tablas principales
profiles: Almacena el perfil del usuario, incluyendo station_id.

runtimes: Registra las URLs de Gradio activas por station_id.

creations: Almacena los metadatos de las creaciones guardadas (prompt, configuración, storage_key, expires_at, etc.).

6.2 Autenticación
Supabase Auth para login/registro. El id del usuario se usa como station_id para asociar el notebook.

6.3 Edge Functions
generate-notebook: Descarga la plantilla notebook_template.ipynb del bucket templates, reemplaza marcadores y devuelve un notebook personalizado.

save-creation: Valida JWT, genera creationId y storageKey, y devuelve una presigned PUT URL para subir el video directo a R2.

complete-creation: Valida JWT, valida storageKey, verifica existencia del objeto en R2 (HEAD), e inserta metadata en creations.

get-creation-download-url: Valida JWT, verifica ownership, y genera una presigned GET URL temporal.

delete-creation: Valida JWT, verifica ownership, elimina el objeto de R2 y el registro en Supabase.

6.4 Storage
Bucket templates: contiene la plantilla base del notebook.

Bucket generations: (opcional) no se usa para almacenar los videos; los archivos van a Cloudflare R2.

6.5 Cloudflare R2
Bucket privado pathfinder-generations.

Presigned URLs para subir/descargar sin exponer credenciales.

Regla de ciclo de vida para eliminar objetos después de 7 días.

CORS configurado para los dominios permitidos.

7. Comunicación Frontend ↔ Backend
text
Frontend (React)
   │
   ├──> Supabase Auth (login/registro/sesión)
   │
   ├──> Supabase DB (obtener profile.station_id)
   │
   ├──> Supabase DB (obtener gradio_url desde runtimes)
   │
   ├──> Gradio API (status, generation_status, generate, cancel, logs)
   │
   ├──> Supabase Edge Functions (descargar notebook, guardar creación, etc.)
   │
   └──> Cloudflare R2 (presigned URLs para subir/descargar videos)
El frontend usa @gradio/client para interactuar con la URL *.gradio.live.

La conexión con Gradio se cachea y se reutiliza para evitar fugas de sockets.

El frontend valida que el estado del runtime sea READY antes de habilitar la generación.

Para guardar una creación, el frontend:

Llama a save-creation y recibe uploadUrl.
Sube el video directamente a R2 con PUT.
Llama a complete-creation para guardar metadata.
8. Variables de entorno
En el frontend (.env local o variables de Cloudflare Pages):

text
VITE_SUPABASE_URL=https://sxvgldvnxwjtvqownayr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_s_7-CQWxf29Agvxn6529YA_Z67z2ii-
En Supabase Edge Functions (secrets):

text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
Importante: la anon key pública (sb_publishable_...) debe usarse en el frontend. La service role key y las credenciales R2 solo en el backend/edge functions.

9. Decisiones técnicas relevantes
Refactor estructural del frontend: se separaron hooks y componentes para mantener el código modular.

Cliente Gradio único y cacheado: evita el error ERR_INSUFFICIENT_RESOURCES por acumulación de sockets.

Presigned URLs para R2: el frontend interactúa directamente con R2 para subir/descargar, sin pasar por Supabase.

aws4fetch para firmar URLs: reemplaza al SDK de AWS y a la firma manual, reduciendo cold start.

Imports dinámicos en edge functions: el preflight OPTIONS responde inmediatamente sin cargar dependencias pesadas.

Verificación HEAD en complete-creation: garantiza que un registro en Supabase siempre tenga su archivo correspondiente en R2.

RLS y grants: la tabla creations está protegida y los roles tienen los privilegios necesarios.

Expiración de 7 días: los objetos en R2 se eliminan automáticamente mediante lifecycle rule; los registros en Supabase tienen expires_at.

10. Pendientes / próximos pasos
Restringir CORS en edge functions a dominios específicos (actualmente * en algunas).

Probar flujo completo en producción (descarga/eliminación).

Implementar limpieza automática de registros expirados en Supabase.

Activar más secciones del Sidebar (Projects, Assets, Academy, etc.).

Implementar pasarela de pago (Mercado Pago).

Landing page pública y Academy.

Posible migración de cómputo de Kaggle a RunPod.

Posible implementación de plantillas reutilizables.

11. Guía rápida para nuevo colaborador
Clonar el repo: git clone https://github.com/pathfindernegocios-ux/pathfinder-studio.git

Ir a frontend/ y ejecutar npm install y npm run dev.

Copiar .env con las variables indicadas.

Revisar los hooks en src/hooks/ para entender la lógica.

El flujo principal de generación está en useGeneration.ts.

La persistencia de creaciones está en useCreations.ts y las edge functions en supabase/functions/.

La conexión con Gradio está en useGradioClient.ts y useRuntime.ts.

No exponer la service role key ni las credenciales R2 en el frontend.