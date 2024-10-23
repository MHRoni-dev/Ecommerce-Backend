import { IProductRedirect } from './../types/index';
import { Schema, model, Model, Document, Types } from 'mongoose';
import { IProduct } from '@v1/types';

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

export const Product: Model<IProduct & Document> = model<IProduct & Document>(
  'product',
  product,
);

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

export const ProductRedirect: Model<IProductRedirect & Document> = model<
  IProductRedirect & Document
>('productRedirect', productRedirect);
