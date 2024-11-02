export type Auth = {
  _id: string;
  email: string;
  token: string;
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// variants of Auth
export type AuthPayload = Omit<Auth, '_id' | 'createdAt' | 'updatedAt'>;
