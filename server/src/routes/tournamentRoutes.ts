import { Router, Request, Response } from 'express';
import { getDatabaseAdapter } from '../database';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

// GET /api/tournaments
router.get('/', async (req: Request, res: Response) => {
  const db = await getDatabaseAdapter();
  const tournaments = await db.getTournaments();
  res.json({ tournaments });
});

// POST /api/tournaments
router.post('/', requireAuth, requireRole('OPERATOR'), async (req: Request, res: Response) => {
  const db = await getDatabaseAdapter();
  const tournament = {
    ...req.body,
    id: req.body.id || `tour-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  await db.saveTournament(tournament);
  res.status(201).json({ tournament });
});

export default router;
