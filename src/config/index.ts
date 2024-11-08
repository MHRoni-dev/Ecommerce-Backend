import dotenv from 'dotenv';
import z from 'zod';
dotenv.config({
  path: `.env.${process.env.NODE_ENV || 'development'}`,
  debug: process.env.NODE_ENV !== 'production',
});

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
      .refine((val) => !isNaN(val), { message: 'TIME_FRAME must be a Number' })
      .default('3000000'),
    HASHING_SALT_ROUNDS: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val), {
        message: 'HASHING_SALT_ROUNDS must be a Number',
      })
      .default('10'),
    OTP_LENGTH: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val), { message: 'OTP_LENGTH must be a Number' })
      .default('6'),
    OTP_DURATION: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val), {
        message: 'OTP_DURATION must be a Number',
      })
      .default('300000'),
  }),

  DATABASE: z.object({
    USER: z.string(),
    PASS: z.string(),
    URL: z.string().url(),
    DB_NAME: z.string(),
  }),

  JWT: z.object({
    SECRET: z.string(),
    EXPIRES_IN: z.string(),
  }),

  MAIL: z.object({
    ENABLED: z.string().transform((val) => (val === 'false' ? false : true)),
    HOST: z.string(),
    USER: z.string(),
    PASS: z.string(),
    PORT: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val), { message: 'PORT must be a Number' }),
    SECURE: z.string().transform((val) => (val === 'true' ? true : false)),
    APP: z.string(),
    FROM: z.string().email(),
  }),

  CLOUDINARY: z.object({
    CLOUD_NAME: z.string(),
    API_KEY: z.string(),
    API_SECRET: z.string(),
  }),
  IMAGE_UPLOAD: z.string().transform((val) => (val === 'false' ? false : true)),
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
    HASHING_SALT_ROUNDS: process.env.HASHING_SALT_ROUNDS,
    OTP_LENGTH: process.env.OTP_LENGTH,
    OTP_DURATION: process.env.OTP_DURATION,
  },
  DATABASE: {
    USER: process.env.DATABASE_USER,
    PASS: process.env.DATABASE_PASS,
    URL: process.env.DATABASE_URL,
    DB_NAME: process.env.DATABASE_NAME,
  },
  JWT: {
    SECRET: process.env.JWT_SECRET,
    EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  },
  MAIL: {
    ENABLED: process.env.MAIL_ENABLED,
    HOST: process.env.MAIL_HOST,
    FROM: process.env.MAIL_FROM,
    USER: process.env.MAIL_USER,
    PASS: process.env.MAIL_PASS,
    PORT: process.env.MAIL_PORT,
    SECURE: process.env.MAIL_SECURE,
    APP: process.env.MAIL_APP,
  },
  IMAGE_UPLOAD: process.env.IMAGE_UPLOAD,
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },
});

if (!env.success) {
  console.log('Invalid Environment Variables:', env.error.format());
  process.exit(1);
}

export default env.data;
