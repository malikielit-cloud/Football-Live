import { Router, Request, Response } from 'express';
import { MatchService } from '../services/matchService';
import { PairingCodeManager } from '../auth/pairingCodeManager';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { getDatabaseAdapter } from '../database';

const router = Router();
const matchService = MatchService.getInstance();

// GET /api/matches - list all matches
router.get('/', (req: Request, res: Response) => {
  const matches = matchService.getAllMatches();
  res.json({ matches });
});

// GET /api/matches/:id - get match state
router.get('/:id', (req: Request, res: Response) => {
  const match = matchService.getMatch(req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }
  res.json({ match });
});

// POST /api/matches - create match (requires OPERATOR or ADMIN)
router.post('/', requireAuth, requireRole('OPERATOR'), async (req: Request, res: Response) => {
  try {
    const match = await matchService.createMatch(req.body);
    res.status(201).json({ match });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/matches/:id/pair-code - get or refresh pairing code
router.get('/:id/pair-code', (req: Request, res: Response) => {
  const match = matchService.getMatch(req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  let code = PairingCodeManager.getCodeForMatch(match.id);
  if (!code) {
    code = PairingCodeManager.generateCodeForMatch(match.id);
  }

  res.json({
    matchId: match.id,
    pairingCode: code,
    expiresAt: Date.now() + 4 * 60 * 60 * 1000,
  });
});

// GET /api/matches/:id/events - event log
router.get('/:id/events', async (req: Request, res: Response) => {
  const db = await getDatabaseAdapter();
  const events = await db.getMatchEvents(req.params.id);
  res.json({ events });
});

export default router;
