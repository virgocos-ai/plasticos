import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { verifyToken, requireRole } from './auth.middleware';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken');

describe('verifyToken', () => {
  it('devuelve 401 si no hay token', () => {
    const req = { headers: {} } as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token no proporcionado' });
  });

  it('devuelve 401 si el token es inválido', () => {
    const req = { headers: { authorization: 'Bearer invalidtoken' } } as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    (jwt.verify as any).mockImplementation(() => { throw new Error('invalid'); });

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
  });
});

describe('requireRole', () => {
  it('permite acceso si el rol está autorizado', () => {
    const req = { user: { id: 1, email: 'test@test.com', rol: 'admin' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    requireRole('admin')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rechaza acceso si el rol no está autorizado', () => {
    const req = { user: { id: 1, email: 'test@test.com', rol: 'operador' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    requireRole('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tiene permisos para realizar esta acción' });
  });
});
