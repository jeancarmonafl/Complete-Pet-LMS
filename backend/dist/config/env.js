import 'dotenv/config';
import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string().min(32),
    PASSWORD_SALT_ROUNDS: z.coerce.number().default(12)
});
const env = envSchema.parse(process.env);
export default env;
