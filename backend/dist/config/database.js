import pkg from 'pg';
const { Pool } = pkg;
import env from './env.js';
const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
export default pool;
