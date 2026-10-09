import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
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

interface DatabaseSchema {
  users: UserWithPassword[];
  tournaments: Tournament[];
  matches: MatchState[];
  matchSnapshots: Record<string, MatchState>;
  matchEvents: MatchEventRecord[];
  sponsors: Sponsor[];
  tickerMessages: TickerMessage[];
  auditLogs: AuditLogEntry[];
}

export class JsonFileAdapter implements DatabaseAdapter {
  private dataDir: string;
  private filePath: string;
  private data: DatabaseSchema;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(customPath?: string) {
    this.dataDir = customPath || path.resolve(__dirname, '../../data');
    this.filePath = path.join(this.dataDir, 'db.json');
    this.data = {
      users: [],
      tournaments: [],
      matches: [],
      matchSnapshots: {},
      matchEvents: [],
      sponsors: [],
      tickerMessages: [],
      auditLogs: [],
    };
  }

  async init(): Promise<void> {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
        console.log(`[JsonFileAdapter] Loaded database from ${this.filePath}`);
      } catch (err) {
        console.error('[JsonFileAdapter] Error reading existing db.json, creating initial backup:', err);
      }
    }

    // Seed default admin and sample match if empty
    if (!this.data.users || this.data.users.length === 0) {
      await this.seedDefaults();
    }
  }

  private async persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        const tempPath = `${this.filePath}.tmp`;
        await fs.promises.writeFile(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
        await fs.promises.rename(tempPath, this.filePath);
      } catch (err) {
        console.error('[JsonFileAdapter] Failed to persist db.json:', err);
      }
    });
    return this.writeQueue;
  }

  private async seedDefaults(): Promise<void> {
    console.log('[JsonFileAdapter] Seeding initial sample tournament, teams, match, and sponsors...');
    const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'FootballAdmin2026!Secure', 10);
    
    this.data.users = [
      {
        id: 'usr-admin-1',
        email: process.env.ADMIN_EMAIL || 'admin@profootball.live',
        name: 'Main Broadcast Director',
        role: 'ADMIN',
        passwordHash: adminPasswordHash,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-operator-1',
        email: 'operator@profootball.live',
        name: 'Pitch-side Operator',
        role: 'OPERATOR',
        passwordHash: await bcrypt.hash('Operator2026!', 10),
        createdAt: new Date().toISOString(),
      },
    ];

    const sampleTournament: Tournament = {
      id: 'tour-premier-2026',
      name: 'Khmer Premier League 2026',
      nameKhmer: 'លីគកំពូលកម្ពុជា ២០២៦',
      season: '2026',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.data.tournaments = [sampleTournament];

    const sampleMatch: MatchState = {
      id: 'match-live-01',
      tournamentId: sampleTournament.id,
      tournamentName: sampleTournament.nameKhmer || sampleTournament.name,
      homeTeam: {
        id: 'team-phnom-penh',
        name: 'Phnom Penh Crown',
        nameKhmer: 'ភ្នំពេញក្រោន',
        shortName: 'PPC',
        logo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=128&auto=format&fit=crop&q=80',
        primaryColor: '#c53030', // Red
      },
      awayTeam: {
        id: 'team-visakha',
        name: 'Visakha FC',
        nameKhmer: 'វិសាខា',
        shortName: 'VIS',
        logo: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=128&auto=format&fit=crop&q=80',
        primaryColor: '#2b6cb0', // Blue
      },
      homeScore: 0,
      awayScore: 0,
      period: 'FIRST_HALF',
      clock: {
        running: false,
        seconds: 0,
        addedSeconds: 0,
        lastStartedTimestamp: null,
      },
      activeScene: 'MATCH_LIVE',
      lastGoalEvent: null,
      lastCardEvent: null,
      lowerThird: {
        visible: false,
        title: 'WELCOME TO LIVE STREAM',
        subtitle: 'Khmer Premier League • Matchday 14',
      },
      sponsorBanner: {
        visible: false,
        name: 'CAMBODIA BEER',
        logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
        text: 'Official Partner',
        durationSeconds: 15,
      },
      ticker: {
        visible: true,
        text: 'សូមស្វាគមន៍មកកាន់ការផ្សាយផ្ទាល់ការប្រកួតបាល់ទាត់ជាតិ • WELCOME TO PRO FOOTBALL LIVE STUDIO • مرحباً بكم في البث المباشر',
        speed: 'medium',
        direction: 'ltr',
        backgroundColor: '#0f172a',
        textColor: '#f8fafc',
        opacity: 0.9,
        fontSize: 16,
      },
      version: 1,
      pairingCode: '889922',
      pairingCodeExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      status: 'LIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.matches = [sampleMatch];
    this.data.matchSnapshots[sampleMatch.id] = sampleMatch;

    this.data.sponsors = [
      {
        id: 'sp-1',
        name: 'Cambodia Telecom',
        logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
        active: true,
        displayDurationSeconds: 15,
        priorityOrder: 1,
        tagline: 'Fastest 5G Network in Cambodia',
        taglineKhmer: 'បណ្តាញ 5G ល្បឿនលឿនបំផុត',
      },
      {
        id: 'sp-2',
        name: 'ABA Bank',
        logoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80',
        active: true,
        displayDurationSeconds: 15,
        priorityOrder: 2,
        tagline: 'Cambodia\'s Leading Digital Bank',
        taglineKhmer: 'ធនាគារឌីជីថលឈានមុខគេ',
      },
    ];

    this.data.tickerMessages = [
      {
        id: 'tick-1',
        text: 'Pro Football Live Studio v2 — Seamless Mobile Broadcast Graphics',
        textKhmer: 'ការផ្សាយផ្ទាល់គុណភាពខ្ពស់ គ្រប់គ្រងដោយទូរស័ព្ទដៃពីរគ្រឿង',
        textArabic: 'بث مباشر عالي الجودة بتحكم لاسلكي عبر الهاتف',
        active: true,
        priority: 1,
      },
    ];

    await this.persist();
  }

  async getUsers(): Promise<UserWithPassword[]> {
    return [...this.data.users];
  }

  async getUserByEmail(email: string): Promise<UserWithPassword | null> {
    const user = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  }

  async saveUser(user: UserWithPassword): Promise<void> {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    await this.persist();
  }

  async getTournaments(): Promise<Tournament[]> {
    return [...this.data.tournaments];
  }

  async getTournamentById(id: string): Promise<Tournament | null> {
    return this.data.tournaments.find((t) => t.id === id) || null;
  }

  async saveTournament(tournament: Tournament): Promise<void> {
    const idx = this.data.tournaments.findIndex((t) => t.id === tournament.id);
    if (idx >= 0) {
      this.data.tournaments[idx] = tournament;
    } else {
      this.data.tournaments.push(tournament);
    }
    await this.persist();
  }

  async getMatches(): Promise<MatchState[]> {
    return [...this.data.matches];
  }

  async getMatchById(id: string): Promise<MatchState | null> {
    return this.data.matches.find((m) => m.id === id) || null;
  }

  async saveMatch(match: MatchState): Promise<void> {
    const idx = this.data.matches.findIndex((m) => m.id === match.id);
    if (idx >= 0) {
      this.data.matches[idx] = match;
    } else {
      this.data.matches.push(match);
    }
    this.data.matchSnapshots[match.id] = match;
    await this.persist();
  }

  async saveMatchSnapshot(match: MatchState): Promise<void> {
    this.data.matchSnapshots[match.id] = match;
    const idx = this.data.matches.findIndex((m) => m.id === match.id);
    if (idx >= 0) {
      this.data.matches[idx] = match;
    }
    await this.persist();
  }

  async getActiveMatchSnapshots(): Promise<MatchState[]> {
    return Object.values(this.data.matchSnapshots);
  }

  async addMatchEvent(event: MatchEventRecord): Promise<void> {
    this.data.matchEvents.push(event);
    await this.persist();
  }

  async getMatchEvents(matchId: string): Promise<MatchEventRecord[]> {
    return this.data.matchEvents.filter((e) => e.matchId === matchId);
  }

  async getSponsors(): Promise<Sponsor[]> {
    return [...this.data.sponsors];
  }

  async saveSponsor(sponsor: Sponsor): Promise<void> {
    const idx = this.data.sponsors.findIndex((s) => s.id === sponsor.id);
    if (idx >= 0) {
      this.data.sponsors[idx] = sponsor;
    } else {
      this.data.sponsors.push(sponsor);
    }
    await this.persist();
  }

  async deleteSponsor(id: string): Promise<void> {
    this.data.sponsors = this.data.sponsors.filter((s) => s.id !== id);
    await this.persist();
  }

  async getTickerMessages(): Promise<TickerMessage[]> {
    return [...this.data.tickerMessages];
  }

  async saveTickerMessage(msg: TickerMessage): Promise<void> {
    const idx = this.data.tickerMessages.findIndex((t) => t.id === msg.id);
    if (idx >= 0) {
      this.data.tickerMessages[idx] = msg;
    } else {
      this.data.tickerMessages.push(msg);
    }
    await this.persist();
  }

  async deleteTickerMessage(id: string): Promise<void> {
    this.data.tickerMessages = this.data.tickerMessages.filter((t) => t.id !== id);
    await this.persist();
  }

  async addAuditLog(log: AuditLogEntry): Promise<void> {
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    await this.persist();
  }

  async getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    return this.data.auditLogs.slice(0, limit);
  }
}
