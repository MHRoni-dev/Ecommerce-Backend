import { clearDB, connectDB, disconnectDB } from '@e2e/utils/setup';
import app from '@src/app';
import { UserCreateInput, UserLoginInput } from '@src/app/v1/types';
import request from 'supertest';
import { invalidNewUser, validNewUser } from '@e2e/__fixtures__/userData';
import { AuthModel } from '@src/app/v1/user/model';

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await disconnectDB();
});

async function registerUser(data: UserCreateInput) {
  return await request(app).post('/api/v1/user/register').send(data);
}

async function loginUser(data: UserLoginInput) {
  return await request(app).post('/api/v1/user/login').send(data);
}

async function verifyUser(email: string, otp?: string, token?: string) {
  return await request(app)
    .get(
      `/api/v1/user/verify/${email}?${otp ? `otp=${otp}` : ''}${token ? `token=${token}` : ''}`,
    )
    .send();
}

async function resendVerification(email: string, purpose?: string) {
  return await request(app)
    .post('/api/v1/user/resend-verification')
    .send({ email, purpose });
}

async function updateUserProfile(token?: string, data?: object) {
  return await request(app)
    .put('/api/v1/user/update-profile-data')
    .set('Authorization', `Bearer ${token}`)
    .send(data);
}

async function resetPassword(
  email: string,
  password: string,
  otp?: string,
  token?: string,
) {
  return await request(app)
    .put('/api/v1/user/reset-password')
    .send({ email, password, otp, token });
}

async function updatePassword(token?: string, data?: object) {
  return await request(app)
    .put('/api/v1/user/update-password')
    .set('Authorization', `Bearer ${token}`)
    .send(data);
}

describe('User E2E test', () => {
  describe('Register User', () => {
    it('should create user', async () => {
      const res = await registerUser(validNewUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).not.toHaveProperty('user');
    });

    it('should not create user', async () => {
      const res = await registerUser(invalidNewUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should not create multiple user for same email', async () => {
      const firstRes = await registerUser(validNewUser);
      expect(firstRes.status).toBe(201);

      const secondRes = await registerUser(validNewUser);
      expect(secondRes.status).toBe(400);
      expect(secondRes.body).toHaveProperty('message');
    });
  });

  describe('Resend Verification', () => {
    it('should resend verification', async () => {
      const res = await registerUser(validNewUser);
      expect(res.status).toBe(201);

      // get first auth
      const auth = await AuthModel.findOne({ email: validNewUser.email });
      expect(auth).not.toBeNull();
      expect(auth!.otp).not.toBeNull();
      expect(auth!.token).not.toBeNull();

      const resendRes = await resendVerification(validNewUser.email);
      expect(resendRes.status).toBe(200);

      // get second auth
      const auth2 = await AuthModel.findOne({ email: validNewUser.email });
      expect(auth2).not.toBeNull();
      expect(auth2!.otp).not.toBeNull();
      expect(auth2!.token).not.toBeNull();
      expect(auth2!.otp).not.toBe(auth!.otp);
      expect(auth2!.token).not.toBe(auth!.token);
    });

    it('should not resend verification if user not exist', async () => {
      const resendRes = await resendVerification(validNewUser.email);
      expect(resendRes.status).toBe(400);
      expect(resendRes.body).toHaveProperty('message');
    });

    it('should handle wrong email', async () => {
      const resendRes = await resendVerification('wrong');
      expect(resendRes.status).toBe(400);
      expect(resendRes.body).toHaveProperty('message');
    });
  });

  describe('Verify User', () => {
    it('should verify otp', async () => {
      const res = await registerUser(validNewUser);
      expect(res.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes.status).toBe(200);
    });

    it('should verify token', async () => {
      const res = await registerUser(validNewUser);
      expect(res.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(
        validNewUser.email,
        undefined,
        auth?.token,
      );
      expect(verifyRes.status).toBe(200);
    });

    it('should handle wrong otp', async () => {
      const res = await registerUser(validNewUser);
      expect(res.status).toBe(201);

      const verifyRes = await verifyUser(validNewUser.email, 'wrong');
      expect(verifyRes.status).toBe(400);
    });

    it('should handle wrong token', async () => {
      const res = await registerUser(validNewUser);
      expect(res.status).toBe(201);

      const verifyRes = await verifyUser(
        validNewUser.email,
        undefined,
        'wrong',
      );
      expect(verifyRes.status).toBe(400);
    });

    it('should handle used otp', async () => {
      const res = await registerUser(validNewUser);
      expect(res.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes.status).toBe(200);

      const verifyRes2 = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes2.status).toBe(403);
    });

    it('should handle used token', async () => {
      const res = await registerUser(validNewUser);
      expect(res.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(
        validNewUser.email,
        undefined,
        auth?.token,
      );
      expect(verifyRes.status).toBe(200);

      const verifyRes2 = await verifyUser(
        validNewUser.email,
        undefined,
        auth?.token,
      );
      expect(verifyRes2.status).toBe(403);
    });
  });

  describe('Login User', () => {
    it('should not login unverified user', async () => {
      const res = await registerUser(validNewUser);
      expect(res.status).toBe(201);

      const loginRes = await loginUser(validNewUser);
      expect(loginRes.status).toBe(403);
      expect(loginRes.body).toHaveProperty('message');
    });

    it('should login user', async () => {
      const res = await registerUser(validNewUser);
      expect(res.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes.status).toBe(200);

      const loginRes = await loginUser(validNewUser);
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user).not.toHaveProperty('password');
      expect(loginRes.body.user.email).toBe(validNewUser.email);
      expect(loginRes.body).toHaveProperty('accessToken');
    });

    it('should not login invalid user', async () => {
      const res = await loginUser(invalidNewUser);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should not login user with wrong password', async () => {
      const res = await registerUser(validNewUser);
      expect(res.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes.status).toBe(200);

      const loginRes = await loginUser({ ...validNewUser, password: 'wrong' });
      expect(loginRes.status).toBe(400);
      expect(loginRes.body).toHaveProperty('message');
    });

    it('should not response with password', async () => {
      const res = await registerUser(validNewUser);
      expect(res.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes.status).toBe(200);

      const loginRes = await loginUser(validNewUser);
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user).not.toHaveProperty('password');
    });
  });

  describe('Reset Password', () => {
    it('should not let unverified user reset password', async () => {
      const createUserRes = await registerUser(validNewUser);
      expect(createUserRes.status).toBe(201);

      const resetPassRes = await resetPassword(
        validNewUser.email,
        validNewUser.password + 'new',
      );
      expect(resetPassRes.status).toBe(400);
    });

    it('should not let reset password with wrong otp or token', async () => {
      const createUserRes = await registerUser(validNewUser);
      expect(createUserRes.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes.status).toBe(200);

      const sendVerifyRes = await resendVerification(
        validNewUser.email,
        'passwordReset',
      );
      expect(sendVerifyRes.status).toBe(200);

      const resetPassRes = await resetPassword(
        validNewUser.email,
        validNewUser.password + 'new',
        'wrong',
        'wrong',
      );
      expect(resetPassRes.status).toBe(400);
    });

    it('should reset password', async () => {
      const createUserRes = await registerUser(validNewUser);
      expect(createUserRes.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes.status).toBe(200);

      const sendVerifyRes = await resendVerification(
        validNewUser.email,
        'passwordReset',
      );
      expect(sendVerifyRes.status).toBe(200);

      const auth2 = await AuthModel.findOne({
        email: validNewUser.email,
        purpose: 'passwordReset',
      });

      const resetPassRes = await resetPassword(
        validNewUser.email,
        validNewUser.password + 'new',
        auth2?.otp,
      );
      expect(resetPassRes.status).toBe(200);

      const loginRes = await loginUser({
        email: validNewUser.email,
        password: validNewUser.password + 'new',
      });
      expect(loginRes.status).toBe(200);

      const loginRes2 = await loginUser(validNewUser);
      expect(loginRes2.status).toBe(400);
      expect(loginRes2.body).toHaveProperty('message');
    });

    it('should handle used otp and token', async () => {
      const createUserRes = await registerUser(validNewUser);
      expect(createUserRes.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes.status).toBe(200);

      const sendVerifyRes = await resendVerification(
        validNewUser.email,
        'passwordReset',
      );
      expect(sendVerifyRes.status).toBe(200);

      const auth2 = await AuthModel.findOne({
        email: validNewUser.email,
        purpose: 'passwordReset',
      });

      const resetPassRes = await resetPassword(
        validNewUser.email,
        validNewUser.password + 'new',
        auth2?.otp,
      );
      expect(resetPassRes.status).toBe(200);

      const resetPassRes2 = await resetPassword(
        validNewUser.email,
        validNewUser.password + 'new2',
        auth2?.otp,
      );
      expect(resetPassRes2.status).toBe(403);
    });
  });

  describe('Update User Profile', () => {
    it('should not let unverified and unauthenticated user update profile', async () => {
      const createUserRes = await registerUser(validNewUser);
      expect(createUserRes.status).toBe(201);

      const updateUserRes = await updateUserProfile(undefined, {
        name: 'John Doe',
      });
      expect(updateUserRes.status).toBe(401);
    });

    it('should update user profile', async () => {
      const createUserRes = await registerUser(validNewUser);
      expect(createUserRes.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes.status).toBe(200);

      const loginRes = await loginUser(validNewUser);
      expect(loginRes.status).toBe(200);

      const updateUserRes = await updateUserProfile(loginRes.body.accessToken, {
        name: 'John Doe',
        phone: '12345678900',
        gender: 'male',
        dateOfBirth: '1990-01-01z',
      });
      expect(updateUserRes.status).toBe(200);
    });

    it('should not update property that is not allowed', async () => {
      const createUserRes = await registerUser(validNewUser);
      expect(createUserRes.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes.status).toBe(200);

      const loginRes = await loginUser(validNewUser);
      expect(loginRes.status).toBe(200);

      const updateUserRes = await updateUserProfile(loginRes.body.accessToken, {
        email: 'wrong',
        password: 'wrong',
        profileImage: 'wrong',
      });
      expect(updateUserRes.status).toBe(200);
      expect(updateUserRes.body.user.email).toBe(loginRes.body.user.email);
      expect(updateUserRes.body.user.profileImage).toBe(
        loginRes.body.user.profileImage,
      );

      const againLoginRes = await loginUser(validNewUser);
      expect(againLoginRes.status).toBe(200);
    });
  });

  describe('Update User Password', () => {
    it('should not let unverified and unauthenticated user update password', async () => {
      const createUserRes = await registerUser(validNewUser);
      expect(createUserRes.status).toBe(201);

      const updatePassRes = await updatePassword(undefined, {
        oldPassword: validNewUser.password,
        newPassword: validNewUser.password + 'new',
      });
      expect(updatePassRes.status).toBe(401);
    });

    it('should update user password', async () => {
      const createUserRes = await registerUser(validNewUser);
      expect(createUserRes.status).toBe(201);

      const auth = await AuthModel.findOne({ email: validNewUser.email });

      const verifyRes = await verifyUser(validNewUser.email, auth?.otp);
      expect(verifyRes.status).toBe(200);

      const loginRes = await loginUser(validNewUser);
      expect(loginRes.status).toBe(200);

      const updatePassRes = await updatePassword(loginRes.body.accessToken, {
        oldPassword: validNewUser.password,
        newPassword: validNewUser.password + 'new',
      });
      expect(updatePassRes.status).toBe(200);

      const againLoginResWithOldPass = await loginUser(validNewUser);
      expect(againLoginResWithOldPass.status).toBe(400);

      const loginWithNewPassRes = await loginUser({
        ...validNewUser,
        password: validNewUser.password + 'new',
      });
      expect(loginWithNewPassRes.status).toBe(200);
    });
  });
});
