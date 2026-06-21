import crypto from 'crypto';

// Decode Base32 string to Buffer
function decodeBase32(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanBase32 = base32.replace(/[\s=]/g, '').toUpperCase();
  
  let bits = 0;
  let value = 0;
  const buffer = [];

  for (let i = 0; i < cleanBase32.length; i++) {
    const idx = alphabet.indexOf(cleanBase32[i]);
    if (idx === -1) {
      throw new Error(`Invalid base32 character: ${cleanBase32[i]}`);
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      buffer.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(buffer);
}

// Generate TOTP token for a given counter
function generateHOTP(secretBuffer: Buffer, counter: number): string {
  // Counter must be 8-byte buffer
  const buffer = Buffer.alloc(8);
  // Write counter as 64-bit integer
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff;
    counter = counter >> 8;
  }

  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(buffer);
  const hmacResult = hmac.digest();

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP token against a base32 secret.
 * @param token The 6-digit TOTP string to check
 * @param secret The base32 encoded secret key
 * @param window Time-step drift tolerance (default 1 = check current, previous, and next)
 */
export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  try {
    const secretBuffer = decodeBase32(secret);
    // Standard TOTP time step is 30 seconds
    const epoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(epoch / 30);

    // Check drift window
    for (let i = -window; i <= window; i++) {
      const generated = generateHOTP(secretBuffer, currentCounter + i);
      if (generated === token) {
        return true;
      }
    }
  } catch (err) {
    console.error('TOTP Verification Error:', err);
  }
  return false;
}
