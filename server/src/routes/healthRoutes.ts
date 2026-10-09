import { Router, Request, Response } from 'express';
import { MatchService } from '../services/matchService';

const router = Router();
const startTime = Date.now();

// GET /health
router.get('/', (req: Request, res: Response) => {
  const matchService = MatchService.getInstance();
  const activeMatches = matchService.getAllMatches();

  res.json({
    status: 'healthy',
    service: 'pro-football-live-studio-server',
    version: '2.0.0',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    activeMatchesCount: activeMatches.length,
    databaseAdapter: process.env.DB_ADAPTER || 'file',
  });
});

export default router;
