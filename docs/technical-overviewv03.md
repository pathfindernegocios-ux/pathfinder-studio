# 📘 Documento Técnico — Pathfinder Studio v03

**Última actualización:** 2026-09-05  
**Estado:** Funcional en producción (Cloudflare Pages) y desarrollo local.

---

## 1. Descripción general

Pathfinder Studio es una plataforma de generación audiovisual con IA. Permite a usuarios autenticados crear videos a partir de una imagen inicial, un prompt y opcionalmente una imagen final y audio. El cómputo se ejecuta en notebooks de Kaggle (GPU T4) y la interfaz web orquesta la generación.

Además, los usuarios pueden **guardar temporalmente** sus creaciones, visualizarlas en una biblioteca personal **“Mis creaciones”**, descargarlas, reutilizarlas y eliminarlas. Las creaciones expiran automáticamente después de **7 días**.

---

## 2. Flujo actual del usuario

1. Registro/login con Supabase Auth.
2. Descarga de notebook personalizado (edge function).
3. Subida y ejecución del notebook en Kaggle.
4. El notebook expone una API Gradio y registra su URL en Supabase.
5. El frontend descubre la URL y muestra el estado de la estación.
6. El usuario configura prompt, imagen inicial, imagen final, audio, resolución, duración, seed, etc.
7. Inicia la generación. El frontend observa progreso, logs y tiempo estimado.
8. Al terminar, puede:
   - **Descargar** el video.
   - **Guardar** en “Mis creaciones”.
   - **Descartar** el resultado.
9. En “Mis creaciones”:
   - Galería visual con miniaturas reales, lazy loading y hover con vista previa.
   - Filtros por tipo: Todo, Videos, Fotos, Audio.
   - Agrupación cronológica por fecha.
   - Clic en una tarjeta de video → abre el detalle y **reproduce automáticamente** (
