import { createSlug } from '@v1/lib/slug';
import { Product, ProductRedirect } from '@v1/product/model';
import createHttpError from 'http-errors';

export const generateNewSlug = async (text: string): Promise<string> => {
  let slug: string,
    count: number = 5,
    exist: boolean = true;

  do {
    slug = createSlug(text);
    exist = !!(await Product.findOne({ slug }));
    if (count-- <= 0) {
      throw createHttpError.BadRequest('try changing the product Title');
    }
  } while (exist);
  return slug;
};

export const registerNewSlug = async (
  prodcutId: string,
  slug: string,
  opt?: object,
): Promise<boolean> => {
  const updatedSlug = await ProductRedirect.create([{ prodcutId, slug }], opt);
  return !!updatedSlug;
};
