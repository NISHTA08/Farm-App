type OtpEntry = { otp: string; expiresAt: number; attempts: number };

const globalForOtp = globalThis as typeof globalThis & { __otpStore?: Map<string, OtpEntry> };
if (!globalForOtp.__otpStore) {
  globalForOtp.__otpStore = new Map<string, OtpEntry>();
}
const otpStore = globalForOtp.__otpStore;

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOtp(phone: string, otp: string): void {
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });
}

export function verifyOtp(phone: string, otp: string): { valid: boolean; error?: string } {
  const entry = otpStore.get(phone);

  if (!entry) {
    return { valid: false, error: "OTP expired or not found. Please request a new one." };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return { valid: false, error: "OTP has expired. Please request a new one." };
  }

  if (entry.attempts >= 3) {
    otpStore.delete(phone);
    return { valid: false, error: "Too many attempts. Please request a new OTP." };
  }

  if (entry.otp !== otp) {
    entry.attempts++;
    return { valid: false, error: `Incorrect OTP. ${3 - entry.attempts} attempts remaining.` };
  }

  otpStore.delete(phone);
  return { valid: true };
}

export function generateAuthToken(phone: string): string {
  const payload = { phone, iat: Date.now(), exp: Date.now() + 30 * 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}
