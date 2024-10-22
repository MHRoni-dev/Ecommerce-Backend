function generateWord(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let word = '';

  for (let i = 0; i < length; i++) {
    word += characters[Math.floor(Math.random() * characters.length)];
  }

  return word.toLowerCase();
}

export function createSlug(text: string): string {
  const slug: string = text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');

  return slug + '-' + generateWord(4);
}
