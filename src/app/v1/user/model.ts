import { Document, model, Model, Query, Schema } from 'mongoose';
import { User } from '@v1/types';
import { Auth } from '@v1/types';

const user = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    profileImage: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: (doc: User) =>
        doc.email.split('@')[0].replace(/[0-9]/g, '').replace(/\./g, ' '),
    },
    phone: String,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    dateOfBirth: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    timeStamps: true,
  },
);

// remove sesnsative data from response
user.set('toJSON', {
  transform: (doc: Document, ret: Partial<User>) => {
    delete ret.password;
    delete ret.isVerified;
    return ret;
  },
});
user.set('toObject', {
  transform: (doc: Document, ret: Partial<User>) => {
    delete ret.password;
    delete ret.isVerified;
    return ret;
  },
});

// remove password from getting without includePassword flag on
user.pre<Query<User, User>>(/^find/, function (next) {
  if (!this.getOptions().includePassword) {
    this.select('-password');
  }
  if (!this.getOptions().includeUnverified) {
    this.where({ isVerified: true });
  }
  next();
});

export const UserModel: Model<User> = model<User>('user', user);

const auth = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      default: 'emailVerification',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    timeStamps: true,
  },
);

export const AuthModel: Model<Auth> = model<Auth>('auth', auth);
