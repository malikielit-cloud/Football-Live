import { google, sheets_v4 } from 'googleapis';
import {
  MatchState,
  Tournament,
  Sponsor,
  TickerMessage,
  UserWithPassword,
} from 'shared';
import {
  DatabaseAdapter,
  AuditLogEntry,
  MatchEventRecord,
} from './databaseAdapter';
import { JsonFileAdapter } from './jsonFileAdapter';

export const SHEET_NAMES = {
  USERS: 'Users',
  TOURNAMENTS: 'Tournaments',
  TEAMS: 'Teams',
  PLAYERS: 'Players',
  MATCHES: 'Matches',
  MATCH_SESSIONS: 'MatchSessions',
  MATCH_EVENTS: 'MatchEvents',
  SPONSORS: 'Sponsors',
  SPONSOR_SCHEDULES: 'SponsorSchedules',
  SCORE_HISTORY: 'ScoreHistory',
  AUDIT_LOGS: 'AuditLogs',
  APP_SETTINGS: 'AppSettings',
} as const;

export class GoogleSheetsAdapter implements DatabaseAdapter {
  private sheets: sheets_v4.Sheets | null = null;
  private spreadsheetId: string;
  private fallbackAdapter: JsonFileAdapter;
  private isConfigured: boolean = false;
  private writeBatchQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID || '';
    this.fallbackAdapter = new JsonFileAdapter();
  }

  async init(): Promise<void> {
    await this.fallbackAdapter.init();

    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!this.spreadsheetId || !clientEmail || !privateKey) {
      console.warn(
        '[GoogleSheetsAdapter] Google Sheets credentials missing. Using persistent JsonFileAdapter fallback.'
      );
      this.isConfigured = false;
      return;
    }

    try {
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.isConfigured = true;
      console.log(`[GoogleSheetsAdapter] Successfully initialized Google Sheets API client for sheet: ${this.spreadsheetId}`);
    } catch (err) {
      console.error('[GoogleSheetsAdapter] Failed to authenticate with Google Sheets API:', err);
      this.isConfigured = false;
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, maxRetries = 4): Promise<T> {
    let delay = 500;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        const isQuotaError = err?.code === 429 || err?.status === 429 || err?.message?.includes('Quota');
        const isServerError = err?.code >= 500;

        if ((isQuotaError || isServerError) && attempt < maxRetries) {
          console.warn(`[GoogleSheetsAdapter] Transient error on attempt ${attempt}. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          throw err;
        }
      }
    }
    throw new Error('[GoogleSheetsAdapter] Max retries exceeded');
  }

  // Delegation with dual-write fallback
  async getUsers(): Promise<UserWithPassword[]> {
    return this.fallbackAdapter.getUsers();
  }

  async getUserByEmail(email: string): Promise<UserWithPassword | null> {
    return this.fallbackAdapter.getUserByEmail(email);
  }

  async saveUser(user: UserWithPassword): Promise<void> {
    await this.fallbackAdapter.saveUser(user);
    if (!this.isConfigured || !this.sheets) return;

    this.queueBackgroundSync(async () => {
      await this.executeWithRetry(async () => {
        await this.sheets!.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${SHEET_NAMES.USERS}!A:E`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[user.id, user.email, user.name, user.role, user.createdAt]],
          },
        });
      });
    });
  }

  async getTournaments(): Promise<Tournament[]> {
    return this.fallbackAdapter.getTournaments();
  }

  async getTournamentById(id: string): Promise<Tournament | null> {
    return this.fallbackAdapter.getTournamentById(id);
  }

  async saveTournament(tournament: Tournament): Promise<void> {
    await this.fallbackAdapter.saveTournament(tournament);
    if (!this.isConfigured || !this.sheets) return;

    this.queueBackgroundSync(async () => {
      await this.executeWithRetry(async () => {
        await this.sheets!.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${SHEET_NAMES.TOURNAMENTS}!A:F`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [
              [
                tournament.id,
                tournament.name,
                tournament.nameKhmer || '',
                tournament.season,
                tournament.status,
                tournament.createdAt,
              ],
            ],
          },
        });
      });
    });
  }

  async getMatches(): Promise<MatchState[]> {
    return this.fallbackAdapter.getMatches();
  }

  async getMatchById(id: string): Promise<MatchState | null> {
    return this.fallbackAdapter.getMatchById(id);
  }

  async saveMatch(match: MatchState): Promise<void> {
    await this.fallbackAdapter.saveMatch(match);
  }

  async saveMatchSnapshot(match: MatchState): Promise<void> {
    await this.fallbackAdapter.saveMatchSnapshot(match);
    if (!this.isConfigured || !this.sheets) return;

    // Debounced queue update to avoid Google API quota throttling
    this.queueBackgroundSync(async () => {
      await this.executeWithRetry(async () => {
        await this.sheets!.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${SHEET_NAMES.MATCH_SESSIONS}!A:H`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [
              [
                match.id,
                `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
                `${match.homeScore}-${match.awayScore}`,
                match.period,
                match.clock.seconds,
                match.activeScene,
                match.version,
                new Date().toISOString(),
              ],
            ],
          },
        });
      });
    });
  }

  async getActiveMatchSnapshots(): Promise<MatchState[]> {
    return this.fallbackAdapter.getActiveMatchSnapshots();
  }

  async addMatchEvent(event: MatchEventRecord): Promise<void> {
    await this.fallbackAdapter.addMatchEvent(event);
    if (!this.isConfigured || !this.sheets) return;

    this.queueBackgroundSync(async () => {
      await this.executeWithRetry(async () => {
        await this.sheets!.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${SHEET_NAMES.MATCH_EVENTS}!A:F`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [
              [
                event.id,
                event.matchId,
                event.minute,
                event.eventType,
                event.details,
                new Date(event.timestamp).toISOString(),
              ],
            ],
          },
        });
      });
    });
  }

  async getMatchEvents(matchId: string): Promise<MatchEventRecord[]> {
    return this.fallbackAdapter.getMatchEvents(matchId);
  }

  async getSponsors(): Promise<Sponsor[]> {
    return this.fallbackAdapter.getSponsors();
  }

  async saveSponsor(sponsor: Sponsor): Promise<void> {
    await this.fallbackAdapter.saveSponsor(sponsor);
  }

  async deleteSponsor(id: string): Promise<void> {
    await this.fallbackAdapter.deleteSponsor(id);
  }

  async getTickerMessages(): Promise<TickerMessage[]> {
    return this.fallbackAdapter.getTickerMessages();
  }

  async saveTickerMessage(msg: TickerMessage): Promise<void> {
    await this.fallbackAdapter.saveTickerMessage(msg);
  }

  async deleteTickerMessage(id: string): Promise<void> {
    await this.fallbackAdapter.deleteTickerMessage(id);
  }

  async addAuditLog(log: AuditLogEntry): Promise<void> {
    await this.fallbackAdapter.addAuditLog(log);
    if (!this.isConfigured || !this.sheets) return;

    this.queueBackgroundSync(async () => {
      await this.executeWithRetry(async () => {
        await this.sheets!.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${SHEET_NAMES.AUDIT_LOGS}!A:F`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [
              [
                log.id,
                new Date(log.timestamp).toISOString(),
                log.userId,
                log.action,
                log.matchId || '',
                log.details,
              ],
            ],
          },
        });
      });
    });
  }

  async getAuditLogs(limit?: number): Promise<AuditLogEntry[]> {
    return this.fallbackAdapter.getAuditLogs(limit);
  }

  private queueBackgroundSync(task: () => Promise<void>): void {
    this.writeBatchQueue.push(task);
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.isProcessingQueue = true;
    while (this.writeBatchQueue.length > 0) {
      const task = this.writeBatchQueue.shift();
      if (task) {
        try {
          await task();
        } catch (err) {
          console.error('[GoogleSheetsAdapter] Error executing queued sheet write:', err);
        }
      }
      // Modest pause between Google Sheets writes to obey quotas (100 requests per 100 seconds)
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    this.isProcessingQueue = false;
  }
}
