import { create } from 'domain';
export type User = {
  _id: string;
  email: string;
  password: string;
  isverified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Profile = {
  _id: string;
  userId: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
};

// User variants
export type UserCreatePayload = Omit<
  User,
  '_id' | 'isverified' | 'createdAt' | 'updatedAt'
>;
export type UserCreateInput = UserCreatePayload;
export type UserLoginInput = Pick<User, 'email' | 'password'>;

export type UserUpdateInput = Partial<Pick<User, 'password'>>;
export type UserUpdatePayload = Partial<Pick<User, 'password'>>;
