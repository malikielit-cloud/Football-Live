import { z } from 'zod';

export const RemoteActionTypeSchema = z.enum([
  'ADD_GOAL',
  'UNDO_GOAL',
  'START_CLOCK',
  'PAUSE_CLOCK',
  'RESUME_CLOCK',
  'RESET_CLOCK',
  'SET_CLOCK',
  'SET_PERIOD',
  'ADD_CARD',
  'SET_SCENE',
  'TOGGLE_SPONSOR',
  'SET_SPONSOR',
  'UPDATE_TICKER',
  'TOGGLE_LOWER_THIRD',
  'UPDATE_TEAMS',
  'END_MATCH',
]);

export const RemoteCommandSchema = z.object({
  commandId: z.string().min(1, 'commandId is required'),
  matchId: z.string().min(1, 'matchId is required'),
  userId: z.string().min(1, 'userId is required'),
  timestamp: z.number().int().positive(),
  expectedVersion: z.number().int().nonnegative(),
  action: RemoteActionTypeSchema,
  payload: z.any().optional().default({}),
});

export const GoalPayloadSchema = z.object({
  team: z.enum(['home', 'away']),
  playerName: z.string().optional(),
  playerNumber: z.number().int().optional(),
  minute: z.number().int().optional(),
});

export const CardPayloadSchema = z.object({
  team: z.enum(['home', 'away']),
  type: z.enum(['YELLOW', 'RED']),
  playerName: z.string().optional(),
  playerNumber: z.number().int().optional(),
  minute: z.number().int().optional(),
});

export const PeriodPayloadSchema = z.object({
  period: z.enum([
    'NOT_STARTED',
    'FIRST_HALF',
    'HALF_TIME',
    'SECOND_HALF',
    'EXTRA_TIME_1',
    'EXTRA_TIME_2',
    'PENALTIES',
    'FULL_TIME',
  ]),
});

export const ScenePayloadSchema = z.object({
  scene: z.enum([
    'MATCH_LIVE',
    'GOAL_CELEBRATION',
    'HALF_TIME',
    'FULL_TIME',
    'SPONSOR_FULLSCREEN',
    'STARTING_LINEUP',
    'MATCH_RESULT',
  ]),
});

export const TickerPayloadSchema = z.object({
  visible: z.boolean().optional(),
  text: z.string().optional(),
  speed: z.enum(['slow', 'medium', 'fast']).optional(),
  direction: z.enum(['ltr', 'rtl']).optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
});
