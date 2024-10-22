import mongoose from 'mongoose';

interface DatabaseConfig {
  URL: string;
  USER: string;
  PASS: string;
  DB_NAME: string;
}

async function connectDatabase(config: DatabaseConfig) {
  try {
    console.log('Connecting to the database : ', config.DB_NAME);
    await mongoose.connect(config.URL, {
      user: config.USER,
      pass: config.PASS,
      dbName: config.DB_NAME,
    });

    console.log('Database connected to: ', config.DB_NAME, '✅');
  } catch (error) {
    console.error('Database connection failed, Error : \n', error);
    process.exit(1); //stop the server if database connection failed
  }
}

export default connectDatabase;
