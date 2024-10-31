import { clearDB, connectDB, disconnectDB } from '@e2e/utils/setup';
import app from '@src/app';
import { UserCreateInput, UserLoginInput } from '@src/app/v1/types';
import request from 'supertest';
import { invalidNewUser, validNewUser } from '@e2e/__fixtures__/userData';

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

describe('User E2E test', () => {
  it('should create user', async () => {
    const res = await registerUser(validNewUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject(validNewUser);
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

  it('should login user', async () => {
    const res = await registerUser(validNewUser);
    expect(res.status).toBe(201);

    const loginRes = await loginUser(validNewUser);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user).toMatchObject(validNewUser);
    expect(loginRes.body).toHaveProperty('accessToken');
  });

  it('should not login user', async () => {
    const res = await loginUser(invalidNewUser);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should not login user with wrong password', async () => {
    const res = await registerUser(validNewUser);
    expect(res.status).toBe(201);

    const loginRes = await loginUser({ ...validNewUser, password: 'wrong' });
    expect(loginRes.status).toBe(400);
    expect(loginRes.body).toHaveProperty('message');
  });
});
