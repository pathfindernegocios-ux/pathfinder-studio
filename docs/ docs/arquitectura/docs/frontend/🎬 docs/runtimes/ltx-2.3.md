# Runtime LTX-2.3

## Descripción

Notebook de Kaggle que ejecuta LTX-2.3 22B Distilled (quanto int8) con Wan2GP.

## Requisitos

- Cuenta de Kaggle con GPU (T4 o P100).
- Internet activado en el notebook.
- Pesos del modelo previamente descargados (o incluidos en el notebook).
- Dependencias instaladas (Wan2GP, mmgp, etc.).

## Ejecución

1. Abrir el notebook en Kaggle.
2. Ejecutar todas las celdas.
3. Al final, el script lanza Gradio y registra automáticamente la URL en Supabase.
4. La celda queda esperando con `input("Servidor activo...")`. No cerrar.

## Endpoints API

- `/generate`: recibe prompt, imagen start/end, seed, duración, resolución, aspecto.
- `/status`: devuelve el estado actual (`READY`, `BUSY`, etc.).

## Parámetros del endpoint `/generate`

| Parámetro          | Tipo   | Descripción                                  |
|---------------------|--------|----------------------------------------------|
| `prompt`           | string | Descripción del video                        |
| `input_image_start`| file   | Imagen de inicio (opcional)                  |
| `input_image_end`  | file   | Imagen final (opcional)                      |
| `seed`             | number | -1 para aleatorio                            |
| `duration_dropdown`| string | "3 Seconds (73 frames)", etc.                |
| `resolution_dropdown` | string | "720p", "1080p", etc.                        |
| `aspect_ratio_dropdown` | string | "16:9 Landscape", etc.                       |

## Notas

- La generación puede tardar varios minutos dependiendo de la duración y resolución.
- El modelo ocupa ~14 GB de VRAM, adecuado para T4.
