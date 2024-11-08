import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (!password) {
    throw new Error('password is required');
  }
  if (!hash) {
    throw new Error('hash is required');
  }
  return await bcrypt.compare(password, hash);
}
