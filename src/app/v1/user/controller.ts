import { NextFunction, Request, Response } from 'express';
import { UserCreateInput, UserLoginInput } from '@v1/types';
import {
  userCreateInputZodSchema,
  userLoginInputZodSchema,
} from '@v1/user/schema';
import { UserModel } from '@v1/user/model';
import createHttpError from 'http-errors';
import { hashPassword, verifyPassword } from '@v1/lib/hash';
import { generateTokenAsync } from '../lib/token';

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input: UserCreateInput = req.body;

    //verify input
    const verify = await userCreateInputZodSchema.safeParseAsync(input);
    if (!verify.success) {
      throw verify.error;
    }
    const userInputData: UserCreateInput = verify.data;

    // check if user exist
    const userExist = await UserModel.findOne({
      email: userInputData.email,
    });
    if (userExist) {
      throw createHttpError.BadRequest('User already exist');
    }

    // hash password
    const hashedPassword = await hashPassword(userInputData.password);

    // create user
    await UserModel.create({
      ...userInputData,
      password: hashedPassword,
    });

    // response
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: 'Check your email to verify your account',
    });

    // end of function
    return;
  } catch (error) {
    next(error);
  }
}

export async function loginUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input: UserLoginInput = req.body;

    //verify input
    const verify = await userLoginInputZodSchema.safeParseAsync(input);
    if (!verify.success) {
      throw verify.error;
    }
    const userLoginInput: UserLoginInput = verify.data;

    // check if user exist
    const userExist = await UserModel.findOne(
      {
        email: userLoginInput.email,
      },
      null,
      { includePassword: true, includeUnverified: true },
    );
    if (!userExist) {
      throw createHttpError.BadRequest('Invalid password or email');
    }

    //  check if user is verifed
    if (!userExist.isVerified) {
      throw createHttpError.Forbidden('verify your account first');
    }

    // check password
    const isPasswordMatch = await verifyPassword(
      userLoginInput.password,
      userExist.password,
    );
    if (!isPasswordMatch) {
      throw createHttpError.BadRequest('Invalid password or email');
    }

    // generate token
    const token = await generateTokenAsync({
      _id: userExist._id,
      email: userExist.email,
    });

    // response
    res.status(200).json({
      status: 'success',
      message: 'User logged in successfully',
      user: userExist,
      accessToken: token,
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
}
