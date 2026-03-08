import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthError } from '../utils/errors.js';

interface JwtPayload {
  userId: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new AuthError('Missing or malformed authorization header'));
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.userId = payload.userId;
    next();
  } catch {
    next(new AuthError('Invalid or expired token'));
  }
}
