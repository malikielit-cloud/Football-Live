import { User, UserRole } from './user';

export interface AuthTokens {
  token: string;
  expiresIn: string;
  user: User;
}

export interface PairingSession {
  matchId: string;
  pairingCode: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

export interface PairMatchRequest {
  pairingCode: string;
}

export interface PairMatchResponse {
  matchId: string;
  token: string;
  role: UserRole;
  matchName: string;
}
