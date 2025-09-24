import crypto from 'crypto';

export function hmacSign(raw: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(raw).digest('hex');
}

export function hmacVerify(raw: string, sig: string | null, secret: string) {
  if (!sig) return false;
  const expect = hmacSign(raw, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(sig));
  } catch {
    return false;
  }
}


