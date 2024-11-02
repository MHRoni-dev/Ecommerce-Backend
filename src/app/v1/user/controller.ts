// >> import
import { NextFunction, Request, Response } from 'express';
import { UserCreateInput, UserLoginInput } from '@v1/types';
import {
  userCreateInputZodSchema,
  userLoginInputZodSchema,
} from '@v1/user/schema';
import { AuthModel, UserModel } from '@v1/user/model';
import createHttpError from 'http-errors';
import { hashPassword, verifyPassword } from '@v1/lib/hash';
import { generateTokenAsync } from '@v1/lib/token';
import z from 'zod';
import mongoose from 'mongoose';
import { generateOTP } from '@v1/lib/otp';
import config from '@config/index';
import { sendMail } from '../lib/mail';

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input: UserCreateInput = req.body;

    // >> verify input
    const verify = await userCreateInputZodSchema.safeParseAsync(input);
    if (!verify.success) {
      throw verify.error;
    }
    const userInputData: UserCreateInput = verify.data;

    // >> check if user exist
    const userExist = await UserModel.findOne(
      {
        email: userInputData.email,
      },
      null,
      { includeUnverified: true },
    );
    if (userExist) {
      throw createHttpError.BadRequest('User already exist');
    }

    // >> hash password
    const hashedPassword = await hashPassword(userInputData.password);
    const otp = generateOTP();
    const token = await generateTokenAsync({
      email: userInputData.email,
      otp: otp,
    });

    //< create user
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
      await UserModel.create(
        [
          {
            ...userInputData,
            password: hashedPassword,
          },
        ],
        { session },
      );

      await AuthModel.findOneAndUpdate(
        { email: userInputData.email },
        {
          email: userInputData.email,
          otp,
          token,
          expiresAt: new Date(Date.now() + config.SECURITY.OTP_DURATION),
        },
        { session, upsert: true },
      );

      await session.commitTransaction();
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
    //>

    // >> send mail
    if (config.MAIL.ENABLED) {
      await sendMail({
        to: userInputData.email,
        subject: 'OTP code',
        text: `Your otp is ${otp}`,
      });
    }

    // >> response
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

export async function resendVerification(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // >> check email
    const email = req.body.email;
    const isEmail = await z.string().email().safeParseAsync(email);
    if (!isEmail.success) {
      throw createHttpError.BadRequest('Invalid email');
    }

    // >> check if user exist
    const userExist = await UserModel.findOne(
      {
        email: isEmail.data,
      },
      null,
      { includeUnverified: true },
    );
    if (!userExist) {
      throw createHttpError.BadRequest('Register your account first');
    }

    // >> generate otp and token
    const otp = generateOTP();
    const token = await generateTokenAsync({
      email: isEmail.data,
      otp: otp,
    });

    // >> update auth
    await AuthModel.findOneAndUpdate(
      { email: isEmail.data },
      {
        email: isEmail.data,
        otp,
        token,
        expiresAt: new Date(Date.now() + config.SECURITY.OTP_DURATION),
      },
    );

    // >> send mail
    if (config.MAIL.ENABLED) {
      await sendMail({
        to: isEmail.data,
        subject: 'OTP code',
        text: `Your otp is ${otp}`,
      });
    }

    // >> response
    res.status(200).json({
      status: 'success',
      message: 'Verification sent successfully',
      data: 'Check your email to verify your account',
    });

    // end of function
    return;
  } catch (error) {
    next(error);
  }
}

export async function verifyUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // >> get email otp and token
    const email = req.params.email;
    const otp = req.query.otp;
    const token = req.query.token;

    // >> verify email otp and token
    const checkIsEmail = z.string().email().safeParse(email);
    if (!checkIsEmail.success) {
      throw createHttpError.BadRequest('Invalid email');
    }
    if (!otp && !token) {
      throw createHttpError.BadRequest('otp or token is required');
    }

    // >> check if user exist
    const userExist = await UserModel.findOne(
      {
        email: checkIsEmail.data,
      },
      null,
      { includeUnverified: true },
    );
    if (!userExist) {
      throw createHttpError.BadRequest('Register your account first');
    }

    // >> check if user is already verified
    if (userExist.isVerified) {
      throw createHttpError.Forbidden('User already verified');
    }

    //< check if otp or token is not expired (expired data doesn't exist)
    const authExist = await AuthModel.findOne({
      email: checkIsEmail.data,
    });
    if (!authExist) {
      throw createHttpError.BadRequest('Invalid otp or token');
    }

    if (authExist.otp !== otp && authExist.token !== token) {
      throw createHttpError.BadRequest('Invalid otp or token');
    }
    //>

    // >> check if otp or token is already used
    if (authExist.isUsed) {
      throw createHttpError.Forbidden('otp or token already used');
    }

    //< update isVerified and isUsed
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
      await UserModel.findOneAndUpdate(
        { email: checkIsEmail.data },
        { isVerified: true },
        { session, includeUnverified: true },
      );
      await AuthModel.findOneAndUpdate(
        { email: checkIsEmail.data },
        { isUsed: true },
        { session },
      );
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
    //>

    // >> response
    res.status(200).json({
      status: 'success',
      message: 'User verified successfully',
    });

    //end of function
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

    // >> verify input
    const verify = await userLoginInputZodSchema.safeParseAsync(input);
    if (!verify.success) {
      throw verify.error;
    }
    const userLoginInput: UserLoginInput = verify.data;

    // >> check if user exist
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

    // >> check if user is verifed
    if (!userExist.isVerified) {
      throw createHttpError.Forbidden('verify your account first');
    }

    // >> check password
    const isPasswordMatch = await verifyPassword(
      userLoginInput.password,
      userExist.password,
    );
    if (!isPasswordMatch) {
      throw createHttpError.BadRequest('Invalid password or email');
    }

    // >> generate token
    const token = await generateTokenAsync({
      _id: userExist._id,
      email: userExist.email,
    });

    // >> response
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
