import { createClient } from 'redis';
import { config } from '../config';

const client = createClient({ url: config.redisUrl });

client.on('error', (err) => {
  console.error('[Redis] connection error:', err.message);
});

let connected = false;

async function connect(): Promise<void> {
  if (!connected && !client.isOpen) {
    await client.connect();
    connected = true;
  }
}

// ─── Verification Code (SMS) ──────────────

const CODE_PREFIX = 'verify:code:';
const RATE_PREFIX = 'verify:rate:';
const CODE_TTL = 300;   // 5 minutes
const RATE_TTL = 86400; // 1 day
const MAX_CODES_PER_DAY = 5;
const MIN_INTERVAL_SECONDS = 60;

export async function setVerificationCode(phone: string, code: string): Promise<void> {
  await connect();
  await client.setEx(`${CODE_PREFIX}${phone}`, CODE_TTL, code);
}

export async function verifyCode(phone: string, code: string): Promise<boolean> {
  await connect();
  const stored = await client.get(`${CODE_PREFIX}${phone}`);
  if (stored === code) {
    await client.del(`${CODE_PREFIX}${phone}`);
    return true;
  }
  return false;
}

export async function checkSendLimit(phone: string): Promise<{ allowed: boolean; retryAfter?: number; reason?: string }> {
  await connect();

  // Check min interval
  const lastSendStr = await client.get(`${RATE_PREFIX}${phone}:last`);
  if (lastSendStr) {
    const elapsed = Date.now() - parseInt(lastSendStr, 10);
    if (elapsed < MIN_INTERVAL_SECONDS * 1000) {
      return {
        allowed: false,
        retryAfter: MIN_INTERVAL_SECONDS - Math.floor(elapsed / 1000),
        reason: 'Too frequent, please wait before requesting another code',
      };
    }
  }

  // Check daily limit
  const dailyCount = await client.get(`${RATE_PREFIX}${phone}:daily`);
  if (dailyCount && parseInt(dailyCount, 10) >= MAX_CODES_PER_DAY) {
    return {
      allowed: false,
      retryAfter: (await client.ttl(`${RATE_PREFIX}${phone}:daily`)) || 86400,
      reason: 'Daily code limit exceeded',
    };
  }

  return { allowed: true };
}

export async function recordSendAttempt(phone: string): Promise<void> {
  await connect();
  const now = Date.now().toString();
  await client.set(`${RATE_PREFIX}${phone}:last`, now);

  // Increment daily counter
  const multi = client.multi();
  multi.incr(`${RATE_PREFIX}${phone}:daily`);
  multi.expire(`${RATE_PREFIX}${phone}:daily`, RATE_TTL, 'NX');
  await multi.exec();
}

// ─── Token Blacklist (logout) ──────────────

export async function blacklistToken(token: string, ttlSeconds: number): Promise<void> {
  await connect();
  await client.setEx(`blacklist:${token}`, ttlSeconds, '1');
}

export async function isBlacklisted(token: string): Promise<boolean> {
  await connect();
  return (await client.exists(`blacklist:${token}`)) === 1;
}
