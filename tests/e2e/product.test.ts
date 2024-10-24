import request from 'supertest';
import { connectDB, clearDB, disconnectDB } from './utils/setup';
import app from '../../src/app';

beforeAll(async () => {
  await connectDB();
});

beforeEach( async () => {
  await clearDB()
})

afterAll( async () => {
  await disconnectDB()
})