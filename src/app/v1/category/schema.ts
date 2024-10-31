import z from 'zod';

export const categoryCreateInputZodSchema = z.object({
  title: z.string().trim(),
  description: z.string().trim().optional(),
  parrentCategoryId: z.string().trim().uuid().optional(),
});

export const categoryUpdateInputZodSchema = categoryCreateInputZodSchema
  .strip()
  .optional();
