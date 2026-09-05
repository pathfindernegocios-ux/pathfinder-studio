[📘 Documento Técnico Final — Pathfinder Studio: Persistencia de Creaciones
Fecha: 2026-09-05
Estado: Funcional en desarrollo local, pendiente implementar restricción de CORS en edge functions.

1. Contexto general
Pathfinder Studio es una plataforma de generación de videos con IA que permite a usuarios autenticados crear videos a partir de prompts, imágenes y audio. La generación se ejecuta en notebooks de Kaggle (LTX-2.3) y se orquesta desde un frontend React desplegado en Cloudflare Pages. Supabase actúa como backend de autenticación, base de datos y edge functions.

Este documento cubre la implementación de la capa de persistencia “Mis creaciones”, que permite a los usuarios guardar temporalmente sus generaciones en Cloudflare R2 y verlas, descargarlas y eliminarlas posteriormente.

2. Objetivo del módulo
Permitir que un usuario autenticado guarde una generación de video en su cuenta.

Almacenar el archivo en Cloudflare R2 de forma privada.

Guardar metadatos en Supabase PostgreSQL.

Ofrecer una vista “Mis creaciones” para listar, descargar y eliminar.

Mantener una retención temporal de 7 días (expiración automática del archivo).

Cumplir con estándares de seguridad y escalabilidad.

3. Arquitectura final implementada
text
                          PATHFINDER STUDIO
                                 │
                                 ▼
                          React Frontend
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
          Supabase Auth   Supabase Edge    Cloudflare R2
                │          Functions       (presigned)
                │                │                │
                ▼                ▼                ▼
          PostgreSQL       aws4fetch       video .mp4
          creations        fetch directo
Flujo de guardado
Usuario pulsa Guardar.

Frontend llama a save-creation (Supabase Edge Function).

save-creation valida JWT, genera creationId y storageKey, y devuelve una presigned PUT URL.

Frontend descarga el video temporal de Gradio y lo sube directo a R2 con la URL presignada.

Frontend llama a complete-creation.

complete-creation valida JWT, valida storageKey, hace HEAD a R2 para confirmar existencia, y luego inserta metadata en Supabase.

Flujo de descarga
Usuario pulsa Descargar en “Mis creaciones”.

Frontend llama a get-creation-download-url.

La edge function verifica ownership y genera una presigned GET URL (60 s de expiración).

Frontend abre la URL y descarga el video.

Flujo de eliminación
Usuario pulsa Eliminar.

Frontend llama a delete-creation.

La edge function verifica ownership, elimina el objeto de R2 y luego el registro en Supabase.

4. Avances realizados
4.1 Frontend (React + TypeScript + Vite)
Refactor estructural completado (componentes y hooks separados).

React Router integrado con rutas /auth, /welcome, /studio, /creations.

Sidebar con NavLink para navegación real.

Vista “Mis creaciones” funcional: listado, descarga, eliminación.

Botón Guardar en GenerationResult con estados (Guardando.../Guardar).

Hook useCreations con flujo de dos pasos (presign → subir → completar).

Sin referencias a credenciales de R2.

4.2 Backend (Supabase Edge Functions)
save-creation: autenticación JWT, generación de presigned PUT con aws4fetch.

complete-creation: autenticación, validación estricta de storageKey, verificación HEAD en R2, inserción de metadata con expires_at.

get-creation-download-url: autenticación, ownership, presigned GET.

delete-creation: autenticación, ownership, eliminación de objeto R2 y registro.

Todas las funciones usan imports dinámicos para evitar cold start pesado.

CORS preflight respondido antes de cargar dependencias.

Pendiente: restricción de CORS a dominios específicos (actualmente * temporal).

4.3 Base de datos (Supabase PostgreSQL)
Tabla creations creada con migración 0001_create_creations.sql.

RLS habilitado con políticas para SELECT, INSERT, UPDATE, DELETE.

Migración 0002_grants.sql creada para formalizar privilegios de service_role y authenticated.

Columnas para metadatos completos, storage_key, status, created_at, expires_at.

4.4 Almacenamiento (Cloudflare R2)
Bucket privado pathfinder-generations.

CORS configurado con orígenes específicos (http://localhost:5173, https://pathfinder-studio-8qe.pages.dev).

Regla de ciclo de vida delete-generated-videos con prefijo generations/ y supresión a los 7 días.

API Token generado y secrets en Supabase.

5. Problemas encontrados y soluciones
5.1 OPTIONS 546 WORKER_RESOURCE_LIMIT
Causa: imports estáticos de SDK pesados (@aws-sdk/client-s3, @supabase/supabase-js) al inicio de las edge functions. El cold start tardaba más de 150 s.

Solución: imports dinámicos después de OPTIONS, reemplazo por aws4fetch y fetch directo, y uso de Deno.serve.

Resultado: preflight responde en milisegundos.

5.2 500 permission denied for table creations
Causa: falta de grants para el rol service_role.

Solución: ejecutar GRANT ALL PRIVILEGES para service_role y authenticated, y formalizarlo en migración 0002_grants.sql.

Resultado: inserción correcta.

5.3 CORS con múltiples orígenes en lista separada por comas
Causa: el header Access-Control-Allow-Origin no admite una lista separada por comas.

Solución temporal: usar * para desarrollo.

Pendiente: implementar lógica dinámica que devuelva el origen permitido según lista blanca.

5.4 Error SignatureDoesNotMatch en R2
Causa: implementación manual de AWS Signature V4.

Solución: usar aws4fetch que maneja la firma automáticamente.

6. Pendientes y consideraciones de producción
Tarea	Estado	Prioridad
Restringir CORS en edge functions a dominios específicos	⏳ Pendiente	Alta (antes de producción)
Probar flujo completo en producción (Cloudflare Pages)	⏳ Pendiente	Alta
Probar descarga y eliminación reales	⏳ Pendiente	Alta
Fusionar a main y desplegar	⏳ Pendiente	Alta
Documentar arquitectura final en docs/	⏳ Pendiente	Media
Implementar cleanup de registros expirados en Supabase	⏳ Futuro	Media
7. Checklist de calidad y seguridad
7.1 Autenticación y autorización
☑ JWT validado contra Supabase Auth en todas las edge functions.
☑ user_id nunca confiado desde el frontend.
☑ Verificación de ownership (creation.user_id === user.id) en descarga y eliminación.
☑ Prueba con token inválido → 401.
7.2 Validación de datos
☑ storageKey validado estrictamente (estructura generations/{userId}/{creationId}/output.mp4).
☑ creationId correlacionado con storageKey.
☑ Prueba de storageKey ajeno → 403.
☑ Prueba de storageKey mal formado → 403.
7.3 Integridad de almacenamiento
☑ complete-creation verifica HEAD en R2 antes de insertar.
☑ Prueba de objeto inexistente → 409.
7.4 CORS
☑ Preflight OPTIONS responde antes de cargar dependencias.
☑ CORS en R2 configurado con orígenes específicos.
□ CORS en edge functions restringido a dominios específicos (pendiente).
7.5 Rendimiento
☑ Imports dinámicos para evitar cold start pesado.
☑ Uso de aws4fetch (ligero) en lugar de AWS SDK.
☑ Eliminación de @supabase/supabase-js en favor de fetch directo.
☑ Prueba de OPTIONS 546 resuelto.
7.6 Seguridad de secretos
☑ Credenciales R2 y Supabase solo en secrets de Supabase, nunca en frontend.
☑ Sin logs de secretos.
8. Contexto para futuros colaboradores
Archivos clave
frontend/src/hooks/useCreations.ts — lógica de guardado, descarga y eliminación.

frontend/src/pages/CreationsPage.tsx — vista "Mis creaciones".

supabase/functions/save-creation/index.ts — genera presigned PUT.

supabase/functions/complete-creation/index.ts — verifica HEAD e inserta metadata.

supabase/functions/get-creation-download-url/index.ts — genera presigned GET.

supabase/functions/delete-creation/index.ts — elimina objeto y registro.

supabase/migrations/0001_create_creations.sql — creación de tabla.

supabase/migrations/0002_grants.sql — grants para roles.

Secretos en Supabase
SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

R2_ACCOUNT_ID

R2_ACCESS_KEY_ID

R2_SECRET_ACCESS_KEY

R2_BUCKET

Conceptos importantes
Presigned URL: URL temporal que permite subir/descargar directamente desde el navegador sin exponer credenciales.

aws4fetch: librería ligera para firmar peticiones AWS S3-compatibles.

RLS: políticas de seguridad a nivel de fila en Supabase.

HEAD en R2: verificación de existencia antes de insertar metadata.

Mejoras futuras
Plantillas: reutilizar configuraciones de creaciones para generar contenido repetible.

Proyectos: agrupar creaciones relacionadas.

Assets: biblioteca de imágenes/audios.

Expiración automática: implementar un cron que elimine registros de Supabase cuyo expires_at haya pasado.

CORS dinámico: función helper que valide el Origin contra una lista blanca.

Limpiar logs: quitar logs de depuración en producción.

9. Instrucciones para completar CORS en edge functions (pendiente)
Se deben actualizar las cuatro funciones para que incluyan una lista blanca de orígenes. Ejemplo:

ts
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://pathfinder-studio-8qe.pages.dev",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
Y reemplazar todas las referencias de corsHeaders por corsHeaders(req).

Los códigos completos ya fueron proporcionados en la conversación y deben desplegarse con:

bash
supabase functions deploy save-creation
supabase functions deploy complete-creation
supabase functions deploy get-creation-download-url
supabase functions deploy delete-creation
10. Conclusión
La persistencia de creaciones está funcional en desarrollo y cumple con los estándares de seguridad y calidad definidos, a excepción de la restricción de CORS en edge functions que queda pendiente. Los problemas críticos (cold start, permisos, CORS de R2) fueron resueltos. Una vez que se complete la restricción de CORS y se realicen las pruebas finales, el módulo estará listo para desplegarse en producción.

Comandos para subir este documento al repositorio
bash
cd ~/pathfinder-beta
mkdir -p docs
cat > docs/persistencia-creaciones.md << 'EOF'
[Aquí pega todo el documento anterior, desde "📘 Documento Técnico Final" hasta el final]
