export type User = {
  _id: string;
  email: string;
  profileImage?: {
    url: string;
    public_id: string;
  };
  password: string;
  isVerified: boolean;
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
  '_id' | 'isVerified' | 'createdAt' | 'updatedAt'
>;
export type UserCreateInput = UserCreatePayload;
export type UserLoginInput = Pick<User, 'email' | 'password'>;

export type UserUpdateInput = Partial<Pick<User, 'password'>>;
export type UserUpdatePayload = Partial<
  Pick<User, 'password' | 'profileImage'>
>;
