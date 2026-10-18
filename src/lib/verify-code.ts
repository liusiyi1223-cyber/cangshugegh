const codes = new Map<string, { code: string; expiresAt: number }>();
const CODE_TTL = 10 * 60 * 1000; // 10 分钟

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function saveCode(email: string, code: string): void {
  codes.set(email.toLowerCase(), { code, expiresAt: Date.now() + CODE_TTL });
}

export function verifyCode(email: string, code: string): boolean {
  const key = email.toLowerCase();
  const entry = codes.get(key);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    codes.delete(key);
    return false;
  }
  if (entry.code !== code) return false;
  codes.delete(key);
  return true;
}
