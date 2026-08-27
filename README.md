# Pathfinder Studio

Plataforma para ejecutar pipelines de IA generativa desde una interfaz web propia.

## Estado actual

- Frontend React + Vite + TypeScript
- Backend: Supabase (registro de runtimes)
- Runtime: Kaggle + Gradio
- Pipeline integrado: LTX-2.3 22B (quanto int8)

## Estructura

- `frontend/`: Aplicación React
- `docs/`: Documentación técnica y de uso
- `runtimes/`: Scripts de Kaggle
- `supabase/`: SQL y configuración de base de datos

## Despliegue

El frontend se despliega en Cloudflare Pages. Consulta [docs/despliegue/cloudflare.md](docs/despliegue/cloudflare.md).

## Documentación

Índice general en [docs/index.md](docs/index.md).

## Licencia

Privado - Pathfinder
