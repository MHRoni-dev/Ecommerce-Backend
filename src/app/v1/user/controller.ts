// >> import
import { NextFunction, Request, Response, Express } from 'express';
import { UserCreateInput, UserLoginInput } from '@v1/types';
import {
  userCreateInputZodSchema,
  userLoginInputZodSchema,
  userProfileZodSchema,
  validVerificationReqPurposeZodSchema,
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
import { uploadSingleFile, UPLODAD_FOLDER } from '../lib/imageUpload';

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
          purpose: 'emailVerification',
          otp,
          token,
          isUsed: false,
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

    // >> check purpose
    const purpose = req.body.purpose;
    const isValidPurpose =
      await validVerificationReqPurposeZodSchema.safeParseAsync(purpose);
    if (!isValidPurpose.success) {
      throw createHttpError.BadRequest(
        'Invalid purpose of verification request',
      );
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
        purpose: isValidPurpose.data,
        isUsed: false,
        otp,
        token,
        expiresAt: new Date(Date.now() + config.SECURITY.OTP_DURATION),
      },
      {
        upsert: true,
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
      data: 'Check your email for verification',
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

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // >> check if valid email , password and otp or token is provided
    const email = req.body.email;
    const isEmail = await z.string().email().safeParseAsync(email);
    if (!isEmail.success) {
      throw createHttpError.BadRequest('Invalid email');
    }
    const password = req.body.password;
    if (!password) {
      throw createHttpError.BadRequest('Password is required');
    }
    const otp = req.body.otp;
    const token = req.body.token;
    if (!otp && !token) {
      throw createHttpError.BadRequest('otp or token is required');
    }

    // >> check if user exist
    const userExist = await UserModel.findOne({ email: isEmail.data });
    if (!userExist) {
      throw createHttpError.BadRequest('Register your account first');
    }

    // >> check if otp or token is not expired and have the same purpose (expired data doesn't exist)
    const authExist = await AuthModel.findOne({
      email: isEmail.data,
      purpose: 'passwordReset',
      $or: [{ otp }, { token }],
    });
    if (!authExist) {
      throw createHttpError.BadRequest('Invalid otp or token');
    }

    // >> check if otp or token is already used
    if (authExist.isUsed) {
      throw createHttpError.Forbidden('otp or token already used');
    }

    // >> update password and isUsed
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
      const hashedPassword = await hashPassword(password);
      await UserModel.findOneAndUpdate(
        { email: isEmail.data },
        { password: hashedPassword },
        { session },
      );
      await AuthModel.findOneAndUpdate(
        { email: isEmail.data },
        { isUsed: true },
        { session },
      );
      await session.commitTransaction();
    } catch (error) {
      console.log('Password reset failed: ', error);
      await session.abortTransaction();
      throw createHttpError.InternalServerError('something went wrong');
    } finally {
      await session.endSession();
    }

    // >> response
    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully',
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
}

export async function setProfileImage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // >> check if user is logged in and data is added in req
    const user = req.app.locals.user;
    if (!user) {
      throw createHttpError.Unauthorized('Please login first');
    }

    // >> check if profile image is provided
    const profileImage = req.file as Express.Multer.File;
    if (!profileImage) {
      throw createHttpError.BadRequest('Profile image is required');
    }

    // >> upload profile image
    const uploadProfileImage = await uploadSingleFile(profileImage, {
      folder: UPLODAD_FOLDER.USER,
      overwrite: true,
      public_id: user._id,
      filename_override: user.email?.split('@')[0],
      display_name: user.email?.split('@')[0],
      unique_filename: true,
      tags: ['profileImage', 'ecommerce', 'user'],
    });
    if (!uploadProfileImage) {
      throw createHttpError.InternalServerError(
        'something went wrong, try again!',
      );
    }
    console.log(uploadProfileImage);
    // >> update profile image
    const updateProfileImage = await UserModel.findByIdAndUpdate(user._id, {
      profileImage: {
        url: uploadProfileImage.secure_url,
        publicId: uploadProfileImage.public_id,
      },
    });
    if (!updateProfileImage) {
      throw createHttpError.InternalServerError(
        'something went wrong, try again!',
      );
    }

    // >> response
    res.status(200).json({
      status: 'success',
      message: 'Profile image updated successfully',
      data: {
        url: uploadProfileImage.secure_url,
        public_id: uploadProfileImage.public_id,
      },
    });

    //end of function
    return;
  } catch (error) {
    next(error);
  }
}

export async function updateProfileData(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // >> check if user is logged in and data is added in req
    const user = req.app.locals.user;
    if (!user) {
      throw createHttpError.Unauthorized('Please login first');
    }

    // >> validate updateable data
    const updateableData = await userProfileZodSchema.safeParseAsync(req.body);
    if (!updateableData.success) {
      throw updateableData.error;
    }

    // >> update profile data
    const updatedProfile = await UserModel.findByIdAndUpdate(
      user._id,
      updateableData.data,
      { new: true },
    );
    if (!updatedProfile) {
      throw createHttpError.InternalServerError(
        'something went wrong, try again!',
      );
    }

    // >> response
    res.status(200).json({
      status: 'success',
      message: 'Profile data updated successfully',
      user: updatedProfile,
    });
    // end of function
    return;
  } catch (error) {
    next(error);
  }
}

export async function updatePassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // >> check if user is logged in and data is added in req
    const user = req.app.locals.user;
    if (!user) {
      throw createHttpError.Unauthorized('Please login first');
    }

    // >> validate newPassword and oldPassword
    const newPassword = req.body.newPassword;
    const oldPassword = req.body.oldPassword;
    if (!newPassword || !oldPassword) {
      throw createHttpError.BadRequest(
        'newPassword and oldPassword is required',
      );
    }

    // >> get password and check if it is correct
    const userData = await UserModel.findById(user._id, null, {
      includePassword: true,
    });
    if (!userData) {
      throw createHttpError.InternalServerError('something went wrong');
    }
    const oldHashPassword = userData.password;
    const isPasswordCorrect = await verifyPassword(
      oldPassword,
      oldHashPassword,
    );
    if (!isPasswordCorrect) {
      throw createHttpError.BadRequest('Password is incorrect');
    }

    // >> hash new password and update password
    const hashedPassword = await hashPassword(newPassword);
    const updatedPassword = await UserModel.findByIdAndUpdate(
      user._id,
      { password: hashedPassword },
      { new: true },
    );
    if (!updatedPassword) {
      throw createHttpError.InternalServerError(
        'something went wrong, try again!',
      );
    }

    // >> response
    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
    });

    // end of function
    return;
  } catch (error) {
    next(error);
  }
}
