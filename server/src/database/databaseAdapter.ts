import {
  MatchState,
  Tournament,
  Sponsor,
  TickerMessage,
  UserWithPassword,
  GoalEvent,
  CardEvent,
} from 'shared';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  matchId?: string;
  details: string;
  ipAddress?: string;
}

export interface MatchEventRecord {
  id: string;
  matchId: string;
  timestamp: number;
  minute: number;
  eventType: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'PERIOD_CHANGE' | 'SCENE_CHANGE';
  details: string;
}

export interface DatabaseAdapter {
  init(): Promise<void>;

  // Users
  getUsers(): Promise<UserWithPassword[]>;
  getUserByEmail(email: string): Promise<UserWithPassword | null>;
  saveUser(user: UserWithPassword): Promise<void>;

  // Tournaments
  getTournaments(): Promise<Tournament[]>;
  getTournamentById(id: string): Promise<Tournament | null>;
  saveTournament(tournament: Tournament): Promise<void>;

  // Matches & Sessions
  getMatches(): Promise<MatchState[]>;
  getMatchById(id: string): Promise<MatchState | null>;
  saveMatch(match: MatchState): Promise<void>;
  saveMatchSnapshot(match: MatchState): Promise<void>;
  getActiveMatchSnapshots(): Promise<MatchState[]>;

  // Events & History
  addMatchEvent(event: MatchEventRecord): Promise<void>;
  getMatchEvents(matchId: string): Promise<MatchEventRecord[]>;

  // Sponsors & Tickers
  getSponsors(): Promise<Sponsor[]>;
  saveSponsor(sponsor: Sponsor): Promise<void>;
  deleteSponsor(id: string): Promise<void>;

  getTickerMessages(): Promise<TickerMessage[]>;
  saveTickerMessage(msg: TickerMessage): Promise<void>;
  deleteTickerMessage(id: string): Promise<void>;

  // Audit Logs
  addAuditLog(log: AuditLogEntry): Promise<void>;
  getAuditLogs(limit?: number): Promise<AuditLogEntry[]>;
}
