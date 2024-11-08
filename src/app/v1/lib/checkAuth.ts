import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { verifyTokenAsync } from './token';
import { UserModel } from '../user/model';

export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw createHttpError.Unauthorized('please login first');
    }

    const decoded = await verifyTokenAsync(token);
    const user = await UserModel.findOne({ email: decoded.email });

    if (!user) {
      throw createHttpError.Unauthorized('please login first');
    }

    req.app.locals.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
