import path from 'path';
import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from root or server dir
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { initializeSocketServer } from './websocket/socketServer';
import { getDatabaseAdapter } from './database';
import { MatchService } from './services/matchService';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import matchRoutes from './routes/matchRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import sponsorRoutes from './routes/sponsorRoutes';
import streamRoutes from './routes/streamRoutes';

const app = express();
const httpServer = http.createServer(app);

const PORT = parseInt(process.env.PORT || '5000', 10);

// Basic middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

// Mount API routes
app.use('/health', healthRoutes);
app.use('/api', apiRateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/stream', streamRoutes);

// Serve Client static build in production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexHtml = path.join(clientDistPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Pro Football Live Studio Server</title></head>
        <body style="font-family:sans-serif;padding:40px;background:#0f172a;color:#f8fafc;">
          <h1>🏟️ Pro Football Live Studio v2 API</h1>
          <p>Backend API and WebSocket Server is running on port ${PORT}.</p>
          <p>Status: <a href="/health" style="color:#38bdf8;">/health</a></p>
          <p>Please run the client build or frontend development server to view the UI.</p>
        </body>
        </html>
      `);
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize Socket.io and background services
async function bootstrap() {
  try {
    console.log('[Bootstrap] Initializing database adapter...');
    const db = await getDatabaseAdapter();

    console.log('[Bootstrap] Initializing match service...');
    const matchService = MatchService.getInstance();
    await matchService.initialize();

    console.log('[Bootstrap] Initializing WebSocket server...');
    initializeSocketServer(httpServer);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🏟️  PRO FOOTBALL LIVE STUDIO v2 SERVER RUNNING`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database Adapter: ${process.env.DB_ADAPTER || 'file'}`);
      console.log(`⚡ WebSocket: ws://0.0.0.0:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[Bootstrap] Fatal startup error:', err);
    process.exit(1);
  }
}

// Graceful Shutdown
function handleShutdown(signal: string) {
  console.log(`[Shutdown] Received ${signal}. Starting graceful shutdown...`);
  httpServer.close(async () => {
    console.log('[Shutdown] Closed remaining HTTP/WebSocket connections.');
    try {
      const matchService = MatchService.getInstance();
      await matchService.destroy();
      console.log('[Shutdown] Persisted final match state snapshots.');
    } catch (e) {
      console.error('[Shutdown] Error persisting final snapshots:', e);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

bootstrap();
