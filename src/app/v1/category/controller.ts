import { Category, CategoryCreatePayload } from './../types/categoryTypes';
import { NextFunction, Request, Response } from 'express';
import { categoryCreateInputZodSchema } from '@v1/category/schema';
import { CategoryCreateInput } from '@v1/types';
import createHttpError from 'http-errors';
import { CategoryModel } from '@v1/category/model';

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // validate category data input
    const input = await categoryCreateInputZodSchema.safeParseAsync(req.body);

    if (!input.success) {
      throw input.error;
    }
    const categoryInput: CategoryCreateInput = input.data;

    const exist = await CategoryModel.findOne({ title: categoryInput.title });
    if (exist) {
      throw createHttpError.BadRequest('Category already exist');
    }

    // search and generate unique slug
    const slug = categoryInput.title.toLowerCase().replace(/\s+/g, '-');

    // create Product
    const categoryCreatePayload: CategoryCreatePayload = {
      ...categoryInput,
      slug,
    };
    const createdCategory = await CategoryModel.create(categoryCreatePayload);

    // response
    res.status(201).json({
      status: 'success',
      message: 'Category created Successfully',
      category: createdCategory,
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
}

export async function readAllCategory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const categories: Category[] = await CategoryModel.find({});

    res.status(200).json({
      status: 'success',
      message:
        categories.length > 0
          ? 'Category found Successfully'
          : 'No Category found',
      categories: categories,
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
}
