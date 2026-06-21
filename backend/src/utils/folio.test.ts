import { describe, it, expect } from 'vitest';

// Lógica de generación de folio extraída para testear
// Prefijo: 3 letras + YY + MM, consecutivo de 4 dígitos
function buildFolio(prefix: string, ultimo: string | null, fecha: Date): string {
  const yy = fecha.getFullYear().toString().slice(-2);
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const pre = `${prefix}${yy}${mm}`;
  const consecutivo = ultimo ? parseInt(ultimo.slice(-4)) + 1 : 1;
  return `${pre}${String(consecutivo).padStart(4, '0')}`;
}

describe('buildFolio', () => {
  const fecha = new Date(2025, 5, 1); // junio (mes 5, base-0), hora local

  it('genera el primer folio con consecutivo 0001', () => {
    expect(buildFolio('MNT', null, fecha)).toBe('MNT25060001');
  });

  it('incrementa el consecutivo del último folio', () => {
    expect(buildFolio('MNT', 'MNT25060005', fecha)).toBe('MNT25060006');
  });

  it('rellena con ceros a la izquierda', () => {
    expect(buildFolio('ENV', null, fecha)).toBe('ENV25060001');
  });

  it('soporta consecutivos de 4 dígitos (hasta 9999)', () => {
    expect(buildFolio('MNT', 'MNT25069998', fecha)).toBe('MNT25069999');
  });

  it('cambia el prefijo de mes al cambiar de mes', () => {
    const julio = new Date(2025, 6, 1); // julio (mes 6, base-0)
    expect(buildFolio('MNT', null, julio)).toBe('MNT25070001');
  });
});

// Whitelist de formatos de fecha para reportes (previene inyección SQL)
const formatosPermitidos: Record<string, string> = {
  mes: '%Y-%m',
  semana: '%Y-%u',
  dia: '%Y-%m-%d',
};

function resolveFormato(agrupar: string): string {
  return formatosPermitidos[agrupar] ?? '%Y-%m-%d';
}

describe('resolveFormato (whitelist SQL)', () => {
  it('devuelve formato por mes', () => {
    expect(resolveFormato('mes')).toBe('%Y-%m');
  });

  it('devuelve formato por semana', () => {
    expect(resolveFormato('semana')).toBe('%Y-%u');
  });

  it('devuelve formato por día', () => {
    expect(resolveFormato('dia')).toBe('%Y-%m-%d');
  });

  it('devuelve formato por defecto para valor desconocido', () => {
    expect(resolveFormato('malicious; DROP TABLE facturas;--')).toBe('%Y-%m-%d');
  });

  it('devuelve formato por defecto para cadena vacía', () => {
    expect(resolveFormato('')).toBe('%Y-%m-%d');
  });
});
