Pathfinder Studio - Documentación Técnica Maestra (v0.8 - Estado Real)

Nota: Este documento refleja estrictamente el estado actual del código en producción/desarrollo (Rama main / feat/visual-rebuild-v07). Cualquier funcionalidad marcada como "Futura" o "Roadmap" no está implementada aún.

1. Visión General del Proyecto

Pathfinder Studio es una plataforma SaaS de generación de contenido multimedia (video, imagen) impulsada por IA. Utiliza una arquitectura de notebooks remotos (Stations) alojados actualmente en Kaggle (GPUs T4), que se registran dinámicamente en la base de datos para atender solicitudes del frontend.

Propuesta de Valor

- Interfaz Unificada: Un panel de control ("Floating Command Center") que adapta sus controles según el modelo seleccionado.
- Arquitectura Serverless Híbrida: Frontend React estático + Backends efímeros (Notebooks Gradio) que se activan bajo demanda.
- Modelos Actuales: LTX-2.3 (Video), Krea 2 Turbo (Imagen Estándar), Flux 2 Klein 4B (Imagen Avanzada).

2. Arquitectura del Sistema

2.1. Frontend (React + TypeScript)

- Framework: React 18+ con TypeScript estricto.
- Enrutado: react-router-dom v6+.
- Estilizado: CSS Nativo con Variables CSS (var(--pf-*)) definidas en src/index.css. No se usan librerías de CSS-in-JS ni Tailwind.
- Gestión de Estado:
  - GenerationContext.tsx: Único contexto global. Maneja la selección de modelos (imageModels, videoModels), colas de generación y comunicación con los endpoints de los notebooks.
  - useAuth.ts: Hook personalizado para gestión de sesión (JWT) y perfil de usuario vía Supabase. No existe AuthContext.tsx.
  - Layout: Manejado directamente en App.tsx mediante el componente ProtectedLayout. No existe LayoutContext.tsx.

2.2. Backend & Infraestructura (Python + Gradio + Kaggle)

- Hosting de Modelos: Notebooks ejecutándose en Kaggle Kernels (GPUs NVIDIA T4 x2).
- Comunicación:
  - Polling HTTP: El frontend consulta periódicamente los endpoints /status, /generation_status y /logs expuestos por cada notebook Gradio. No se usa Supabase Realtime.
  - Registro de Stations: Los notebooks se registran al iniciar en la tabla runtimes de Supabase indicando su URL pública, estado y modelo cargado.
- Librería Core: Wan2GP (optimización de memoria, cuantización INT8/GGUF, offload profiles).

2.3. Base de Datos (Supabase PostgreSQL)

Tablas Principales:

- profiles: Metadatos de usuarios (email, station_id asignado).
- creations: Historial de generaciones (prompt, urls de salida, tipo de medio, timestamps).
- runtimes: Tabla dinámica de "corazones latentes". Registra las URLs activas de los notebooks.
- stations: Configuración estática de hardware y pertenencia.

3. Flujos de Trabajo (Pipelines)

3.1. Pipeline de Imagen

- Selección de Modelo:
  - Por defecto: Krea 2 Turbo (Rápido, estilo artístico).
  - Alternativa: Flux 2 Klein 4B (Alta fidelidad, soporta referencias y máscaras).
  - Nota: El selector siempre es visible, pero solo los modelos cargados en el backend están activos (indicador verde).
- Configuración:
  - Krea: Style Preset, Steps, Resolución, Aspect Ratio.
  - Flux: Ref Mode (Sujeto/Escenario), Inpainting Method, Guide Scale, Embedded Guidance.
- Ejecución: Frontend envía payload a la Station disponible -> Notebook procesa -> Retorna URL de imagen.

3.2. Pipeline de Video (LTX-2.3)

- Entradas: Prompt, Start Frame (opcional), End Frame (opcional), Audio (opcional).
- Parámetros: Duración predefinida (ej. "5s (121 frames)"), Resolución (720p/1080p), Guide Scale.
- Procesamiento:
  - Generación de latents con condicionamiento de audio y frames clave.
  - Muxing de audio/video con FFmpeg dentro del notebook.
- Salida: Archivo MP4 listo para reproducción.

4. Estructura de Directorios Real

src/
├── components/
│   ├── FloatingCommandCenter.tsx      # Centro de control adaptable (Core UI)
│   ├── Sidebar.tsx                    # Navegación principal
│   ├── AuthScreen.tsx                 # Login/Registro
│   ├── ImageGenerationForm.tsx        # Formulario específico de imagen
│   ├── ImageGenerationResult.tsx      # Visualizador de resultados
│   └── ...
├── context/
│   └── GenerationContext.tsx          # ÚNICO contexto global (Modelos + Cola)
├── hooks/
│   ├── useCreations.ts                # Fetch de historial desde Supabase
│   ├── useAuth.ts                     # Gestión de sesión JWT
│   └── useRuntime.ts                  # Descubrimiento y polling de Stations
├── pages/
│   ├── StudioPage.tsx                 # Vista principal (Canvas + Sidebar)
│   ├── CreationsPage.tsx              # Galería de usuarios
│   ├── CreationDetailPage.tsx         # Detalle de una creación
│   └── placeholders/                  # Vistas futuras (Projects, Assets, Academy, Station, Settings)
├── lib/
│   └── supabaseClient.ts              # Configuración del cliente Supabase
└── index.css                          # Variables CSS (--pf-*) y reset global

Nota: No existen las carpetas scripts/ ni archivos AuthContext.tsx, LayoutContext.tsx en esta versión.

5. Convenciones de Desarrollo (Vigentes)

5.1. Tipado Estricto

- Todo componente debe definir interfaces explícitas para sus props.
- Prohibido el uso de any. Usar tipos genéricos o uniones específicas.
- Los eventos de formularios deben tiparse correctamente (React.ChangeEvent<HTMLInputElement>, etc.).

5.2. Gestión de Estado

- Context API Limitada: Solo GenerationContext es global. El resto se maneja con estados locales (useState) o hooks personalizados.
- Polling Manual: El estado de la generación se actualiza consultando activamente el endpoint del notebook cada X segundos.

5.3. Estilos

- Variables CSS: Uso exclusivo de var(--pf-bg-primary), var(--pf-text-secondary), etc.
- Glassmorphism: Clase utilitaria .pf-glass-panel definida en index.css.
- Layout: Grid CSS rígido en StudioPage (280px 1fr) para separar Sidebar y Canvas.

5.4. Backend (Notebooks)

- Logs en Buffer: Los notebooks mantienen un buffer en memoria (log_buffer) accesible vía API para el frontend.
- Cancelación Cooperativa: Uso de threading.Event() para detener bucles de generación sin bloquear la GPU.
- Registro Automático: Al hacer demo.launch(), el script debe hacer POST a /rest/v1/runtimes en Supabase.

6. Roadmap Técnico

Fase Actual (v0.8 - Consolidación)

- Refactorización completa del layout (Grid/Flex).
- Implementación de selectores de modelo estáticos con detección de estado "Ready".
- Integración estable de pipelines LTX-2.3 y Flux 2 en Kaggle.
- Sistema de autenticación con Supabase Auth.
- Eliminación de contextos innecesarios (AuthContext, LayoutContext).

Próximos Pasos (v0.9 - v1.0)

- Migración de Infraestructura: Evaluar movimiento de Kaggle a RunPod/Vast.ai para mayor estabilidad y tiempos de vida indefinidos.
- Supabase Realtime: Implementar canales de suscripción para reemplazar el polling HTTP en el estado de generaciones.
- Multi-Scene Pipeline: Editor visual para encadenar escenas de video.
- Marketplace de Modelos: Sistema de desbloqueo de modelos premium (SVD, Stable Video) vía suscripción.

7. Comandos Útiles

# Instalación de dependencias
npm install

# Servidor de desarrollo (Vite)
npm run dev

# Build de producción
npm run build

# Limpieza de caché de Vite (útil tras errores de módulos)
rm -rf node_modules/.vite && npm run dev
