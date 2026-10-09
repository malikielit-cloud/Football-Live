import crypto from 'crypto';
import { PairingSession } from 'shared';

export class PairingCodeManager {
  private static sessions: Map<string, PairingSession> = new Map(); // pairingCode -> session
  private static matchToCode: Map<string, string> = new Map(); // matchId -> pairingCode

  static generateCodeForMatch(matchId: string, ttlMs = 4 * 60 * 60 * 1000): string {
    // Check if valid code already exists
    const existingCode = this.matchToCode.get(matchId);
    if (existingCode) {
      const existing = this.sessions.get(existingCode);
      if (existing && existing.expiresAt > Date.now()) {
        return existingCode;
      }
    }

    // Generate random 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const session: PairingSession = {
      matchId,
      pairingCode: code,
      role: 'OPERATOR',
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    this.sessions.set(code, session);
    this.matchToCode.set(matchId, code);
    return code;
  }

  static validateCode(code: string): PairingSession | null {
    const session = this.sessions.get(code);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(code);
      this.matchToCode.delete(session.matchId);
      return null;
    }

    return session;
  }

  static revokeMatchCode(matchId: string): void {
    const code = this.matchToCode.get(matchId);
    if (code) {
      this.sessions.delete(code);
      this.matchToCode.delete(matchId);
    }
  }

  static getCodeForMatch(matchId: string): string | null {
    const code = this.matchToCode.get(matchId);
    if (!code) return null;
    const session = this.sessions.get(code);
    if (!session || Date.now() > session.expiresAt) return null;
    return code;
  }
}
