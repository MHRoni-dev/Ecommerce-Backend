import { ProductInput } from '@src/app/v1/product/schema';

export const newValidProductData: ProductInput = {
  title: 'Valid Product',
  price: 200
}

export const newInvalidProductData: any = {
  name: 'Test Product',
  description: "Test Product",
  price: '200',
  stock: '100'
}

export const validUpdateProductData: Partial<ProductInput> = {
  title: 'Updated Product',
  price: 10
}