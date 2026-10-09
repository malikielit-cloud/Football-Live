import { Router, Request, Response } from 'express';
import { getDatabaseAdapter } from '../database';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

// GET /api/sponsors
router.get('/', async (req: Request, res: Response) => {
  const db = await getDatabaseAdapter();
  const sponsors = await db.getSponsors();
  res.json({ sponsors });
});

// POST /api/sponsors
router.post('/', requireAuth, requireRole('OPERATOR'), async (req: Request, res: Response) => {
  const db = await getDatabaseAdapter();
  const sponsor = {
    ...req.body,
    id: req.body.id || `sp-${Date.now()}`,
  };
  await db.saveSponsor(sponsor);
  res.status(201).json({ sponsor });
});

// DELETE /api/sponsors/:id
router.delete('/:id', requireAuth, requireRole('OPERATOR'), async (req: Request, res: Response) => {
  const db = await getDatabaseAdapter();
  await db.deleteSponsor(req.params.id);
  res.json({ success: true });
});

// GET /api/sponsors/ticker
router.get('/ticker', async (req: Request, res: Response) => {
  const db = await getDatabaseAdapter();
  const tickerMessages = await db.getTickerMessages();
  res.json({ tickerMessages });
});

// POST /api/sponsors/ticker
router.post('/ticker', requireAuth, requireRole('OPERATOR'), async (req: Request, res: Response) => {
  const db = await getDatabaseAdapter();
  const message = {
    ...req.body,
    id: req.body.id || `tick-${Date.now()}`,
  };
  await db.saveTickerMessage(message);
  res.status(201).json({ message });
});

export default router;
