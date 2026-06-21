const crypto = require('crypto');

function decodeBase32(base32) {
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

function generateHOTP(secretBuffer, counter) {
  const buffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff;
    counter = counter >> 8;
  }

  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(buffer);
  const hmacResult = hmac.digest();

  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

function getTOTP(secret) {
  const secretBuffer = decodeBase32(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(epoch / 30);
  return generateHOTP(secretBuffer, currentCounter);
}

const secret = 'KRIW E43O ON2W E4ZB JVEW K33O MVSX G';
console.log('CURRENT_TOTP_CODE:', getTOTP(secret));
