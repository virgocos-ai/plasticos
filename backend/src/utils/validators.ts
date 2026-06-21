/**
 * Valida RFC mexicano (12 caracteres para persona moral, 13 para física).
 */
export function validateRFC(rfc: string): boolean {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc);
}

/**
 * Valida formato básico de correo electrónico.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valida código postal mexicano (5 dígitos numéricos).
 */
export function validateCP(cp: string): boolean {
  return /^\d{5}$/.test(cp);
}
