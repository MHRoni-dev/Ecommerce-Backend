import { Schema, model, Model, Document } from 'mongoose';
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
