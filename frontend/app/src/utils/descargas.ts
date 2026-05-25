/**
 * Utilidades para descargar archivos desde el navegador.
 */

/**
 * Dispara la descarga de un Blob como archivo en el navegador.
 *
 * @param blob    Contenido del archivo a descargar
 * @param nombre  Nombre del archivo (con extensión)
 */
export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  // Liberar la URL de objeto tras un breve delay para que el navegador complete la descarga
  setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
