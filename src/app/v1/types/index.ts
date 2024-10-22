import z from 'zod';
import { productDataZodSchema } from '@v1/product/schema';

export type IProduct = z.infer<typeof productDataZodSchema>;
