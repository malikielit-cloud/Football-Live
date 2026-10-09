import { z } from 'zod';

export const SponsorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  logoUrl: z.string(),
  bannerUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  tagline: z.string().optional(),
  taglineKhmer: z.string().optional(),
  active: z.boolean().default(true),
  displayDurationSeconds: z.number().int().min(3).max(120).default(10),
  priorityOrder: z.number().int().default(1),
});

export const TickerMessageSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  textKhmer: z.string().optional(),
  textArabic: z.string().optional(),
  active: z.boolean().default(true),
  priority: z.number().int().default(1),
});
