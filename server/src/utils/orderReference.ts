import { randomBytes } from 'node:crypto';

/** Example: FO-260805-A3K9X2 */
export function generateOrderReference(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `FO-${yy}${mm}${dd}-${suffix}`;
}
