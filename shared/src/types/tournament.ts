import { TeamInfo } from './match';

export interface Tournament {
  id: string;
  name: string;
  nameKhmer?: string;
  season: string;
  logoUrl?: string;
  status: 'UPCOMING' | 'ACTIVE' | 'FINISHED';
  createdAt: string;
}

export interface PlayerInfo {
  id: string;
  teamId: string;
  name: string;
  nameKhmer?: string;
  number: number;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  photoUrl?: string;
}

export interface TournamentMatchFixture {
  id: string;
  tournamentId: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  venue?: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
}
