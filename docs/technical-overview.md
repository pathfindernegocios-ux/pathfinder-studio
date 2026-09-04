📘 Documentación Técnica — Pathfinder Studio
Última actualización: 2026-09-04
Estado: Funcional en producción (Cloudflare Pages) y en desarrollo local.

1. Descripción general
Pathfinder es una plataforma que permite a los usuarios generar videos con audio a partir de una imagen, un prompt de texto y opcionalmente una imagen final y audio. El cómputo se ejecuta en notebooks de Kaggle (GPU T4) y la aplicación web actúa como interfaz para orquestar la generación.

Cada usuario registrado obtiene su propio notebook personalizado, lo sube a su cuenta de Kaggle, lo ejecuta, y luego controla la generación desde el frontend. La comunicación se realiza a través de una API de Gradio expuesta por el notebook.

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

Reproducir/descargar el video resultante.

3. Arquitectura general
text
┌───────────────┐         ┌──────────────┐         ┌───────────────┐
│   Frontend    │  HTTP   │   Supabase   │  HTTP   │  Kaggle       │
│  React + Vite │◄───────►│  Auth/DB/EF  │◄───────►│  Notebook     │
│  Cloudflare   │         │              │         │  Gradio API   │
└───────────────┘         └──────────────┘         └───────────────┘
Frontend: React + Vite + TypeScript desplegado en Cloudflare Pages.

Backend directo: notebooks de Kaggle que ejecutan modelos de generación y exponen API mediante Gradio.

Backend de soporte: Supabase para autenticación, base de datos (PostgreSQL), almacenamiento de plantillas y edge functions para personalizar notebooks.

4. Frontend
4.1 Tecnologías
React 19 + TypeScript + Vite

@gradio/client para comunicarse con la API de Gradio.

@supabase/supabase-js para autenticación y base de datos.

Estilos inline + hoja de estilos global en globalStyles.ts.

Fuentes: Bricolage Grotesque (display) e Inter (UI).

4.2 Estructura de archivos
text
frontend/src/
├── App.tsx                     # Orquestación general y UI
├── main.tsx                    # Punto de entrada de Vite
├── index.css                   # Estilos mínimos
├── components/                 # (pendiente de extraer componentes visuales)
├── hooks/
│   ├── useAuth.ts              # Autenticación y perfil
│   ├── useRuntime.ts           # Descubrimiento de URL de Gradio, estado, uptime
│   ├── useGradioClient.ts      # Cliente Gradio cacheado
│   └── useGeneration.ts        # Generación, polling, logs, cancelación, métricas
├── lib/
│   ├── supabaseClient.ts       # Cliente de Supabase
│   └── helpers.ts              # Utilidades puras (formatos, cómputos, etc.)
├── styles/
│   ├── tokens.ts               # Paleta, fuentes, estilos base
│   └── globalStyles.ts         # Hoja de estilos global
└── types/
    └── index.ts                # Tipos e interfaces compartidos
4.3 Responsabilidades de los hooks
useAuth: autenticación (login/registro/logout), sesión, perfil, pantalla de bienvenida.

useRuntime: obtiene gradio_url desde Supabase, hace polling de /status, controla uptime, crea cliente Gradio.

useGradioClient: gestiona una única conexión reutilizable con Gradio y la cierra al desmontar o cambiar URL.

useGeneration: maneja todo el ciclo de generación (/generate, /cancel, polling de progreso y logs), tiempos, errores y resultado.

4.4 Estado global
No hay biblioteca de estado global (Redux/Zustand). El estado se maneja con hooks locales en App.tsx y se comunica por props o retornos de hooks.

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

6.2 Autenticación
Supabase Auth para login/registro.

El id del usuario se usa como station_id para asociar el notebook.

6.3 Edge Functions
generate-notebook: Descarga la plantilla notebook_template.ipynb del bucket templates, reemplaza marcadores (__STATION_ID__, __SUPABASE_URL__, __SUPABASE_ANON_KEY__) y devuelve un notebook personalizado para el usuario autenticado.

6.4 Storage
Bucket templates: contiene la plantilla base del notebook.

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
   └──> Supabase Edge Function (descargar notebook personalizado)
El frontend usa @gradio/client para interactuar con la URL *.gradio.live.

La conexión con Gradio se cachea y se reutiliza para evitar fugas de sockets.

El frontend valida que el estado del runtime sea READY antes de habilitar la generación.

8. Variables de entorno
En el frontend (.env local o variables de Cloudflare Pages):

text
VITE_SUPABASE_URL=https://sxvgldvnxwjtvqownayr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_s_7-CQWxf29Agvxn6529YA_Z67z2ii-
Importante: la anon key pública (sb_publishable_...) debe usarse en el frontend. La service role key (eyJ...) solo en el backend/edge functions.

9. Decisiones técnicas relevantes
Refactor estructural del frontend: se separaron hooks y módulos sin alterar comportamiento.

Cliente Gradio único y cacheado: evita el error ERR_INSUFFICIENT_RESOURCES por acumulación de sockets.

Estado tras error: el backend vuelve a READY para permitir reintentos sin reiniciar.

Cancelación cooperativa: el backend revisa una señal entre pasos del modelo.

Tiempos de generación: se calculan con started_at y finished_at del backend, no solo con cronómetro local.

Plantilla de notebook: se personaliza mediante edge function para evitar exponer secretos.

10. Pendientes / próximos pasos
Extraer componentes visuales (FrameChip, AudioChip, Sidebar, etc.) a components/.

Activar sidebar real con navegación (Projects, Generations, Assets, etc.).

Persistir historial de generaciones en Supabase.

Implementar pasarela de pago (Mercado Pago).

Landing page pública y Academy.

Posible migración de cómputo de Kaggle a RunPod.

11. Guía rápida para nuevo colaborador
Clonar el repo: git clone https://github.com/pathfindernegocios-ux/pathfinder-studio.git

Ir a frontend/ y ejecutar npm install y npm run dev.

Copiar .env con las variables indicadas.

Revisar los hooks en src/hooks/ para entender la lógica.

El flujo principal de generación está en useGeneration.ts.

La conexión con Gradio está en useGradioClient.ts y useRuntime.ts.

No exponer la service role key en el frontend.