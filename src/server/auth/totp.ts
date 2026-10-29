import crypto from 'crypto';

/**
 * RFC 6238 Time-Based One-Time Password (TOTP) Implementation
 * Fully compliant with Google Authenticator, Microsoft Authenticator, and Apple Passwords.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(length = 20): string {
  const randomBytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < randomBytes.length; i++) {
    secret += BASE32_ALPHABET[randomBytes[i] % BASE32_ALPHABET.length];
  }
  return secret;
}

function base32Decode(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate 6-digit TOTP code for a given secret at a specific counter
 */
export function generateTotp(secret: string, timeStepWindow = 0): string {
  const timeStepSeconds = 30;
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStepSeconds) + timeStepWindow;

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter), 0);

  const keyBuffer = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', keyBuffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic Truncation
  const offset = digest[digest.length - 1] & 0xf;
  const codeInt =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const code = (codeInt % 1000000).toString().padStart(6, '0');
  return code;
}

/**
 * Verify a 6-digit TOTP code allowing +/- 1 window (30-second drift tolerance)
 */
export function verifyTotp(secret: string, userCode: string, allowedDriftWindows = 1): boolean {
  const normalizedCode = userCode.trim();
  if (normalizedCode.length !== 6 || !/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  for (let window = -allowedDriftWindows; window <= allowedDriftWindows; window++) {
    const validCode = generateTotp(secret, window);
    if (crypto.timingSafeEqual(Buffer.from(validCode), Buffer.from(normalizedCode))) {
      return true;
    }
  }

  return false;
}

/**
 * Generate standard otpauth:// URL for Google Authenticator / Microsoft Authenticator
 */
export function getTotpAuthUrl(email: string, secret: string, issuer = 'RepairGraph'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

