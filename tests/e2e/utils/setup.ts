import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export const connectDB = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const clearDB = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  await mongoServer.stop();
};
