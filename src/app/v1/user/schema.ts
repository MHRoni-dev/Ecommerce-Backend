import z from 'zod';

export const userCreateInputZodSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().trim().min(6),
});

export const userLoginInputZodSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().trim().min(6),
});

export const userProfileZodSchema = z
  .object({
    name: z.string().trim().optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9]{11}$/)
      .optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    dateOfBirth: z
      .string()
      .transform((d) => new Date(d))
      .optional(),
  })
  .strip();

export const validVerificationReqPurposeZodSchema = z
  .enum(['emailVerification', 'passwordReset'])
  .default('emailVerification');
