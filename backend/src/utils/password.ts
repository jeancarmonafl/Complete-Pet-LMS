import bcrypt from 'bcryptjs';
import { webcrypto } from 'node:crypto';

import env from '../config/env.js';

const crypto = globalThis.crypto ?? webcrypto;

function hashWithBcrypt(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, env.PASSWORD_SALT_ROUNDS, (error: Error | null, hashed?: string) => {
      if (error) {
        reject(error);
        return;
      }

      if (!hashed) {
        reject(new Error('Failed to hash password'));
        return;
      }

      resolve(hashed);
    });
  });
}

function compareWithBcrypt(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (error: Error | null, result?: boolean) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result ?? false);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  return hashWithBcrypt(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || hash.length < 20) {
    return password === hash;
  }

  try {
    return await compareWithBcrypt(password, hash);
  } catch (error) {
    return password === hash;
  }
}

export function generateTemporaryPassword(length = 12): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values)
    .map((value: number) => charset[value % charset.length])
    .join('');
}
