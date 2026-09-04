📘 Product Vision — Pathfinder Studio
Documento de visión de producto
Fecha: 2026-09-04
Estado: Base para la siguiente etapa de desarrollo
Autor: Equipo Pathfinder

1. Resumen ejecutivo
Pathfinder Studio es una plataforma creativa que permite a cualquier persona producir contenido audiovisual mediante modelos de IA generativa, sin necesidad de conocimientos técnicos avanzados.

Más que un generador de videos, Pathfinder es un sistema de producción repetible. Un usuario no solo crea un video: construye una capacidad de producción personal que puede reutilizar, escalar y adaptar a su industria.

El MVP actual ya demuestra que el circuito completo funciona: autenticación, personalización de notebooks, ejecución en Kaggle, comunicación con Gradio, generación, cancelación, progreso y resultado. El siguiente paso es transformar ese circuito en una plataforma sólida y extensible.

2. Principios fundacionales
2.1 Model-agnostic
Pathfinder no está atado a un solo modelo. La plataforma debe tratar a cada notebook como un proveedor de capacidad creativa. Esto incluye, entre otros:

LTX-2.3 → video con audio y end frame

Flux2 → generación de imágenes

OmniVoice → generación de voz

Wan2V → video (futuro)

Cada uno puede tener requisitos de entrada y salida diferentes, pero todos comparten el mismo ciclo: descubrir estación → interactuar con Gradio → generar → ver resultado.

2.2 Media-agnostic
El resultado de una generación no tiene por qué ser siempre un video. Puede ser:

Imagen

Audio

Video

Mezclas en un mismo proyecto

El sistema debe permitir que un proyecto contenga múltiples tipos de recursos creativos sin fricción.

2.3 Producción repetible
Cualquier generación debe poder convertirse en una receta reutilizable. Esa receta (plantilla) permitirá ejecutar nuevas generaciones cambiando solo las variables necesarias (por ejemplo, la foto de una nueva propiedad inmobiliaria, el nombre de un producto, etc.).

2.4 Centralidad del usuario
El usuario debe sentirse dueño de su propia fábrica creativa. No se trata de aprender parámetros técnicos, sino de producir contenido con una visión clara.

3. Flujo actual y visión a futuro
3.1 Flujo actual (MVP)
text
Registro / Login
    ↓
Descarga de notebook personalizado (edge function)
    ↓
Subida a Kaggle y ejecución (Run All)
    ↓
Notebook se registra en Supabase (runtimes)
    ↓
Pathfinder Studio detecta la estación activa
    ↓
Generación de video (LTX)
    ↓
Resultado y descarga
3.2 Flujo futuro deseado
text
Usuario autenticado
    ↓
Entra a Studio
    ↓
Selecciona o carga su estación activa (tipo de modelo)
    ↓
Crea desde cero o usa una plantilla
    ↓
Ejecuta generación
    ↓
Resultado persistente (Generation)
    ↓
Puede guardar como plantilla (Template)
    ↓
Puede organizar dentro de proyectos (Project)
    ↓
Puede reutilizar assets (Asset)
    ↓
Puede cambiar de modelo y seguir produciendo
4. Modelo conceptual de producción
Pathfinder debe soportar el siguiente modelo de objetos creativos:

text
User
 │
 ├── Project
 │    │
 │    ├── Template
 │    │    ├── Fixed fields (estructura, prompt base, configuración)
 │    │    └── Variable fields (inputs que cambian por ejecución)
 │    │
 │    ├── Generation
 │    │    ├── Recipe (prompt + inputs + configuración + modelo)
 │    │    ├── Result (archivo generado)
 │    │    └── Execution metadata (tiempos, estado, estación)
 │    │
 │    └── Asset
 │         └── Imagen, audio, video, etc.
4.1 Definición de Generation
Una Generation es un objeto creativo reproducible. No es solo un registro histórico; es la captura completa de una ejecución exitosa o fallida, con todos los parámetros necesarios para repetirla o derivar una plantilla.

4.2 Definición de Template
Una Template es la receta reutilizable. Surge cuando un usuario decide que una Generation puede convertirse en un flujo de producción. Contiene:

Estructura creativa

Prompt base

Inputs requeridos

Configuración fija

Modelo y versión

Variables a personalizar por ejecución

4.3 Definición de Project
Un Project es el contenedor donde vive una producción. Agrupa Templates, Generations y Assets relacionados con un objetivo creativo.

4.4 Definición de Asset
Un Asset es cualquier recurso utilizado o producido dentro de un proyecto (imagen, audio, video, prompt, etc.). Sirve para reutilización y consistencia.

5. Infraestructura multi-modelo
5.1 Estaciones (Stations)
Cada notebook en Kaggle (o futuro RunPod) se registra en Supabase con:

text
station_id
gradio_url
model_type
state
created_at
El model_type permite que Pathfinder adapte la UI y la lógica de generación. Tipos previstos:

ltx-video

flux-image

omnivoice-audio

wan2v-video

5.2 Restricción de Kaggle
Kaggle permite solo un notebook activo por sesión. El usuario puede tener varios notebooks, pero debe detener uno para ejecutar otro. Pathfinder Studio debe estar preparado para:

Detectar el nuevo model_type cuando cambia la estación activa.

Actualizar automáticamente la interfaz.

Mantener el flujo general sin que el usuario perciba fricción.

5.3 Configuración de UI por modelo
Un mapa de configuración define qué campos se muestran y cómo se construye el payload:

ts
const MODEL_UI_CONFIG = {
  "ltx-video": {
    label: "Video con audio",
    inputs: ["prompt", "start_image", "end_image", "audio"],
    endpoint: "/generate",
  },
  "flux-image": {
    label: "Imagen",
    inputs: ["prompt", "reference_images", "num_images"],
    endpoint: "/generate",
  },
  "omnivoice-audio": {
    label: "Voz",
    inputs: ["prompt", "reference_audio"],
    endpoint: "/generate",
  },
  "wan2v-video": {
    label: "Video",
    inputs: ["prompt", "start_image", "end_image"],
    endpoint: "/generate",
  },
};
La lógica de useGeneration debe volverse genérica: recibir un objeto con los inputs presentes, no parámetros fijos.

6. Hoja de ruta recomendada
Fase 1 — Cerrar estructuralmente el MVP
Extraer componentes visuales (FrameChip, AudioChip, Sidebar, etc.).

Finalizar separación de hooks (useAuth, useRuntime, useGradioClient, useGeneration).

Validar build y flujo completo.

No cambiar comportamiento.

Fase 2 — Persistencia de Generations
Crear tabla generations en Supabase.

Guardar receta completa, resultado y metadata.

Insertar mediante edge function para mayor seguridad.

Página “Generations” simple mostrando historial.

Fase 3 — Templates y Projects
Diseñar modelo de datos para templates y projects.

Permitir “Guardar como plantilla” desde una Generation.

Ejecutar nuevas generaciones a partir de una Template.

Fase 4 — Assets y multi-modelo
Permitir subir y referenciar assets.

Implementar model_type y configuración dinámica por tipo.

Probar con Flux2 y OmniVoice.

Fase 5 — Pagos y marketplace
Integrar pasarela de pago (Mercado Pago inicialmente).

Modelo de suscripción o pago por uso.

Posible marketplace de plantillas.

7. Decisiones técnicas importantes
No atar la UI a un solo tipo de medio.

No duplicar lógica por modelo; usar configuración declarativa.

Mantener el flujo de notebooks secuencial como parte del diseño.

Usar edge functions para escrituras en Supabase, no la anon key.

Documentar cada decisión en docs/ para nuevos colaboradores.

8. Conclusión
Pathfinder Studio ha superado la fase de validación técnica. Ahora el objetivo es convertirlo en una plataforma de producción creativa flexible, accesible y escalable.

La próxima etapa no es agregar más botones: es construir la capa de producto que permita a los usuarios crear, guardar y repetir sus propios flujos de producción.