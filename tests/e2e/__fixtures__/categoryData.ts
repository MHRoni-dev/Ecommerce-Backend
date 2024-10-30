import { CategoryCreateInput, CategoryUpdateInput } from '@src/app/v1/types';

export const validCategoryCreateInput: CategoryCreateInput = {
  title: 'Shirt',
  description: 'This is Shirt Category',
};

export const invalidCategoryCreateInput = {
  name: 'Shirt',
  parrentCategoryId: 4,
};

export const validCategoryUpdateInput: CategoryUpdateInput = {
  title: 'new Shirt',
  description: 'Shirt category is now new Shirt',
};
