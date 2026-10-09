import { Router, Request, Response } from 'express';
import { StreamGatewayService } from '../services/streamGatewayService';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();
const streamGateway = StreamGatewayService.getInstance();

// GET /api/stream/status
router.get('/status', (req: Request, res: Response) => {
  res.json({ health: streamGateway.getHealth() });
});

// POST /api/stream/start (operator/admin)
router.post('/start', requireAuth, requireRole('OPERATOR'), (req: Request, res: Response) => {
  const { testMode } = req.body;
  const health = streamGateway.startBroadcast(Boolean(testMode));
  res.json({ health });
});

// POST /api/stream/stop (operator/admin)
router.post('/stop', requireAuth, requireRole('OPERATOR'), (req: Request, res: Response) => {
  const health = streamGateway.stopBroadcast();
  res.json({ health });
});

export default router;
