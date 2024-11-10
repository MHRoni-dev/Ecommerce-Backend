import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { cartZodSchema } from '@v1/cart/schema';
import { CartModel } from '@v1/cart/model';

export const setCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // >> check if user is logged in
    const user = req.app.locals.user;
    if (!user) {
      throw createHttpError.Unauthorized('Please login first');
    }

    // >> check if cart is valid
    const validCart = await cartZodSchema.safeParseAsync(req.body);
    if (!validCart.success) {
      throw validCart.error;
    }

    // >> create cart
    const cart = await CartModel.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, items: validCart.data },
      { upsert: true, new: true },
    );
    if (!cart) {
      throw createHttpError.InternalServerError(
        'something went wrong, try again!',
      );
    }

    // >> response
    res.status(200).json({
      status: 'success',
      message: 'Cart updated Successfully',
      cart: cart,
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
};

export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // >> check if user is logged in
    const user = req.app.locals.user;
    if (!user) {
      throw createHttpError.Unauthorized('Please login first');
    }

    // >> get cart
    const cart = await CartModel.findOne({ userId: user._id }).populate(
      'items.product',
    );
    if (!cart) {
      throw createHttpError.NotFound('Cart not found');
    }

    // >> response
    res.status(200).json({
      status: 'success',
      message: 'Cart found Successfully',
      cart: cart,
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // >> check if user is logged in
    const user = req.app.locals.user;
    if (!user) {
      throw createHttpError.Unauthorized('Please login first');
    }

    // >> delete cart don't give 404 if not found
    const cart = await CartModel.findOneAndDelete({ userId: user._id });

    // >> response
    res.status(200).json({
      status: 'success',
      message: 'Cart cleared Successfully',
      cart: cart,
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
};
