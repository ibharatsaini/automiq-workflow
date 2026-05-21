import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const KEY_FILE = path.join(process.cwd(), 'data', 'encryptionKey');
const ALGORITHM = 'aes-256-cbc';

let cachedKey: Buffer | null = null;

export function getOrCreateEncryptionKey(override?: string): Buffer {
  if (cachedKey) return cachedKey;

  let hex: string;
  if (override) {
    hex = override.padEnd(64, '0').slice(0, 64);
  } else if (fs.existsSync(KEY_FILE)) {
    hex = fs.readFileSync(KEY_FILE, 'utf-8').trim();
  } else {
    hex = crypto.randomBytes(32).toString('hex');
    fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true });
    fs.writeFileSync(KEY_FILE, hex, { mode: 0o600 });
  }

  cachedKey = Buffer.from(hex, 'hex');
  return cachedKey;
}

export function encrypt(key: Buffer, plainObj: unknown): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(plainObj), 'utf-8'),
    cipher.final(),
  ]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt<T = Record<string, unknown>>(key: Buffer, payload: string): T {
  const [ivHex, dataHex] = payload.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString('utf-8')) as T;
}
