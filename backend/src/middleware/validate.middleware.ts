import { Request, Response, NextFunction } from 'express';

type Rule = {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'enum';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  values?: string[];
  label?: string;
};

type Schema = Record<string, Rule>;

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body;

    for (const [field, rule] of Object.entries(schema)) {
      const label = rule.label || field;
      const value = body[field];
      const isEmpty = value === undefined || value === null || value === '';

      if (rule.required && isEmpty) {
        errors.push(`${label} es requerido`);
        continue;
      }
      if (isEmpty) continue;

      if (rule.type === 'email' && !validateEmail(String(value))) {
        errors.push(`${label} no es un email válido`);
      }
      if (rule.type === 'number' && isNaN(Number(value))) {
        errors.push(`${label} debe ser un número`);
      }
      if (rule.type === 'enum' && rule.values && !rule.values.includes(String(value))) {
        errors.push(`${label} debe ser uno de: ${rule.values.join(', ')}`);
      }
      if (rule.minLength && String(value).length < rule.minLength) {
        errors.push(`${label} debe tener al menos ${rule.minLength} caracteres`);
      }
      if (rule.maxLength && String(value).length > rule.maxLength) {
        errors.push(`${label} no puede exceder ${rule.maxLength} caracteres`);
      }
      if (rule.min !== undefined && Number(value) < rule.min) {
        errors.push(`${label} debe ser mayor o igual a ${rule.min}`);
      }
      if (rule.max !== undefined && Number(value) > rule.max) {
        errors.push(`${label} debe ser menor o igual a ${rule.max}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0], errors });
    }

    next();
  };
}
