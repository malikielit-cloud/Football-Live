import { v4 as uuidv4 } from 'uuid';
import { getDatabaseAdapter, AuditLogEntry } from '../database';

export class AuditService {
  static async log(
    userId: string,
    action: string,
    details: string,
    matchId?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const db = await getDatabaseAdapter();
      const entry: AuditLogEntry = {
        id: `aud-${uuidv4().slice(0, 8)}`,
        timestamp: Date.now(),
        userId,
        action,
        matchId,
        details,
        ipAddress,
      };
      await db.addAuditLog(entry);
    } catch (err) {
      console.error('[AuditService] Failed to write audit log:', err);
    }
  }
}
