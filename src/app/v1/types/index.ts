import z from 'zod';
import { productDataZodSchema } from '@v1/product/schema';

export type IProduct = z.infer<typeof productDataZodSchema>;

export type IProductUpdate = {
  title?: string;
  price?: number;
  slug?: string;
  ratting?: {
    rate?: number;
    count?: number;
  };
};

export type IProductRedirect = {
  oldSlug: string;
  newSlug: string;
};
