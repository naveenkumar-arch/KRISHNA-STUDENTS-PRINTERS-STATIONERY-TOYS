import crypto from 'crypto';

const encryptionKey = process.env.SETTINGS_ENCRYPTION_KEY || 'default-fallback-encryption-key-for-development';
// Derive a 32-byte key using SHA-256
const key = crypto.createHash('sha256').update(encryptionKey).digest();
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypts cleartext using AES-256-CBC.
 * Returns IV and ciphertext joined by a colon.
 */
export function encryptSettings(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts ciphertext format "IV:EncryptedText" using AES-256-CBC.
 */
export function decryptSettings(ciphertext: string): string {
  if (!ciphertext) return '';
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 2) {
      // If it doesn't have the colon separator, it might be unencrypted legacy value
      return ciphertext;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Decryption failed:', err);
    return '';
  }
}

/**
 * Masks a sensitive string for front-end rendering.
 */
export function maskSecret(secret: string): string {
  if (!secret) return '';
  return '••••••••';
}
