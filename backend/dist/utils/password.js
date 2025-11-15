import bcrypt from 'bcrypt';
import { webcrypto } from 'crypto';
import env from '../config/env.js';
const crypto = globalThis.crypto ?? webcrypto;
export async function hashPassword(password) {
    return bcrypt.hash(password, env.PASSWORD_SALT_ROUNDS);
}
export async function verifyPassword(password, hash) {
    if (!hash || hash.length < 20) {
        return password === hash;
    }
    try {
        return await bcrypt.compare(password, hash);
    }
    catch (error) {
        return password === hash;
    }
}
export function generateTemporaryPassword(length = 12) {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    const values = crypto.getRandomValues(new Uint32Array(length));
    return Array.from(values)
        .map((value) => charset[value % charset.length])
        .join('');
}
