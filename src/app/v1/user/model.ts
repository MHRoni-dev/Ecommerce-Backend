import { Document, model, Model, Query, Schema } from 'mongoose';
import { User } from '@v1/types';

const user = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
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
    return ret;
  },
});
user.set('toObject', {
  transform: (doc: Document, ret: Partial<User>) => {
    delete ret.password;
    return ret;
  },
});

// remove password from getting without includePassword flag on
user.pre<Query<User, User>>(/^find/, function (next) {
  if (!this.getOptions().includePassword) {
    this.select('-password');
  }
  next();
});

export const UserModel: Model<User> = model<User>('user', user);
