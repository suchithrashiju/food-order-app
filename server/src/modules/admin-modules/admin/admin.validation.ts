import { z } from 'zod';

export const seedAdminSchema = z
  .object({
    seedSecret: z.string().trim().min(1).optional(),
  })
  .strict();

export const adminLoginSchema = z
  .object({
    username: z.string().trim().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type SeedAdminInput = z.infer<typeof seedAdminSchema>;
