import { Types } from 'mongoose';

export type Cart = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: Array<{
    productId: Types.ObjectId;
    price: number;
    quantity: number;
    total: number;
  }>;
  totalQuantity: number;
  subTotal: number;
  discount: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CartPayload = {
  userId: Cart['userId'];
  items: Pick<Cart['items'][0], 'productId' | 'quantity'>[];
};
