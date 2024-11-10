import z from 'zod';

export const cartZodSchema = z.array(
  z
    .object({
      productId: z
        .string()
        .trim()
        .regex(/^[a-f\d]{24}$/i),
      quantity: z.number().positive(),
    })
    .strip(),
);
