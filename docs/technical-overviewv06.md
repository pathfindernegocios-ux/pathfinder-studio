# 📘 Documento Técnico — Pathfinder Studio v06

**Última actualización:** 2026-09-06  
**Estado:** Funcional en local y listo para despliegue en Cloudflare Pages.

---

## 1. Descripción general

Pathfinder Studio ahora soporta **dos niveles de generación de imagen**:

```text
IMAGE
 ├── STANDARD
 │     └── Krea 2 Turbo
 │
 └── PREMIUM
       └── Flux 2 Klein 4B
La capability IMAGE dejó de estar asociada a un único modelo. Ahora es una capa de producto que agrupa modelos con distintos niveles de control creativo.

2. Arquitectura comercial
text
PATHFINDER
│
├── IMAGE
│     ├── STANDARD
│     │      └── Krea 2 Turbo
│     │
│     └── PREMIUM
│            └── Flux 2 Klein 4B
│
├── VIDEO
│     └── LTX-2.3
│
└── AUDIO
      └── futuro
Esta estructura es la primera expresión de la arquitectura comercial de Pathfinder.
Aún no se definen precios ni límites de uso.

3. Flujo del usuario actualizado
Registro/login con Supabase Auth.

Descarga de notebook personalizado según modelo.

Ejecución del notebook en Kaggle.

Registro automático del runtime en Supabase.

El frontend descubre los runtimes disponibles.

En Studio:

Video → LTX-2.3.

Imagen → selector Standard/Premium si hay más de un runtime.

Generación con formulario específico según modelo.

Guardado en “Mis creaciones” con model_id.

Visualización, descarga, reuse y delete.

4. Modelos soportados
Modelo	Capability	Tier	model_id	model_type
LTX-2.3	video	—	ltx-2.3	video
Krea 2 Turbo	image	standard	krea-2-turbo	image
Flux 2 Klein 4B	image	premium	flux-2-klein-4b	image
5. Cambios en el frontend
5.1 useRuntime.ts
Ahora obtiene todos los runtimes de imagen disponibles.

Expone:

activeImageModelId

setActiveImageModelId

imageModels

La URL activa se resuelve según model_id seleccionado.

Video mantiene el comportamiento original.

5.2 GenerationContext.tsx
Incorpora activeImageModelId y imageModels.

handleGenerate distingue entre Krea y Flux.

Construye el payload adecuado para cada modelo.

GenerationInfo incluye modelId.

5.3 ImageGenerationForm.tsx
Formulario dinámico según activeImageModelId.

Krea → campos estándar actuales.

Flux → campos adicionales:

Guide Scale

Embedded Guidance

Imágenes de referencia

Modo de referencia

Máscara de inpainting

Método de inpainting

5.4 StudioPage.tsx
Al guardar, envía modelId.

El indicador de progreso muestra el nombre correcto del modelo activo.

5.5 useCreations.ts
SaveCreationParams incluye modelId.

metadata incluye model_id.

Se elimina la asignación fija de modelo; se usa modelId real.

5.6 types/index.ts
GenerationInfo incluye modelId.

Creation incluye model_id y generation_id.

6. Persistencia
Las creaciones ahora guardan:

media_type

model_id

generation_id (preparado para futuros batches)

Las imágenes de Flux y Krea comparten el mismo sistema de guardado.

El model_id permite distinguir visual y comercialmente el nivel de la creación.

7. Plantillas de notebooks
En Supabase Storage:

text
templates/
├── video/
│   └── ltx-2.3.ipynb
└── image/
    ├── krea-2-turbo.ipynb
    └── flux-2-klein-4b.ipynb
Todas corregidas para Gradio 6.0 (theme y css en launch()).

8. Edge Function generate-notebook
Catálogo cerrado por modelId.

Soporta LTX, Krea y Flux.

Inyecta:

__STATION_ID__

__SUPABASE_URL__

__SUPABASE_ANON_KEY__

__MODEL_TYPE__

__MODEL_ID__

9. Supabase
Migración realizada
sql
alter table public.creations add column if not exists model_id text;
alter table public.runtimes add column if not exists model_id text;
RLS
Sin cambios. Las políticas existentes cubren los nuevos campos.

10. Problemas resueltos
CORS/404 por runtime obsoleto.

Gradio 6.0: theme y css movidos a launch().

Registro automático con model_id nulo.

Miniaturas de imagen tratadas como video.

Selección de runtime de imagen sin ambigüedad.

11. Pruebas realizadas
✅ Krea genera y guarda correctamente.

✅ Flux genera y guarda correctamente.

✅ Selector Standard/Premium aparece con dos runtimes.

✅ Video LTX sin regresión.

✅ Plantillas descargables desde “Preparar estación”.

12. Próximos pasos
Briefing técnico para Claude Code (diseño/UX).

Implementar Audio.

Billing y límites.

Persistir referencias de Flux.

Optimización de carga de modelos.
