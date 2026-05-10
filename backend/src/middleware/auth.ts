import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      username?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    req.userId = payload.id;
    req.username = payload.username;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
