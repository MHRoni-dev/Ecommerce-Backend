import z from 'zod';

export const userCreateInputZodSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().trim().min(6),
});

export const userLoginInputZodSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().trim().min(6),
});

export const userUpdateInputZodSchema = userCreateInputZodSchema
  .omit({ email: true })
  .partial();
