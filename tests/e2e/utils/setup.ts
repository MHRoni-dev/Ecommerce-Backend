import config from '@config/index';
import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  console.log('connecting to the test database...')
  await mongoose.connect(config.DATABASE.URL, {
    user: config.DATABASE.USER,
    pass: config.DATABASE.PASS,
    dbName: 'test'
  });
};

export const clearDB = async (): Promise<void> => {
  console.log('clearing the database...');
  await mongoose.connection.dropDatabase();
};

export const disconnectDB = async (): Promise<void> => {
  console.log('disconnecting database...');
  await mongoose.disconnect();
};
