# 📘 Documento Técnico — Pathfinder Studio v02

**Última actualización:** 2026-09-05  
**Estado:** Funcional en desarrollo local y producción (Cloudflare Pages).

---

## 1. Descripción general

Pathfinder Studio es una plataforma de generación audiovisual con IA. Permite a usuarios autenticados crear videos a partir de una imagen inicial, un prompt y opcionalmente una imagen final y audio. El cómputo se ejecuta en notebooks de Kaggle (GPU T4) y la interfaz web orquesta la generación.

Además, los usuarios pueden **guardar temporalmente** sus creaciones, verlas en “Mis creaciones”, descargarlas y eliminarlas.

---

## 2. Flujo actual del usuario

1. Registro/login con Supabase Auth.
2. Descarga de notebook personalizado (edge function).
3. Subida y ejecución del notebook en Kaggle.
4. El notebook expone una API Gradio y registra su URL en Supabase.
5. El frontend descubre la URL y muestra el estado de la estación.
6. El usuario configura prompt, imagen inicial, imagen final, audio, resolución, duración, seed, etc.
7. Inicia la generación. El frontend observa progreso, logs y tiempo estimado.
8. Al terminar, el usuario puede:
   - **Descargar** el video.
   - **Guardar** la generación en “Mis creaciones”.
   - **Descartar** el resultado.
9. En “Mis creaciones” puede listar, descargar y eliminar sus creaciones guardadas.
10. Las creaciones expiran automáticamente después de **7 días**.

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
│  (videos)     │         │ (metadata)   │
└───────────────┘         └──────────────┘
Frontend: React 19 + TypeScript + Vite + React Router.

Backend directo: notebooks Kaggle con LTX-2.3 y Gradio.

Backend de soporte: Supabase Auth, PostgreSQL, Edge Functions.

Almacenamiento de creaciones: Cloudflare R2, privado, con URLs presignadas.

Estado de generación: desacoplado del ciclo de vida de StudioPage mediante GenerationProvider.

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
│   └── GenerationResult.tsx
├── pages/
│   ├── StudioPage.tsx
│   └── CreationsPage.tsx
├── context/
│   └── GenerationContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useRuntime.ts
│   ├── useGradioClient.ts
│   ├── useGeneration.ts      # (aún existe, pero Studio usa el contexto)
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
Se creó GenerationContext para que la generación sea un Job del sistema, no un estado local de StudioPage.

Responsabilidades:

Mantener isLoading, generationInfo, logs, videoSrc, progressFrac, etc.

Ejecutar polling de /generation_status y /logs.

Recuperar el estado al montar la app (refresh).

Permitir navegación sin perder el job.

Manejar reconexión y recuperación de resultado completado.

Exponer handleGenerate y handleCancel.

StudioPage se convirtió en consumidor del contexto.

4.4 Persistencia de inputs
Para sobrevivir refrescos, los campos no-archivo se guardan en localStorage:

prompt

resolution

aspectRatio

duration

guideScale

seed

matchAudioDur

Los archivos (imagen/audio) aún no se persisten; es una mejora futura.

5. Backend en Kaggle (Notebook)
Sin cambios relevantes en esta iteración.

Endpoints Gradio:

/status

/generation_status

/generate

/cancel

/logs

El backend es la fuente autoritativa de verdad.

6. Supabase
6.1 Tablas
profiles

runtimes

creations

6.2 Edge Functions
generate-notebook

save-creation

complete-creation

get-creation-download-url

delete-creation

6.3 Cloudflare R2
Bucket privado pathfinder-generations.

Presigned URLs para subir/descargar.

Lifecycle rule de 7 días.

CORS configurado con orígenes específicos.

7. Persistencia de creaciones
Flujo de guardado:

save-creation → genera creationId, storageKey y presigned PUT.

Frontend sube a R2 directo.

complete-creation → valida JWT, valida storageKey, verifica HEAD en R2, inserta metadata.

Flujo de descarga:

get-creation-download-url → valida ownership y genera presigned GET.

Flujo de eliminación:

delete-creation → verifica ownership, elimina objeto R2 y registro.

Seguridad:

JWT validado.

user_id nunca confiado del frontend.

storageKey validado estrictamente.

R2 privado.

HEAD antes de insertar.

8. Problemas resueltos
8.1 OPTIONS 546 WORKER_RESOURCE_LIMIT
Causa: imports estáticos de SDK pesados.

Solución: imports dinámicos, aws4fetch, fetch directo.

Resultado: preflight rápido.

8.2 500 permission denied for table creations
Causa: falta de grants para service_role.

Solución: migración 0002_grants.sql.

Resultado: inserción correcta.

8.3 Pérdida de progreso al recargar/navegar
Causa: estado de generación acoplado a StudioPage.

Solución: GenerationProvider + recuperación con /generation_status.

Resultado: job sobrevive a refresh/navegación/desconexión.

8.4 hasEnteredStudio se perdía
Causa: estado no persistido.

Solución: localStorage en useAuth.

Resultado: al recargar permanece en /studio.

9. Pendientes / próximos pasos
Mejorar “Mis creaciones” (miniaturas, detalle, confirmaciones).

Activar más secciones del Sidebar.

Plantillas reutilizables.

Multi-modelo (Flux2, OmniVoice, Wan2V).

Pagos con Mercado Pago.

Restringir CORS en edge functions (al final del desarrollo).

Persistir archivos de imagen/audio en el formulario.

Cleanup de registros expirados en Supabase.

10. Guía rápida para colaboradores
Clonar el repo.

cd frontend && npm install && npm run dev.

Revisar GenerationContext.tsx para entender el job de generación.

Revisar useCreations.ts para persistencia.

Edge functions en supabase/functions/.

No exponer secretos en frontend.

Este documento es el baseline actual de Pathfinder Studio.
