import { io, Socket } from 'socket.io-client';
import {
  SOCKET_EVENTS,
  MatchState,
  RemoteCommand,
  RemoteActionType,
  CommandAck,
  CommandError,
} from 'shared';
import { getStoredToken } from './api';

export interface ConnectionInfo {
  connected: boolean;
  latencyMs: number;
  reconnectAttempts: number;
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
}

class SocketClientManager {
  private socket: Socket | null = null;
  private currentMatchId: string | null = null;
  private stateListeners: Set<(state: MatchState) => void> = new Set();
  private connectionListeners: Set<(info: ConnectionInfo) => void> = new Set();
  private latestState: MatchState | null = null;
  private latencyMs = 0;
  private reconnectAttempts = 0;
  private pingInterval: any = null;

  init(pairingCode?: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const token = getStoredToken();
    const auth: Record<string, string> = {};
    if (token) auth.token = token;
    if (pairingCode) auth.pairingCode = pairingCode;

    this.socket = io({
      auth,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    this.setupListeners();
    this.startHeartbeat();
    return this.socket;
  }

  private notifyConnection(status: ConnectionInfo['status']) {
    const info: ConnectionInfo = {
      connected: this.socket?.connected || false,
      latencyMs: this.latencyMs,
      reconnectAttempts: this.reconnectAttempts,
      status,
    };
    this.connectionListeners.forEach((cb) => cb(info));
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketClient] Connected to server, ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.notifyConnection('connected');

      // Re-join match if reconnecting
      if (this.currentMatchId) {
        this.socket?.emit(SOCKET_EVENTS.JOIN_MATCH, { matchId: this.currentMatchId });
        this.socket?.emit(SOCKET_EVENTS.REQUEST_SYNC, { matchId: this.currentMatchId });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[SocketClient] Disconnected:', reason);
      this.notifyConnection('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts += 1;
      console.error('[SocketClient] Connect error:', error.message);
      this.notifyConnection('reconnecting');
    });

    this.socket.on(SOCKET_EVENTS.MATCH_STATE, (state: MatchState) => {
      this.latestState = state;
      this.stateListeners.forEach((cb) => cb(state));
    });

    this.socket.on(SOCKET_EVENTS.HEARTBEAT_PONG, (data: { clientTimestamp: number; serverTimestamp: number }) => {
      this.latencyMs = Math.max(1, Date.now() - data.clientTimestamp);
      this.notifyConnection(this.socket?.connected ? 'connected' : 'disconnected');
    });
  }

  private startHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit(SOCKET_EVENTS.HEARTBEAT_PING, Date.now());
      }
    }, 4000);
  }

  joinMatch(matchId: string) {
    this.currentMatchId = matchId;
    if (this.socket && this.socket.connected) {
      this.socket.emit(SOCKET_EVENTS.JOIN_MATCH, { matchId });
    }
  }

  subscribe(callback: (state: MatchState) => void) {
    this.stateListeners.add(callback);
    if (this.latestState) callback(this.latestState);
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  onConnectionChange(callback: (info: ConnectionInfo) => void) {
    this.connectionListeners.add(callback);
    this.notifyConnection(this.socket?.connected ? 'connected' : 'disconnected');
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  async sendCommand(
    action: RemoteActionType,
    payload: any = {},
    userId = 'remote-user'
  ): Promise<CommandAck> {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Network offline: Unable to execute command');
    }

    if (!this.currentMatchId) {
      throw new Error('No match session selected');
    }

    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const expectedVersion = this.latestState ? this.latestState.version : 0;

    const command: RemoteCommand = {
      commandId,
      matchId: this.currentMatchId,
      userId,
      timestamp: Date.now(),
      expectedVersion,
      action,
      payload,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Command timeout: Server did not acknowledge within 4000ms'));
      }, 4000);

      const handleAck = (ack: CommandAck) => {
        if (ack.commandId === commandId) {
          cleanup();
          resolve(ack);
        }
      };

      const handleError = (err: CommandError) => {
        if (err.commandId === commandId) {
          cleanup();
          reject(new Error(err.error || `Command failed with code ${err.code}`));
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        this.socket?.off(SOCKET_EVENTS.COMMAND_ACK, handleAck);
        this.socket?.off(SOCKET_EVENTS.COMMAND_ERROR, handleError);
      };

      this.socket?.on(SOCKET_EVENTS.COMMAND_ACK, handleAck);
      this.socket?.on(SOCKET_EVENTS.COMMAND_ERROR, handleError);

      this.socket?.emit(SOCKET_EVENTS.EXECUTE_COMMAND, command);
    });
  }

  getLatestState(): MatchState | null {
    return this.latestState;
  }
}

export const socketClient = new SocketClientManager();
