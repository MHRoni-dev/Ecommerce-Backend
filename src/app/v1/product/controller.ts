import { Request, Response, NextFunction } from 'express';
import { createSlug } from '@v1/lib/slug';
import {
  productInputZodSchema,
  productUpdateInputZodSchema,
} from '@v1/product/schema';
import createHttpError from 'http-errors';
import {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  ProductCreatePayload,
  ProductUpdatePayload,
  ProductRedirect,
} from '@v1/types';
import { ProductModel, ProductRedirectModel } from '@v1/product/model';
import { generateNewSlug, registerNewSlug } from '@v1/product/lib';
import mongoose from 'mongoose';

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
    const productInput: ProductCreateInput = input.data;

    // search and generate unique slug
    let slug: string = '',
      exist: boolean = true,
      count: number = 5;

    do {
      slug = createSlug(productInput.title);
      exist = !!(await ProductModel.findOne({ slug }));
      if (count-- <= 0) {
        throw createHttpError.BadRequest('try changing the product Title');
        // res.status(400).json({
        //   status: 'fail',
        //   message: 'try changing the Product Title',
        // });
      }
    } while (exist);

    // create product
    const product: ProductCreatePayload = {
      ...productInput,
      slug,
      ratting: {
        rate: 0,
        count: 0,
      },
    };

    const createdProduct: Product = await ProductModel.create(product);

    // response
    res.status(201).json({
      status: 'success',
      message: 'Product created Successfully',
      product: createdProduct,
    });

    //end of function
    return;
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
    const products: Product[] = await ProductModel.find({});

    res.status(200).json({
      status: 'success',
      message:
        products.length > 0 ? 'Product found Successfully' : 'No Product found',
      products: products,
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
}

export async function readProductBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const slug: string = req.params.slug;

    let product: Product | null = await ProductModel.findOne({ slug });

    // check if the product slug is changed and find the product
    if (!product) {
      const slugHistory: ProductRedirect | null =
        await ProductRedirectModel.findOne({ slug: slug });
      if (slugHistory) {
        product = await ProductModel.findById(slugHistory.productId);
      }
    }
    // if still not found
    if (!product) {
      throw createHttpError.NotFound('Product not found');
    }

    res.status(200).json({
      status: 'success',
      message: 'Product found Successfully',
      product: product,
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
}

export async function updateProductBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // validate product data input
    const input = await productUpdateInputZodSchema.safeParseAsync(req.body);
    if (!input.success) {
      throw input.error;
    }
    const productInput: ProductUpdateInput = input.data;

    // search if product exist
    const slug: string = req.params.slug;
    const exist: Product | null = await ProductModel.findOne({ slug });
    if (!exist) {
      throw createHttpError.NotFound('Product not found');
    }

    const productData: ProductUpdatePayload = { ...productInput };
    let updatedProduct: Product | null = null;

    // check if title need change, if title need change we need to do more work
    productInput.title =
      productInput.title === exist.title ? undefined : productInput.title;
    if (!productInput.title) {
      const updatedProduct: Product | null =
        await ProductModel.findOneAndUpdate(
          { slug },
          { ...productData },
          { new: true },
        );
      // response and return from function
      res.status(200).json({
        status: 'success',
        message: 'Product updated Successfully',
        product: updatedProduct,
      });
      return;
    }

    // as title exist ,we need to generate and update slug
    productData.slug = await generateNewSlug(productInput.title);

    // update slug and register change in the ProductRedirect
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      updatedProduct = await ProductModel.findOneAndUpdate(
        { slug },
        productData,
        {
          session,
          new: true,
        },
      );
      await registerNewSlug(exist?._id, exist.slug, { session });

      await session.commitTransaction();
    } catch (error) {
      console.log('Product slug update transaction faild', error);
      await session.abortTransaction();
      throw createHttpError.InternalServerError('Something went wrong!');
    } finally {
      await session.endSession();
    }

    // response
    res.status(200).json({
      status: 'success',
      message: 'Product updated Successfully',
      product: updatedProduct,
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
}

export async function deleteProductBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const slug: string = req.params.slug;

    let product: Product | null = await ProductModel.findOne({ slug });

    // check if the product is valid or not
    if (!product) {
      throw createHttpError.NotFound('Product not found');
    }
    //delete process
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      product = await ProductModel.findOneAndDelete({ slug }, { session });
      await ProductRedirectModel.deleteMany(
        { productId: product?._id },
        { session },
      );
      await session.commitTransaction();
    } catch (error) {
      console.log('Product and ProductRedirect record delete failed: ', error);
      await session.abortTransaction();
      throw createHttpError.InternalServerError('something went wrong');
    } finally {
      await session.endSession();
    }

    res.status(200).json({
      status: 'success',
      message: 'Product deleted Successfully',
      product: product,
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
}
