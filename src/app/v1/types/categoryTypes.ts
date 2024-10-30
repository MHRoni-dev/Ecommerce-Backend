// Category Type
export type Category = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  parrentCategoryId?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Category Variants
export type CategoryCreatePayload = Omit<
  Category,
  '_id' | 'createdAt' | 'updatedAt'
>;
export type CategoryCreateInput = Omit<CategoryCreatePayload, 'slug'>;

export type CategoryUpdatePayload = Partial<CategoryCreatePayload>;
export type CategoryUpdateInput = Partial<CategoryCreateInput>;
