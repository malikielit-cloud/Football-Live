import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../auth/jwt';
import { UserRole } from 'shared';
import { hasPermission } from '../auth/roles';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
}

export function requireRole(minimumRole: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(req.user.role, minimumRole)) {
      return res.status(403).json({ error: `Insufficient permissions. Requires role: ${minimumRole}` });
    }

    next();
  };
}
