import { Request, Response, NextFunction } from 'express';
import { Repository } from '../lib/repository';

export interface AuthenticatedRequest extends Request {
  user?: {
    did: string;
  };
  repository: Repository;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const did = req.repository.validateSession(token);
  if (!did) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = { did };
  next();
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const did = req.repository.validateSession(token);
    if (did) {
      req.user = { did };
    }
  }

  next();
};
