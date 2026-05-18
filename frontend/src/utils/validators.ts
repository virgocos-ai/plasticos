export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isValidRFC = (rfc: string): boolean => {
  // RFC de persona física: 13 caracteres
  // RFC de persona moral: 12 caracteres
  if (!rfc || rfc.length < 12 || rfc.length > 13) return false;
  
  const regex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  return regex.test(rfc.toUpperCase());
};

export const isValidCP = (cp: string): boolean => {
  return /^\d{5}$/.test(cp);
};

export const isValidPhone = (phone: string): boolean => {
  // Eliminar espacios, guiones y paréntesis
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^\d{10}$/.test(cleaned);
};

export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const minLength = (value: string, min: number): boolean => {
  return !!(value && value.length >= min);
};

export const maxLength = (value: string, max: number): boolean => {
  return !value || value.length <= max;
};

export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value >= 0;
};

export const isValidClaveSAT = (clave: string): boolean => {
  // Claves SAT son numéricas de 8-10 dígitos
  return /^\d{8,10}$/.test(clave);
};

export const sanitizeString = (value: string): string => {
  if (!value) return '';
  return value.trim().replace(/[<>]/g, '');
};

export const validateForm = (fields: Record<string, any>, rules: Record<string, (value: any) => boolean>): string[] => {
  const errors: string[] = [];
  
  for (const [field, validator] of Object.entries(rules)) {
    if (!validator(fields[field])) {
      errors.push(field);
    }
  }
  
  return errors;
};
