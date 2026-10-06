// src/lib/mediaUrl.ts
//
// Recombina la base de una URL servida por el notebook.
// El notebook expone los archivos generados como
//   {gradio_url}/gradio_api/file=<path-absoluto-en-el-notebook>
// Cuando el túnel cambia (relanzamiento de Cloudflare, rotación a Gradio
// share), las URLs guardadas en el historial apuntan al túnel viejo y el
// navegador falla al cargarlas. Esta función reescribe la base con la URL
// activa actual, preservando el path relativo.
//
// Solo toca URLs:
//   - con esquema http/https,
//   - cuyo path empieza con /gradio_api/.
// El resto (data:, blob:, externas, relativas) se devuelve tal cual.

export function rebaseMediaUrl(
  url: string | null | undefined,
  base: string | null | undefined
): string {
  if (!url) return "";
  if (!base) return url;
  const m = url.match(/^https?:\/\/[^/]+(\/gradio_api\/.*)$/);
  if (!m) return url;
  return base.replace(/\/+$/, "") + m[1];
}
