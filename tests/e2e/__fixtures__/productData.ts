import { ProductCreateInput, ProductUpdateInput } from '@src/app/v1/types';

export const newValidProductData: ProductCreateInput = {
  title: 'Valid Product',
  price: 200,
};

export const newInvalidProductData = {
  name: 'Test Product',
  description: 'Test Product',
  price: '200',
  stock: '100',
};

export const validUpdateProductData: ProductUpdateInput = {
  title: 'Updated Product',
  price: 10,
};
