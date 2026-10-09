import { CommandAck } from 'shared';

export class IdempotencyStore {
  private static cache: Map<string, { ack: CommandAck; expiresAt: number }> = new Map();
  private static TTL_MS = 10 * 60 * 1000; // 10 minutes retention

  static has(commandId: string): boolean {
    const entry = this.cache.get(commandId);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(commandId);
      return false;
    }
    return true;
  }

  static get(commandId: string): CommandAck | null {
    const entry = this.cache.get(commandId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(commandId);
      return null;
    }
    return entry.ack;
  }

  static set(commandId: string, ack: CommandAck): void {
    this.cache.set(commandId, {
      ack,
      expiresAt: Date.now() + this.TTL_MS,
    });
    // Cleanup old items occasionally
    if (this.cache.size > 2000) {
      this.cleanup();
    }
  }

  private static cleanup(): void {
    const now = Date.now();
    for (const [key, val] of this.cache.entries()) {
      if (now > val.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
