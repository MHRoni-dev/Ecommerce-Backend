import { Request, Response, NextFunction } from 'express';
import { createSlug } from '@v1/lib/slug';
import { ProductInput, productInputZodSchema } from '@v1/product/schema';
import createHttpError from 'http-errors';
import { IProduct } from '@v1/types';
import { Product } from '@v1/product/model';

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // validate product data input
    const input = await productInputZodSchema.safeParseAsync(req.body);

    if (!input.success) {
      throw input.error;
    }
    const productInput: ProductInput = input.data;

    // search and generate unique slug
    let slug: string = '',
      exist: boolean = true,
      count: number = 5;

    do {
      slug = createSlug(productInput.title);
      exist = !!(await Product.findOne({ slug }));
      if (count-- <= 0) {
        throw createHttpError.BadRequest('try changing the product Title');
        // res.status(400).json({
        //   status: 'fail',
        //   message: 'try changing the Product Title',
        // });
      }
    } while (exist);

    // create product
    const product: IProduct = {
      ...productInput,
      slug,
      ratting: {
        rate: 0,
        count: 0,
      },
    };

    const createdProduct = await Product.create(product);

    // response
    res.status(201).json({
      status: 'success',
      message: 'Product created Successfully',
      product: createdProduct,
    });
  } catch (error) {
    next(error);
  }
}

export async function readAllProduct(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const products = await Product.find({});

    res.status(200).json({
      status: 'success',
      message:
        products.length > 0 ? 'Product found Successfully' : 'No Product found',
      products: products,
    });
  } catch (error) {
    next(error);
  }
}
