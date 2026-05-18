import { describe, it, expect } from 'vitest';
import { validateRFC, validateEmail, validateCP } from './validators';

describe('validateRFC', () => {
  it('acepta RFC de persona moral (12 caracteres)', () => {
    expect(validateRFC('AAA010101AAA')).toBe(true);
  });

  it('acepta RFC de persona física (13 caracteres)', () => {
    expect(validateRFC('AAAA010101AAA')).toBe(true);
  });

  it('rechaza RFC con menos de 12 caracteres', () => {
    expect(validateRFC('AAA01010')).toBe(false);
  });

  it('rechaza RFC con caracteres inválidos', () => {
    expect(validateRFC('AAA01010!AAA')).toBe(false);
  });
});

describe('validateEmail', () => {
  it('acepta email válido', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('rechaza email sin @', () => {
    expect(validateEmail('testexample.com')).toBe(false);
  });

  it('rechaza email sin dominio', () => {
    expect(validateEmail('test@')).toBe(false);
  });
});

describe('validateCP', () => {
  it('acepta CP de 5 dígitos', () => {
    expect(validateCP('64000')).toBe(true);
  });

  it('rechaza CP con letras', () => {
    expect(validateCP('64A00')).toBe(false);
  });

  it('rechaza CP con menos de 5 dígitos', () => {
    expect(validateCP('6400')).toBe(false);
  });
});
