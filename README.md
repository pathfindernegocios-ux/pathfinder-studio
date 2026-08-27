# Pathfinder Studio

Plataforma para ejecutar pipelines de inteligencia artificial generativa desde una interfaz web propia.

## Estado actual

- **Frontend**: React + Vite + TypeScript, con conexión a Gradio mediante `@gradio/client`.
- **Backend**: Supabase (registro de runtimes y estado).
- **Runtime**: Kaggle + Gradio.
- **Pipeline integrado**: LTX-2.3 22B Distilled (quanto int8) usando Wan2GP.

## Estructura del repositorio

- `frontend/`: Aplicación React.
- `docs/`: Documentación técnica y de uso.
- `runtimes/`: Scripts de Kaggle para ejecutar los modelos.
- `supabase/`: SQL y configuración de base de datos.

## Despliegue

El frontend se despliega en Cloudflare Pages. Ver [docs/despliegue/cloudflare.md](docs/despliegue/cloudflare.md).

## Documentación

Índice general en [docs/index.md](docs/index.md).

## Estado de la prueba

- Circuito completo validado: Kaggle → Gradio → Supabase → React.
- Registro automático de URL de Gradio en Supabase.
- Handshake de estado (`STARTING`, `READY`, `BUSY`, `ERROR`).
- Generación de video real desde el frontend.

## Licencia

Privado - Pathfinder.
