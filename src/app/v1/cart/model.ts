import { Product } from '@v1/types';
import { Document, model, Model, Schema } from 'mongoose';
import { Cart } from '@v1/types';
import { ProductModel } from '@v1/product/model';
import createHttpError from 'http-errors';

const cart = new Schema<Cart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'product',
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        total: {
          type: Number,
          required: true,
        },
      },
    ],
    totalQuantity: {
      type: Number,
      required: true,
    },
    subTotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      getters: false,
      aliases: true,
    },
    toObject: {
      virtuals: true,
      getters: false,
    },
  },
);

cart.virtual('items.product', {
  ref: 'product',
  localField: 'items.productId',
  foreignField: '_id',
  justOne: true,
});

cart.pre(/save|update/i, async function (this: Document<Cart>, next) {
  // >> get items and productIds
  const items = this.get('items') as Cart['items'];
  const productIds = items.map((item: Cart['items'][0]) => item.productId);

  // >> should not give same product twice separately
  if (productIds.length !== new Set(productIds).size) {
    throw createHttpError.BadRequest('Cannot add same product twice');
  }

  // >> calculate and set seperate item total and set price
  const products = await ProductModel.find({
    _id: { $in: productIds },
  });
  if (products.length !== productIds.length) {
    throw createHttpError.NotFound('Product not found');
  }
  const productsPrice = products.reduce(
    (acc: Record<string, number>, product: Product) => {
      acc[product._id.toString()] = product.price;
      return acc;
    },
    {},
  );
  items.forEach((item) => {
    item.total = productsPrice[item.productId.toString()] * item.quantity;
    item.price = productsPrice[item.productId.toString()];
  });

  // >> calculate  and set cart totalQuantity, subTotal, total
  this.set(
    'totalQuantity',
    items.reduce((acc, item) => acc + item.quantity, 0),
  );
  this.set(
    'subTotal',
    items.reduce((acc, item) => acc + item.total, 0),
  );
  this.set('total', this.get('subTotal') - (this.get('discount') ?? 0));
  next();
});

export const CartModel: Model<Cart> = model<Cart>('cart', cart);
