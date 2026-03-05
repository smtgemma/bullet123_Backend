import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT || 5005,
  host: process.env.HOST || "localhost",
  databaseUrl: process.env.DATABASE_URL,
  sendEmail: {
    email_from: process.env.EMAIL_FROM,
    brevo_pass: process.env.BREVO_PASS,
    brevo_email: process.env.BREVO_EMAIL,
  },
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    },
    resetPassword: {
      expiresIn: process.env.JWT_RESET_PASS_ACCESS_EXPIRES_IN,
    },
  },
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
  },
  url: {
    backend: process.env.BACKEND_URL,
    frontend: process.env.FRONTEND_URL,
  },
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
  },
   redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL || '3600'),
  },
  
  CACHE_TTL:10 * 60
};


