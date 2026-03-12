import type { RateLimitConfig } from "../utils/rate-limiter.js";

export const TOOBIT_CANDLE_BARS = [
  "1m", "3m", "5m", "15m", "30m",
  "1h", "2h", "4h", "6h", "8h", "12h",
  "1d", "3d", "1w", "1M",
] as const;

export function publicRateLimit(key: string, rps = 20): RateLimitConfig {
  return { key: `public:${key}`, capacity: rps, refillPerSecond: rps };
}

export function privateRateLimit(key: string, rps = 10): RateLimitConfig {
  return { key: `private:${key}`, capacity: rps, refillPerSecond: rps };
}
