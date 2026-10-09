import { Router, Request, Response } from 'express';
import { getDatabaseAdapter } from '../database';
import { comparePassword } from '../auth/bcrypt';
import { generateToken } from '../auth/jwt';
import { PairingCodeManager } from '../auth/pairingCodeManager';
import { authRateLimiter } from '../middleware/rateLimiter';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { MatchService } from '../services/matchService';

const router = Router();

// POST /api/auth/login
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = await getDatabaseAdapter();
  const user = await db.getUserByEmail(email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    token,
    expiresIn: '24h',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// POST /api/auth/pair (Phone B fast-connect with 6-digit code)
router.post('/pair', authRateLimiter, async (req: Request, res: Response) => {
  const { pairingCode } = req.body;

  if (!pairingCode) {
    return res.status(400).json({ error: 'Pairing code is required' });
  }

  const session = PairingCodeManager.validateCode(pairingCode.toString().trim());
  if (!session) {
    return res.status(404).json({ error: 'Invalid or expired 6-digit pairing code' });
  }

  const matchService = MatchService.getInstance();
  const match = matchService.getMatch(session.matchId);

  if (!match) {
    return res.status(404).json({ error: 'Associated match not found' });
  }

  const token = generateToken({
    userId: `paired-remote-${pairingCode}`,
    email: 'remote@operator.local',
    role: session.role,
    matchId: session.matchId,
  });

  res.json({
    matchId: match.id,
    matchName: `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
    role: session.role,
    token,
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
