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
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.dropDatabase();
    } catch (error: unknown) {
      // Narrow the type if `error` is an instance of Error
      if (error instanceof Error && (error as { code?: number }).code === 112) {
        console.warn('WriteConflict detected. Retrying dropDatabase...');
        await mongoose.connection.dropDatabase(); // Retry once
      } else {
        console.error('Error during database cleanup:', error);
        throw error;
      }
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  // console.log('disconnecting database...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};
