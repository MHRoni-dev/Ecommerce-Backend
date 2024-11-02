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

describe('User E2E test', () => {
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

  it('should not login unverified user', async () => {
    const res = await registerUser(validNewUser);
    expect(res.status).toBe(201);

    const loginRes = await loginUser(validNewUser);
    expect(loginRes.status).toBe(403);
    expect(loginRes.body).toHaveProperty('message');
  });

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

    const verifyRes = await verifyUser(validNewUser.email, undefined, 'wrong');
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
