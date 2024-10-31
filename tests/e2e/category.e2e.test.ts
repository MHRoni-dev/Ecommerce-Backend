import { clearDB, connectDB, disconnectDB } from '@e2e/utils/setup';
import {
  invalidCategoryCreateInput,
  validCategoryCreateInput,
} from '@e2e/__fixtures__/categoryData';
import app from '@src/app';
import request from 'supertest';
import { Category } from '@src/app/v1/types';

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

async function readCategory(slug: string) {
  return await request(app).get(`/api/v1/category/read/${slug}`);
}

async function readCategories() {
  return await request(app).get('/api/v1/category/read');
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

  it('should read category with slug', async () => {
    const res = await createCategory(validCategoryCreateInput);
    expect(res.status).toBe(201);

    const category = res.body.category;
    const readRes = await readCategory(category.slug);

    expect(readRes.status).toBe(200);
    expect(readRes.body.category).toHaveProperty('_id', category._id);
    expect(readRes.body.category).toHaveProperty('slug', category.slug);
    expect(readRes.body.category).toHaveProperty('title', category.title);
  });

  it('should not found cateogry with slug', async () => {
    // no category created yet so no invalid-slug category exist
    const res = await readCategory('invalid-slug');
    expect(res.status).toBe(404);
  });

  it('should read all categories', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await createCategory({
        title: `Category No ${i + 1}`,
      });
      expect(res.status).toBe(201);
    }

    const res = await readCategories();
    const categories = res.body.categories;

    expect(res.status).toBe(200);
    expect(categories).toBeInstanceOf(Array);
    expect(categories).toHaveLength(5);
    categories.forEach((category: Category) => {
      expect(category).toHaveProperty('_id');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('title');
    });
  });

  it('should read empty categories', async () => {
    const res = await readCategories();
    expect(res.status).toBe(200);
    expect(res.body.categories).toBeInstanceOf(Array);
    expect(res.body.categories).toHaveLength(0);
  });

});
