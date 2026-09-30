import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SALT_ROUNDS = 10;
const AUTH_SECRET = process.env.AUTH_SECRET || 'medichron-auth-secret-key-2026-production';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'patient';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, AUTH_SECRET) as AuthUserPayload;
  } catch {
    return null;
  }
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    const payload = verifyToken(parts[1]);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.',
    });
  }
  next();
}

export function requireRole(allowedRole: 'doctor' | 'patient') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (req.user.role !== allowedRole) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to access this resource.',
      });
    }

    next();
  };
}
