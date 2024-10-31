import { Schema, model, Model, Types } from 'mongoose';
import { Category } from '@v1/types';

const category = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: String,
    parrentCategoryId: Types.ObjectId,
  },
  {
    versionKey: false,
    timeStamps: true,
  },
);

export const CategoryModel: Model<Category> = model<Category>(
  'category',
  category,
);
