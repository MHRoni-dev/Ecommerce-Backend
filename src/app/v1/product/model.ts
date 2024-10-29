import { ProductRedirect } from './../types/index';
import { Schema, model, Model, Types } from 'mongoose';
import { Product } from '@v1/types';

const rattingSchema = new Schema(
  {
    count: {
      type: Number,
      min: 0,
      required: true,
    },
    rate: {
      type: Number,
      min: 0,
      required: true,
    },
  },
  { _id: false },
);

const product = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    ratting: {
      type: rattingSchema,
      required: true,
    },
  },
  { versionKey: false, timestamps: true },
);

export const ProductModel: Model<Product> = model<Product>('product', product);

const productRedirect = new Schema(
  {
    productId: {
      type: Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const ProductRedirectModel: Model<ProductRedirect> =
  model<ProductRedirect>('productRedirect', productRedirect);
