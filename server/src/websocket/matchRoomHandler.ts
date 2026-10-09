import { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  RemoteCommand,
  CommandAck,
  CommandError,
} from 'shared';
import { MatchService } from '../services/matchService';
import { IdempotencyStore } from './idempotencyStore';
import { validateRemoteCommand } from './commandValidator';
import { canControlMatch } from '../auth/roles';

export function setupMatchRoomHandlers(io: Server, socket: Socket): void {
  const matchService = MatchService.getInstance();
  const user = (socket.data as any).user;

  // 1. Join Match Room
  socket.on(SOCKET_EVENTS.JOIN_MATCH, (payload: { matchId: string }) => {
    const { matchId } = payload;
    if (!matchId) {
      socket.emit(SOCKET_EVENTS.COMMAND_ERROR, {
        commandId: 'join',
        matchId: '',
        error: 'matchId is required to join room',
        code: 'MATCH_NOT_FOUND',
      } as CommandError);
      return;
    }

    const match = matchService.getMatch(matchId);
    if (!match) {
      socket.emit(SOCKET_EVENTS.COMMAND_ERROR, {
        commandId: 'join',
        matchId,
        error: `Match with ID ${matchId} does not exist`,
        code: 'MATCH_NOT_FOUND',
      } as CommandError);
      return;
    }

    socket.join(`match:${matchId}`);
    socket.data.matchId = matchId;

    console.log(`[Socket] Client ${socket.id} (${user?.role || 'VIEWER'}) joined room match:${matchId}`);

    // Send Authoritative Initial State immediately
    socket.emit(SOCKET_EVENTS.MATCH_STATE, match);

    // Notify room of client connection
    const roomSize = io.sockets.adapter.rooms.get(`match:${matchId}`)?.size || 1;
    io.to(`match:${matchId}`).emit(SOCKET_EVENTS.CLIENT_CONNECTED, {
      userId: user?.userId || socket.id,
      role: user?.role || 'VIEWER',
      totalConnections: roomSize,
      timestamp: Date.now(),
    });
  });

  // 2. Execute Remote Command
  socket.on(SOCKET_EVENTS.EXECUTE_COMMAND, async (rawCommand: any) => {
    // A. Validate Schema
    const validation = validateRemoteCommand(rawCommand);
    if (!validation.valid || !validation.command) {
      socket.emit(SOCKET_EVENTS.COMMAND_ERROR, validation.error);
      return;
    }

    const command = validation.command;
    const matchId = command.matchId;

    // B. Authorization check: Viewer cannot modify match
    const userRole = user?.role || 'VIEWER';
    if (!canControlMatch(userRole)) {
      socket.emit(SOCKET_EVENTS.COMMAND_ERROR, {
        commandId: command.commandId,
        matchId,
        error: 'Forbidden: Insufficient privileges to execute match commands',
        code: 'UNAUTHORIZED',
      } as CommandError);
      return;
    }

    // C. Idempotency Check: Prevent duplicate goal/cards on network retry
    if (IdempotencyStore.has(command.commandId)) {
      const cachedAck = IdempotencyStore.get(command.commandId);
      console.log(`[Socket] Idempotent command replay detected: ${command.commandId}`);
      if (cachedAck) {
        socket.emit(SOCKET_EVENTS.COMMAND_ACK, cachedAck);
      }
      return;
    }

    // D. Check Match Exists
    const match = matchService.getMatch(matchId);
    if (!match) {
      socket.emit(SOCKET_EVENTS.COMMAND_ERROR, {
        commandId: command.commandId,
        matchId,
        error: `Match ${matchId} not found`,
        code: 'MATCH_NOT_FOUND',
      } as CommandError);
      return;
    }

    // E. Optimistic Version Concurrency Check
    if (command.expectedVersion > 0 && command.expectedVersion !== match.version) {
      console.warn(
        `[Socket] Version mismatch on command ${command.commandId}: expected ${command.expectedVersion}, current ${match.version}`
      );
      socket.emit(SOCKET_EVENTS.COMMAND_ERROR, {
        commandId: command.commandId,
        matchId,
        error: `State version mismatch (Expected ${command.expectedVersion}, got ${match.version}). State re-sync required.`,
        code: 'VERSION_MISMATCH',
        currentVersion: match.version,
      } as CommandError);
      // Send fresh state so client catches up
      socket.emit(SOCKET_EVENTS.MATCH_STATE, match);
      return;
    }

    // F. Execute Authoritative Business Logic
    try {
      const result = await matchService.executeCommand(command);

      const ack: CommandAck = {
        commandId: command.commandId,
        matchId,
        success: true,
        version: result.match.version,
        message: `Action ${command.action} executed successfully`,
        timestamp: Date.now(),
      };

      // Store in idempotency cache
      IdempotencyStore.set(command.commandId, ack);

      // Ack the sender
      socket.emit(SOCKET_EVENTS.COMMAND_ACK, ack);

      // Broadcast authoritative state to all subscribers in the match room
      io.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_STATE, result.match);

      // Emit specific granular event
      if (command.action === 'ADD_GOAL' || command.action === 'UNDO_GOAL') {
        io.to(`match:${matchId}`).emit(SOCKET_EVENTS.SCORE_UPDATE, {
          matchId,
          homeScore: result.match.homeScore,
          awayScore: result.match.awayScore,
          lastGoalEvent: result.match.lastGoalEvent,
          version: result.match.version,
        });
      } else if (command.action === 'SET_SCENE') {
        io.to(`match:${matchId}`).emit(SOCKET_EVENTS.SCENE_CHANGE, {
          matchId,
          activeScene: result.match.activeScene,
          version: result.match.version,
        });
      } else if (command.action === 'UPDATE_TICKER') {
        io.to(`match:${matchId}`).emit(SOCKET_EVENTS.TICKER_UPDATE, {
          matchId,
          ticker: result.match.ticker,
          version: result.match.version,
        });
      } else if (command.action === 'TOGGLE_SPONSOR' || command.action === 'SET_SPONSOR') {
        io.to(`match:${matchId}`).emit(SOCKET_EVENTS.SPONSOR_CHANGE, {
          matchId,
          sponsorBanner: result.match.sponsorBanner,
          version: result.match.version,
        });
      }
    } catch (err: any) {
      console.error(`[Socket] Execution error for command ${command.commandId}:`, err);
      socket.emit(SOCKET_EVENTS.COMMAND_ERROR, {
        commandId: command.commandId,
        matchId,
        error: err.message || 'Execution error',
        code: 'INVALID_PAYLOAD',
      } as CommandError);
    }
  });

  // 3. Request Sync / Reconnect Recovery
  socket.on(SOCKET_EVENTS.REQUEST_SYNC, (payload: { matchId: string }) => {
    const match = matchService.getMatch(payload?.matchId);
    if (match) {
      socket.emit(SOCKET_EVENTS.SESSION_RESTORED, match);
      socket.emit(SOCKET_EVENTS.MATCH_STATE, match);
    }
  });

  // 4. Ping / Pong Heartbeat
  socket.on(SOCKET_EVENTS.HEARTBEAT_PING, (clientTimestamp: number) => {
    socket.emit(SOCKET_EVENTS.HEARTBEAT_PONG, {
      clientTimestamp,
      serverTimestamp: Date.now(),
    });
  });

  // 5. Disconnect
  socket.on('disconnect', () => {
    const matchId = socket.data.matchId;
    if (matchId) {
      const roomSize = io.sockets.adapter.rooms.get(`match:${matchId}`)?.size || 0;
      io.to(`match:${matchId}`).emit(SOCKET_EVENTS.CLIENT_DISCONNECTED, {
        userId: user?.userId || socket.id,
        totalConnections: roomSize,
        timestamp: Date.now(),
      });
    }
  });
}
