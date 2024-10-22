import z from 'zod';

export const productInputZodSchema = z.object({
  title: z.string().trim(),
  price: z.number().positive(),
});

export type ProductInput = z.infer<typeof productInputZodSchema>;

export const productDataZodSchema = productInputZodSchema.extend({
  slug: z.string().trim(),
  ratting: z.object({
    count: z.number().positive().default(0),
    rate: z.number().min(0).max(5).default(0),
  }),
});
