import { clearDB, connectDB, disconnectDB } from '@e2e/utils/setup';
import {
  invalidCategoryCreateInput,
  validCategoryCreateInput,
} from '@e2e/__fixtures__/categoryData';
import app from '@src/app';
import request from 'supertest';

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await disconnectDB();
});

async function createCategory(data: object) {
  return await request(app).post('/api/v1/category/create').send(data);
}

describe('Category E2E Test', () => {
  it('should create category', async () => {
    const res = await createCategory(validCategoryCreateInput);

    expect(res.status).toBe(201);
    expect(res.body.category).toHaveProperty('_id');
    expect(res.body.category).toHaveProperty('slug');
    expect(res.body.category).toHaveProperty(
      'title',
      validCategoryCreateInput.title,
    );
  });

  it('should not create category', async () => {
    const res = await createCategory(invalidCategoryCreateInput);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('status', 'fail');
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toBeInstanceOf(Array);
  });
});
