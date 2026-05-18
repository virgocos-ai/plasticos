import { describe, it, expect } from 'vitest';
import { isValidRFC, isValidEmail, isValidCP } from './validators';

describe('isValidRFC', () => {
  it('acepta RFC válido de 13 caracteres', () => {
    expect(isValidRFC('AAAA010101AAA')).toBe(true);
  });

  it('rechaza RFC con menos de 12 caracteres', () => {
    expect(isValidRFC('AAA010101AA')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('acepta email válido', () => {
    expect(isValidEmail('admin@plasticos.com')).toBe(true);
  });

  it('rechaza email inválido', () => {
    expect(isValidEmail('no-es-email')).toBe(false);
  });
});

describe('isValidCP', () => {
  it('acepta CP de 5 dígitos', () => {
    expect(isValidCP('64000')).toBe(true);
  });

  it('rechaza CP con letras', () => {
    expect(isValidCP('6400A')).toBe(false);
  });
});
