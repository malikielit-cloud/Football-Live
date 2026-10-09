import { BroadcastScene, MatchPeriod } from './match';

export type RemoteActionType =
  | 'ADD_GOAL'
  | 'UNDO_GOAL'
  | 'START_CLOCK'
  | 'PAUSE_CLOCK'
  | 'RESUME_CLOCK'
  | 'RESET_CLOCK'
  | 'SET_CLOCK'
  | 'SET_PERIOD'
  | 'ADD_CARD'
  | 'SET_SCENE'
  | 'TOGGLE_SPONSOR'
  | 'SET_SPONSOR'
  | 'UPDATE_TICKER'
  | 'TOGGLE_LOWER_THIRD'
  | 'UPDATE_TEAMS'
  | 'END_MATCH';

export interface RemoteCommand<T = any> {
  commandId: string;
  matchId: string;
  userId: string;
  timestamp: number;
  expectedVersion: number;
  action: RemoteActionType;
  payload: T;
}

export interface CommandAck {
  commandId: string;
  matchId: string;
  success: boolean;
  version: number;
  message?: string;
  timestamp: number;
}

export interface CommandError {
  commandId: string;
  matchId: string;
  error: string;
  code: 'VERSION_MISMATCH' | 'UNAUTHORIZED' | 'INVALID_PAYLOAD' | 'MATCH_NOT_FOUND' | 'IDEMPOTENT_IGNORED';
  currentVersion?: number;
}
