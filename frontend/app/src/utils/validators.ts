/**
 * Funciones de validación centralizadas.
 * Todas las validaciones de formularios deben usar estas funciones.
 */

/**
 * Valida que un email tenga formato correcto.
 * @param email - Email a validar
 * @returns true si el email es válido, false en caso contrario
 */
export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Valida que una contraseña cumpla con los requisitos mínimos.
 * @param password - Contraseña a validar
 * @returns true si la contraseña es válida, false en caso contrario
 */
export function validarPassword(password: string): boolean {
  return password.length >= 8
}

/**
 * Valida que un número sea positivo.
 * @param valor - Número a validar
 * @returns true si el número es positivo, false en caso contrario
 */
export function esNumeroPositivo(valor: number): boolean {
  return valor > 0
}
