export type MatchPeriod =
  | 'NOT_STARTED'
  | 'FIRST_HALF'
  | 'HALF_TIME'
  | 'SECOND_HALF'
  | 'EXTRA_TIME_1'
  | 'EXTRA_TIME_2'
  | 'PENALTIES'
  | 'FULL_TIME';

export type BroadcastScene =
  | 'MATCH_LIVE'
  | 'GOAL_CELEBRATION'
  | 'HALF_TIME'
  | 'FULL_TIME'
  | 'SPONSOR_FULLSCREEN'
  | 'STARTING_LINEUP'
  | 'MATCH_RESULT';

export interface TeamInfo {
  id: string;
  name: string;
  nameKhmer?: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor?: string;
}

export interface MatchClock {
  running: boolean;
  seconds: number;
  addedSeconds: number;
  lastStartedTimestamp: number | null;
}

export interface GoalEvent {
  id: string;
  team: 'home' | 'away';
  teamName: string;
  playerName?: string;
  playerNumber?: number;
  minute: number;
  timestamp: number;
}

export interface CardEvent {
  id: string;
  team: 'home' | 'away';
  type: 'YELLOW' | 'RED';
  playerName?: string;
  playerNumber?: number;
  minute: number;
  timestamp: number;
}

export interface LowerThirdState {
  visible: boolean;
  title: string;
  subtitle: string;
}

export interface SponsorBannerState {
  visible: boolean;
  sponsorId?: string;
  name?: string;
  logoUrl?: string;
  text?: string;
  durationSeconds?: number;
}

export interface TickerState {
  visible: boolean;
  text: string;
  speed: 'slow' | 'medium' | 'fast';
  direction: 'ltr' | 'rtl';
  backgroundColor: string;
  textColor: string;
  opacity: number;
  fontSize: number;
}

export interface MatchState {
  id: string;
  tournamentId: string;
  tournamentName: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore: number;
  awayScore: number;
  period: MatchPeriod;
  clock: MatchClock;
  activeScene: BroadcastScene;
  lastGoalEvent: GoalEvent | null;
  lastCardEvent: CardEvent | null;
  lowerThird: LowerThirdState;
  sponsorBanner: SponsorBannerState;
  ticker: TickerState;
  version: number;
  pairingCode: string;
  pairingCodeExpiresAt: number;
  status: 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'COMPLETED';
  streamStatus?: 'IDLE' | 'CONNECTING' | 'LIVE' | 'RECONNECTING' | 'ENDED' | 'ERROR';
  createdAt: string;
  updatedAt: string;
}
