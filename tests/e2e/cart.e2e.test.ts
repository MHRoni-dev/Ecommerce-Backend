import {
  clearDB,
  connectDB,
  deleteCollection,
  disconnectDB,
} from './utils/setup';
import app from '@src/app';
import request from 'supertest';
import { validNewUser } from './__fixtures__/userData';
import { AuthModel } from '@src/app/v1/user/model';
import { ProductModel } from '@src/app/v1/product/model';
import ProductArray from './__fixtures__/dummyProduct.json';
import { Product } from '@src/app/v1/types';

let accessToken = '';

beforeAll(async () => {
  await connectDB();
  await clearDB();
  accessToken = (await createVerifyAndLoginUser()).accessToken;
  for (let i = 0; i < 10; i++) {
    await request(app).post('/api/v1/product/create').send(ProductArray[i]);
  }
});

beforeEach(async () => {
  await deleteCollection('carts');
});

afterAll(async () => {
  await disconnectDB();
});

async function createVerifyAndLoginUser() {
  const registerRes = await request(app)
    .post('/api/v1/user/register')
    .send(validNewUser);
  expect(registerRes.status).toBe(201);

  const auth = await AuthModel.findOne({ email: validNewUser.email });
  const verifyRes = await request(app).get(
    `/api/v1/user/verify/${validNewUser.email}?otp=${auth!.otp}&token=${auth!.token}`,
  );
  expect(verifyRes.status).toBe(200);

  const loginRes = await request(app)
    .post('/api/v1/user/login')
    .send({ email: validNewUser.email, password: validNewUser.password });
  expect(loginRes.status).toBe(200);
  return loginRes.body;
}

async function setCart(token: string, cartData: object) {
  return await request(app)
    .post('/api/v1/cart/set')
    .set('Authorization', `Bearer ${token}`)
    .send(cartData);
}

async function deleteCart(token: string) {
  return await request(app)
    .delete('/api/v1/cart/clear')
    .set('Authorization', `Bearer ${token}`)
    .send();
}

async function readCart(token: string) {
  return await request(app)
    .get('/api/v1/cart/get')
    .set('Authorization', `Bearer ${token}`)
    .send();
}

describe('Cart E2E test', () => {
  describe('cart create and update', () => {
    it('should create and update cart', async () => {
      const allProducts = await ProductModel.find({});
      const products = allProducts.slice(0, 3);
      const cartData = products.map((product) => ({
        productId: product._id,
        quantity: 4,
      }));

      const subTotal = products.reduce((acc, product) => {
        acc += product.price * 4;
        return acc;
      }, 0);

      const res = await setCart(accessToken, cartData);
      expect(res.status).toBe(200);

      expect(res.body.cart).toHaveProperty('subTotal', subTotal);
      expect(res.body.cart).toHaveProperty('discount');
      expect(res.body.cart).toHaveProperty(
        'total',
        subTotal - res.body.cart.discount,
      );

      res.body.cart.items.forEach(
        (item: { productId: string; quantity: number; price: number }) => {
          expect(item).toHaveProperty('productId');
          expect(item).toHaveProperty('quantity', 4);
          expect(item).toHaveProperty(
            'price',
            products.find(
              (product: Product) =>
                product._id.toString() === item['productId'],
            )!.price,
          );
        },
      );
    });

    it('should update cart', async () => {
      const allProducts = await ProductModel.find({});
      const products = allProducts.slice(0, 3);
      const cartData = products.map((product) => ({
        productId: product._id,
        quantity: 4,
      }));

      const subTotal = products.reduce((acc, product) => {
        acc += product.price * 4;
        return acc;
      }, 0);

      const res = await setCart(accessToken, cartData);
      expect(res.status).toBe(200);

      expect(res.body.cart).toHaveProperty('subTotal', subTotal);
      expect(res.body.cart).toHaveProperty('discount');
      expect(res.body.cart).toHaveProperty(
        'total',
        subTotal - res.body.cart.discount,
      );

      const updateCartData = products.map((product) => ({
        productId: product._id,
        quantity: 2,
      }));

      const newSubTotal = products.reduce((acc, product) => {
        acc += product.price * 2;
        return acc;
      }, 0);

      const updateRes = await setCart(accessToken, updateCartData);
      expect(updateRes.status).toBe(200);

      expect(updateRes.body.cart).toHaveProperty('subTotal', newSubTotal);
      expect(updateRes.body.cart).toHaveProperty('discount');
      expect(updateRes.body.cart).toHaveProperty(
        'total',
        newSubTotal - updateRes.body.cart.discount,
      );

      updateRes.body.cart.items.forEach(
        (item: { productId: string; quantity: number; price: number }) => {
          expect(item).toHaveProperty('productId');
          expect(item).toHaveProperty('quantity', 2);
          expect(item).toHaveProperty(
            'price',
            products.find(
              (product: Product) =>
                product._id.toString() === item['productId'],
            )!.price,
          );
        },
      );
    });

    it('should not set cart with invalid data', async () => {
      const res = await setCart(accessToken, {});
      expect(res.status).toBe(400);
    });

    it('should not set cart with invalid productId', async () => {
      const res = await setCart(accessToken, [
        {
          productId: '67300cb35b545bdd8ea396cd',
          quantity: 4,
        },
      ]);
      expect(res.status).toBe(404);
    });

    it('should not set cart with out auth', async () => {
      const res = await request(app).post('/api/v1/cart/set').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('cart read', () => {
    it('should read cart', async () => {
      const allProducts = await ProductModel.find({});
      const products = allProducts.slice(0, 3);
      const setCartRes = await setCart(accessToken, [
        {
          productId: products[0]._id,
          quantity: 4,
        },
      ]);

      expect(setCartRes.status).toBe(200);

      const readRes = await readCart(accessToken);
      expect(readRes.status).toBe(200);

      expect(readRes.body.cart).toHaveProperty(
        'subTotal',
        products[0].price * 4,
      );
      expect(readRes.body.cart).toHaveProperty('discount');
      expect(readRes.body.cart).toHaveProperty(
        'total',
        products[0].price * 4 - readRes.body.cart.discount,
      );
      expect(readRes.body.cart.items.length).toBe(1);
      expect(readRes.body.cart.items[0]).toHaveProperty('product');
    });

    it('should return 404 if cart not found', async () => {
      const res = await readCart(accessToken);
      expect(res.status).toBe(404);
    });

    it('should not read cart with out auth', async () => {
      const res = await request(app).get('/api/v1/cart/get');
      expect(res.status).toBe(401);
    });
  });

  describe('cart delete', () => {
    it('should delete cart', async () => {
      const allProducts = await ProductModel.find({});
      const products = allProducts.slice(0, 3);
      const setCartRes = await setCart(accessToken, [
        {
          productId: products[0]._id,
          quantity: 4,
        },
      ]);

      expect(setCartRes.status).toBe(200);

      const deleteRes = await deleteCart(accessToken);
      expect(deleteRes.status).toBe(200);

      const readRes = await readCart(accessToken);
      expect(readRes.status).toBe(404);
    });

    it('should not delete cart with out auth', async () => {
      const res = await request(app).delete('/api/v1/cart/clear');
      expect(res.status).toBe(401);
    });

    it('should not return 404 if cart not found', async () => {
      const res = await deleteCart(accessToken);
      expect(res.status).toBe(200);
    });
  });
});
