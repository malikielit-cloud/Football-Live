import { v4 as uuidv4 } from 'uuid';
import {
  MatchState,
  RemoteCommand,
  GoalEvent,
  CardEvent,
  MatchPeriod,
  BroadcastScene,
  SOCKET_EVENTS,
} from 'shared';
import { getDatabaseAdapter, MatchEventRecord } from '../database';
import { PairingCodeManager } from '../auth/pairingCodeManager';
import { AuditService } from './auditService';
import { Server as SocketIOServer } from 'socket.io';

export class MatchService {
  private static instance: MatchService;
  private matches: Map<string, MatchState> = new Map();
  private io: SocketIOServer | null = null;
  private clockInterval: NodeJS.Timeout | null = null;
  private snapshotInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startClockTicker();
    this.startSnapshotWorker();
  }

  static getInstance(): MatchService {
    if (!MatchService.instance) {
      MatchService.instance = new MatchService();
    }
    return MatchService.instance;
  }

  setSocketServer(io: SocketIOServer): void {
    this.io = io;
  }

  async initialize(): Promise<void> {
    const db = await getDatabaseAdapter();
    const storedMatches = await db.getMatches();

    for (const match of storedMatches) {
      // Ensure pairing code is active
      if (!match.pairingCode || (match.pairingCodeExpiresAt && Date.now() > match.pairingCodeExpiresAt)) {
        match.pairingCode = PairingCodeManager.generateCodeForMatch(match.id);
        match.pairingCodeExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
      }
      this.matches.set(match.id, match);
    }
    console.log(`[MatchService] Initialized with ${this.matches.size} active matches from database.`);
  }

  getMatch(matchId: string): MatchState | null {
    return this.matches.get(matchId) || null;
  }

  getAllMatches(): MatchState[] {
    return Array.from(this.matches.values());
  }

  async createMatch(matchData: Partial<MatchState>): Promise<MatchState> {
    const id = matchData.id || `match-${uuidv4().slice(0, 8)}`;
    const pairingCode = PairingCodeManager.generateCodeForMatch(id);

    const match: MatchState = {
      id,
      tournamentId: matchData.tournamentId || 'tour-default',
      tournamentName: matchData.tournamentName || 'Football Championship',
      homeTeam: matchData.homeTeam || {
        id: 'team-h',
        name: 'Home Team',
        nameKhmer: 'ក្រុមម្ចាស់ផ្ទះ',
        shortName: 'HOM',
        logo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=128&auto=format&fit=crop&q=80',
        primaryColor: '#c53030',
      },
      awayTeam: matchData.awayTeam || {
        id: 'team-a',
        name: 'Away Team',
        nameKhmer: 'ក្រុមភ្ញៀវ',
        shortName: 'AWY',
        logo: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=128&auto=format&fit=crop&q=80',
        primaryColor: '#2b6cb0',
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
        title: 'PRO FOOTBALL LIVE',
        subtitle: 'Live Broadcast Match',
      },
      sponsorBanner: {
        visible: false,
        name: 'Official Partner',
        logoUrl: '',
        text: 'Live Football Broadcast',
        durationSeconds: 15,
      },
      ticker: {
        visible: true,
        text: 'Welcome to Pro Football Live Studio v2',
        speed: 'medium',
        direction: 'ltr',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        opacity: 0.9,
        fontSize: 16,
      },
      version: 1,
      pairingCode,
      pairingCodeExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      status: 'LIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.matches.set(id, match);
    const db = await getDatabaseAdapter();
    await db.saveMatch(match);
    return match;
  }

  // Authoritative Command Execution
  async executeCommand(command: RemoteCommand): Promise<{ match: MatchState; eventRecord?: MatchEventRecord }> {
    const match = this.matches.get(command.matchId);
    if (!match) {
      throw new Error(`Match ${command.matchId} not found`);
    }

    let eventRecord: MatchEventRecord | undefined;
    const currentMinute = Math.max(1, Math.ceil(match.clock.seconds / 60));

    switch (command.action) {
      case 'ADD_GOAL': {
        const payload = command.payload;
        if (payload.team === 'home') {
          match.homeScore += 1;
        } else {
          match.awayScore += 1;
        }

        const teamName = payload.team === 'home' ? match.homeTeam.name : match.awayTeam.name;
        const goalEvent: GoalEvent = {
          id: `goal-${uuidv4().slice(0, 8)}`,
          team: payload.team,
          teamName,
          playerName: payload.playerName || undefined,
          playerNumber: payload.playerNumber || undefined,
          minute: payload.minute || currentMinute,
          timestamp: Date.now(),
        };
        match.lastGoalEvent = goalEvent;

        // Auto trigger Goal Celebration scene momentarily
        match.activeScene = 'GOAL_CELEBRATION';

        eventRecord = {
          id: goalEvent.id,
          matchId: match.id,
          minute: goalEvent.minute,
          eventType: 'GOAL',
          details: `Goal for ${teamName} (${match.homeScore}-${match.awayScore})`,
          timestamp: Date.now(),
        };
        break;
      }

      case 'UNDO_GOAL': {
        const payload = command.payload;
        if (payload.team === 'home' && match.homeScore > 0) {
          match.homeScore -= 1;
        } else if (payload.team === 'away' && match.awayScore > 0) {
          match.awayScore -= 1;
        } else if (!payload.team) {
          // If no team specified, undo last goal
          if (match.lastGoalEvent?.team === 'home' && match.homeScore > 0) {
            match.homeScore -= 1;
          } else if (match.lastGoalEvent?.team === 'away' && match.awayScore > 0) {
            match.awayScore -= 1;
          }
        }
        match.lastGoalEvent = null;
        if (match.activeScene === 'GOAL_CELEBRATION') {
          match.activeScene = 'MATCH_LIVE';
        }

        eventRecord = {
          id: `undo-${uuidv4().slice(0, 8)}`,
          matchId: match.id,
          minute: currentMinute,
          eventType: 'GOAL',
          details: `Goal Undone. Current score: ${match.homeScore}-${match.awayScore}`,
          timestamp: Date.now(),
        };
        break;
      }

      case 'START_CLOCK':
      case 'RESUME_CLOCK': {
        if (!match.clock.running) {
          match.clock.running = true;
          match.clock.lastStartedTimestamp = Date.now();
        }
        break;
      }

      case 'PAUSE_CLOCK': {
        if (match.clock.running) {
          if (match.clock.lastStartedTimestamp) {
            const elapsed = Math.floor((Date.now() - match.clock.lastStartedTimestamp) / 1000);
            match.clock.seconds += elapsed;
          }
          match.clock.running = false;
          match.clock.lastStartedTimestamp = null;
        }
        break;
      }

      case 'RESET_CLOCK': {
        match.clock.running = false;
        match.clock.seconds = 0;
        match.clock.addedSeconds = 0;
        match.clock.lastStartedTimestamp = null;
        break;
      }

      case 'SET_CLOCK': {
        const { seconds, addedSeconds } = command.payload;
        if (typeof seconds === 'number') match.clock.seconds = seconds;
        if (typeof addedSeconds === 'number') match.clock.addedSeconds = addedSeconds;
        if (match.clock.running) {
          match.clock.lastStartedTimestamp = Date.now();
        }
        break;
      }

      case 'SET_PERIOD': {
        const newPeriod: MatchPeriod = command.payload.period;
        match.period = newPeriod;

        if (newPeriod === 'HALF_TIME') {
          match.clock.running = false;
          match.clock.lastStartedTimestamp = null;
          match.clock.seconds = 2700; // 45:00
          match.activeScene = 'HALF_TIME';
        } else if (newPeriod === 'SECOND_HALF') {
          match.clock.seconds = 2700;
          match.clock.addedSeconds = 0;
          match.activeScene = 'MATCH_LIVE';
        } else if (newPeriod === 'FULL_TIME') {
          match.clock.running = false;
          match.clock.lastStartedTimestamp = null;
          match.activeScene = 'FULL_TIME';
        }

        eventRecord = {
          id: `period-${uuidv4().slice(0, 8)}`,
          matchId: match.id,
          minute: currentMinute,
          eventType: 'PERIOD_CHANGE',
          details: `Period changed to ${newPeriod}`,
          timestamp: Date.now(),
        };
        break;
      }

      case 'ADD_CARD': {
        const payload = command.payload;
        const teamName = payload.team === 'home' ? match.homeTeam.name : match.awayTeam.name;
        const cardEvent: CardEvent = {
          id: `card-${uuidv4().slice(0, 8)}`,
          team: payload.team,
          type: payload.type,
          playerName: payload.playerName || undefined,
          playerNumber: payload.playerNumber || undefined,
          minute: payload.minute || currentMinute,
          timestamp: Date.now(),
        };
        match.lastCardEvent = cardEvent;

        eventRecord = {
          id: cardEvent.id,
          matchId: match.id,
          minute: cardEvent.minute,
          eventType: payload.type === 'YELLOW' ? 'YELLOW_CARD' : 'RED_CARD',
          details: `${payload.type} Card for ${teamName}`,
          timestamp: Date.now(),
        };
        break;
      }

      case 'SET_SCENE': {
        const scene: BroadcastScene = command.payload.scene;
        match.activeScene = scene;

        eventRecord = {
          id: `scene-${uuidv4().slice(0, 8)}`,
          matchId: match.id,
          minute: currentMinute,
          eventType: 'SCENE_CHANGE',
          details: `Switched scene to ${scene}`,
          timestamp: Date.now(),
        };
        break;
      }

      case 'TOGGLE_SPONSOR': {
        match.sponsorBanner.visible =
          typeof command.payload.visible === 'boolean'
            ? command.payload.visible
            : !match.sponsorBanner.visible;
        break;
      }

      case 'SET_SPONSOR': {
        match.sponsorBanner = {
          ...match.sponsorBanner,
          ...command.payload,
        };
        break;
      }

      case 'UPDATE_TICKER': {
        match.ticker = {
          ...match.ticker,
          ...command.payload,
        };
        break;
      }

      case 'TOGGLE_LOWER_THIRD': {
        match.lowerThird.visible =
          typeof command.payload.visible === 'boolean'
            ? command.payload.visible
            : !match.lowerThird.visible;
        if (command.payload.title) match.lowerThird.title = command.payload.title;
        if (command.payload.subtitle) match.lowerThird.subtitle = command.payload.subtitle;
        break;
      }

      case 'UPDATE_TEAMS': {
        if (command.payload.homeTeam) {
          match.homeTeam = { ...match.homeTeam, ...command.payload.homeTeam };
        }
        if (command.payload.awayTeam) {
          match.awayTeam = { ...match.awayTeam, ...command.payload.awayTeam };
        }
        break;
      }

      case 'END_MATCH': {
        match.status = 'COMPLETED';
        match.period = 'FULL_TIME';
        match.clock.running = false;
        match.clock.lastStartedTimestamp = null;
        match.activeScene = 'MATCH_RESULT';
        break;
      }

      default:
        throw new Error(`Unhandled action: ${command.action}`);
    }

    // Authoritative Version Increment
    match.version += 1;
    match.updatedAt = new Date().toISOString();

    // Persist event if created
    const db = await getDatabaseAdapter();
    if (eventRecord) {
      await db.addMatchEvent(eventRecord);
    }

    // Audit log
    await AuditService.log(
      command.userId,
      command.action,
      `Command executed on match ${match.id} (v${match.version})`,
      match.id
    );

    return { match, eventRecord };
  }

  // Clock ticker runs every 1s on server to maintain precision
  private startClockTicker(): void {
    this.clockInterval = setInterval(() => {
      let anyRunning = false;
      const now = Date.now();

      for (const match of this.matches.values()) {
        if (match.clock.running && match.clock.lastStartedTimestamp) {
          anyRunning = true;
          const elapsed = Math.floor((now - match.clock.lastStartedTimestamp) / 1000);
          const currentTotalSeconds = match.clock.seconds + elapsed;

          // Emit clock sync to room every 2 seconds or on boundaries
          if (this.io && currentTotalSeconds % 2 === 0) {
            this.io.to(`match:${match.id}`).emit(SOCKET_EVENTS.CLOCK_START, {
              matchId: match.id,
              seconds: currentTotalSeconds,
              running: true,
              addedSeconds: match.clock.addedSeconds,
              version: match.version,
            });
          }
        }
      }
    }, 1000);
  }

  // Periodic Snapshot Worker (Persists state snapshots every 15s to surviving storage)
  private startSnapshotWorker(): void {
    this.snapshotInterval = setInterval(async () => {
      try {
        const db = await getDatabaseAdapter();
        for (const match of this.matches.values()) {
          // Compute real-time clock seconds before snapshotting
          if (match.clock.running && match.clock.lastStartedTimestamp) {
            const elapsed = Math.floor((Date.now() - match.clock.lastStartedTimestamp) / 1000);
            match.clock.seconds += elapsed;
            match.clock.lastStartedTimestamp = Date.now();
          }
          await db.saveMatchSnapshot(match);
        }
      } catch (err) {
        console.error('[MatchService] Snapshot worker failed:', err);
      }
    }, 15000);
  }

  async destroy(): Promise<void> {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.snapshotInterval) clearInterval(this.snapshotInterval);
  }
}
