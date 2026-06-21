import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'krishna-stationery-super-secret-key-2026';

function base64url(str: Buffer | string): string {
  const base64 = typeof str === 'string' ? Buffer.from(str).toString('base64') : str.toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Signs a payload into a JWT token.
 * @param payload Data to encode in token
 * @param expiresInSeconds Lifespan in seconds (e.g. 900 for 15 min, 604800 for 7 days)
 */
export function signJWT(payload: any, expiresInSeconds: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = base64url(JSON.stringify(header));
  
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };
  const payloadStr = base64url(JSON.stringify(fullPayload));
  
  const signatureInput = `${headerStr}.${payloadStr}`;
  const signature = base64url(
    crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest()
  );
  
  return `${signatureInput}.${signature}`;
}

/**
 * Verifies a JWT token and returns payload, or null if invalid/expired.
 * @param token JWT token string
 */
export function verifyJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerStr, payloadStr, signature] = parts;
    const signatureInput = `${headerStr}.${payloadStr}`;
    const expectedSignature = base64url(
      crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest()
    );
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(fromBase64url(payloadStr));
    const currentEpoch = Math.floor(Date.now() / 1000);
    if (payload.exp && currentEpoch > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}
