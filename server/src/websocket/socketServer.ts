import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../auth/jwt';
import { PairingCodeManager } from '../auth/pairingCodeManager';
import { setupMatchRoomHandlers } from './matchRoomHandler';
import { MatchService } from '../services/matchService';

export function initializeSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Attach io to MatchService for server-side broadcast ticks
  const matchService = MatchService.getInstance();
  matchService.setSocketServer(io);

  // Handshake authentication middleware
  io.use((socket: Socket, next) => {
    const auth = socket.handshake.auth;
    const token = auth?.token;
    const pairingCode = auth?.pairingCode;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        socket.data.user = decoded;
        return next();
      }
    }

    if (pairingCode) {
      const session = PairingCodeManager.validateCode(pairingCode);
      if (session) {
        socket.data.user = {
          userId: `paired-remote-${pairingCode}`,
          email: 'remote@operator.local',
          role: session.role,
          matchId: session.matchId,
        };
        return next();
      }
    }

    // Default to VIEWER if unauthenticated (allows public graphic overlays to receive live updates!)
    socket.data.user = {
      userId: `viewer-${socket.id.slice(0, 6)}`,
      email: 'viewer@public.stream',
      role: 'VIEWER',
    };
    next();
  });

  io.on('connection', (socket: Socket) => {
    setupMatchRoomHandlers(io, socket);
  });

  return io;
}
