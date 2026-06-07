import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:8080').split(','),

  // Storage
  storageType: process.env.STORAGE_TYPE || 'local',
  s3: {
    bucket: process.env.S3_BUCKET || '',
    region: process.env.S3_REGION || '',
    accessKey: process.env.S3_ACCESS_KEY || '',
    secretKey: process.env.S3_SECRET_KEY || '',
    endpoint: process.env.S3_ENDPOINT || '',
  },
  uploadDir: process.env.UPLOAD_DIR || './uploads',

  // KYC
  kycProvider: process.env.KYC_PROVIDER || 'stripe',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  aliyunAccessKey: process.env.ALIYUN_ACCESS_KEY || '',
  aliyunSecretKey: process.env.ALIYUN_SECRET_KEY || '',

  // Translation
  translationApiKey: process.env.TRANSLATION_API_KEY || '',
  translationEndpoint: process.env.TRANSLATION_ENDPOINT || '',

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
} as const;
