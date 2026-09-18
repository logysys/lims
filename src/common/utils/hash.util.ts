import * as crypto from 'crypto';

export function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function generateHashChain(
  previousHash: string,
  data: string,
): string {
  return generateHash(`${previousHash}:${data}`);
}

export function generateRecordHash(record: Record<string, any>): string {
  const sortedKeys = Object.keys(record).sort();
  const canonical = JSON.stringify(record, sortedKeys);
  return generateHash(canonical);
}

export function generateBadgeCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateApiKey(): string {
  return `tsk_${crypto.randomBytes(32).toString('hex')}`;
}