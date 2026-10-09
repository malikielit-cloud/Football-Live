import { z } from 'zod';

export const TeamInfoSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  nameKhmer: z.string().optional(),
  shortName: z.string().min(1).max(5),
  logo: z.string().url().or(z.string()),
  primaryColor: z.string(),
  secondaryColor: z.string().optional(),
});

export const CreateMatchSchema = z.object({
  tournamentId: z.string(),
  tournamentName: z.string(),
  homeTeam: TeamInfoSchema,
  awayTeam: TeamInfoSchema,
});
