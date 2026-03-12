import { createHmac } from "node:crypto";

export function getTimestamp(): number {
  return Date.now();
}

/**
 * Toobit HMAC-SHA256 signature.
 * Input: query string of all params (excluding 'signature') sorted or unsorted.
 * Returns hex-encoded HMAC-SHA256.
 */
export function signToobitPayload(queryString: string, secretKey: string): string {
  return createHmac("sha256", secretKey).update(queryString).digest("hex");
}
