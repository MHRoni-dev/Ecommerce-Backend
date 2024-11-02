// import config from '@config/index';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
let mongoServer: MongoMemoryReplSet | null = null;

export const connectDB = async (): Promise<void> => {
  // console.log('connecting to the test database...');
  // normal connection
  // await mongoose.connect(config.DATABASE.URL, {
  //   user: config.DATABASE.USER,
  //   pass: config.DATABASE.PASS,
  //   dbName: 'test',
  // });
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });
  // Inmemory connection
  await mongoose.connect(mongoServer.getUri(), {
    dbName: 'test',
  });
};

export const clearDB = async (): Promise<void> => {
  // console.log('clearing the database...');
  await mongoose.connection.dropDatabase();
};

export const disconnectDB = async (): Promise<void> => {
  // console.log('disconnecting database...');
  await mongoose.disconnect();
  await mongoServer?.stop();
};
