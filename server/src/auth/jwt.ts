import jwt from 'jsonwebtoken';
import { User, UserRole } from 'shared';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_pro_football_v2_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  matchId?: string; // Set when paired via temporary match pairing code
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: (JWT_EXPIRES_IN as any) || '24h' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}
