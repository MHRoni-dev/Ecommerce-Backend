import dotenv from 'dotenv';
import z from 'zod';
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), { message: 'PORT must be a Number' }),

  LOG: z.object({
    LOG_LEVEL: z
      .enum(['tiny', 'combined', 'short', 'dev', 'common'])
      .default('dev'),
  }),

  SECURITY: z.object({
    REQ_LIMIT: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val), { message: 'REQ_LIMIT must be a Number' })
      .default('500'),
    TIME_FRAME: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val), { message: 'REQ_LIMIT must be a Number' })
      .default('3000000'),
  }),

  DATABASE: z.object({
    USER: z.string(),
    PASS: z.string(),
    URL: z.string().url(),
    DB_NAME: z.string(),
  }),
});

//! make sure to add any env variable for checking
const env = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  LOG: {
    LOG_LEVEL: process.env.LOG_LEVEL,
  },
  SECURITY: {
    REQ_LIMIT: process.env.REQ_LIMIT,
    TIME_FRAME: process.env.REQ_TIMEFRAME,
  },
  DATABASE: {
    USER: process.env.DATABASE_USER,
    PASS: process.env.DATABASE_PASS,
    URL: process.env.DATABASE_URL,
    DB_NAME: process.env.DATABASE_NAME,
  },
});

if (!env.success) {
  console.log('Invalid Environment Variables:', env.error.format());
  process.exit(1);
}

export default env.data;
