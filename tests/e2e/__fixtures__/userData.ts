import { UserCreateInput } from '@v1/types/userTypes';

export const validNewUser: UserCreateInput = {
  email: 'test@t.com',
  password: '123456',
};

export const invalidNewUser = {
  email: 'test.com',
  password: '12345',
};
