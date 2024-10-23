import z from 'zod';
import { productDataZodSchema } from '@v1/product/schema';

export type IProductCreate = z.infer<typeof productDataZodSchema>;
export type IProduct = IProductCreate & MongooseDocument;

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
  productId: string;
  slug: string;
};

type MongooseDocument = {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};
