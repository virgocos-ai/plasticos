import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { validate } from './validate.middleware';

function mockRes() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  return res;
}

function mockReq(body: Record<string, unknown>): Request {
  return { body } as Request;
}

describe('validate middleware', () => {
  describe('required', () => {
    const middleware = validate({ nombre: { required: true, label: 'Nombre' } });

    it('llama next() cuando el campo requerido está presente', () => {
      const next = vi.fn();
      middleware(mockReq({ nombre: 'Juan' }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('devuelve 400 cuando falta un campo requerido', () => {
      const next = vi.fn();
      const res = mockRes();
      middleware(mockReq({}), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Nombre es requerido' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('devuelve 400 cuando el campo requerido es cadena vacía', () => {
      const next = vi.fn();
      const res = mockRes();
      middleware(mockReq({ nombre: '' }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('type: email', () => {
    const middleware = validate({ email: { type: 'email', label: 'Email' } });

    it('acepta email válido', () => {
      const next = vi.fn();
      middleware(mockReq({ email: 'test@example.com' }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('rechaza email sin @', () => {
      const next = vi.fn();
      const res = mockRes();
      middleware(mockReq({ email: 'invalido' }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('type: enum', () => {
    const middleware = validate({
      estado: { type: 'enum', values: ['activo', 'inactivo'], label: 'Estado' }
    });

    it('acepta valor válido del enum', () => {
      const next = vi.fn();
      middleware(mockReq({ estado: 'activo' }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('rechaza valor fuera del enum', () => {
      const next = vi.fn();
      const res = mockRes();
      middleware(mockReq({ estado: 'borrador' }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('activo, inactivo')
      }));
    });
  });

  describe('minLength / maxLength', () => {
    const middleware = validate({
      codigo: { minLength: 3, maxLength: 10, label: 'Código' }
    });

    it('acepta cadena dentro del rango', () => {
      const next = vi.fn();
      middleware(mockReq({ codigo: 'ABC' }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('rechaza cadena muy corta', () => {
      const next = vi.fn();
      const res = mockRes();
      middleware(mockReq({ codigo: 'AB' }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rechaza cadena muy larga', () => {
      const next = vi.fn();
      const res = mockRes();
      middleware(mockReq({ codigo: 'ABCDEFGHIJK' }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('min / max numérico', () => {
    const middleware = validate({ precio: { type: 'number', min: 0, max: 9999, label: 'Precio' } });

    it('acepta número en rango', () => {
      const next = vi.fn();
      middleware(mockReq({ precio: 100 }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('rechaza número negativo', () => {
      const next = vi.fn();
      const res = mockRes();
      middleware(mockReq({ precio: -1 }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rechaza número mayor al máximo', () => {
      const next = vi.fn();
      const res = mockRes();
      middleware(mockReq({ precio: 10000 }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('campos opcionales', () => {
    const middleware = validate({ descripcion: { maxLength: 50, label: 'Descripción' } });

    it('omite validación si el campo opcional está ausente', () => {
      const next = vi.fn();
      middleware(mockReq({}), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('múltiples errores', () => {
    const middleware = validate({
      nombre: { required: true, label: 'Nombre' },
      email: { required: true, type: 'email', label: 'Email' },
    });

    it('devuelve todos los errores en el array errors', () => {
      const next = vi.fn();
      const res = mockRes();
      middleware(mockReq({}), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      const call = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.errors).toHaveLength(2);
    });
  });
});
