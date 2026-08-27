# Runtime Registry

## Objetivo

Permitir que Pathfinder Studio descubra automáticamente la URL pública de Gradio generada por una sesión de Kaggle, sin intervención manual.

## Flujo actual

1. En Kaggle, se ejecuta `run_ltx.py`.
2. El script carga el modelo y lanza Gradio en un hilo.
3. Se captura la salida para extraer la URL pública (`https://xxxx.gradio.live`).
4. Esa URL se envía a Supabase mediante una petición `POST` a la tabla `runtimes`.
5. El frontend React consulta periódicamente Supabase (`GET /runtimes?station_id=eq.PF-0001`).
6. Cuando obtiene la URL, se conecta a Gradio usando `@gradio/client`.
7. El frontend consulta el endpoint `/status` para conocer el estado del backend (`READY`, `BUSY`, etc.).
8. El usuario puede enviar trabajos al endpoint `/generate`.

## Identidad de estación

- `station_id` es permanente (ej: `PF-0001`).
- `gradio_url` es temporal y cambia en cada sesión.
- El frontend siempre consulta por `station_id`, no por URL fija.

## Estados del runtime

| Estado     | Descripción                                      |
|------------|--------------------------------------------------|
| `STARTING` | Iniciando, cargando dependencias                 |
| `LOADING`  | Cargando modelos                                 |
| `READY`    | Listo para recibir trabajos                      |
| `BUSY`     | Ejecutando una generación                        |
| `ERROR`    | Ocurrió un error                                 |
| `EXPIRED`  | La URL ya no es válida (no implementado aún)     |

## Siguientes pasos

- Implementar heartbeats para detectar caídas.
- Actualizar estado en Supabase desde el notebook.
- Soportar múltiples estaciones y usuarios.
