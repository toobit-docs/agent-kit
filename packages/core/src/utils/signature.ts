import { createHmac } from "node:crypto";

/** Returns current Unix timestamp in seconds (Delta Exchange requires seconds, not ms). */
export function getTimestampSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Delta Exchange HMAC-SHA256 signature.
 * Signature input: method + timestamp + path + queryString + body
 * Returns hex-encoded HMAC-SHA256.
 */
export function signDeltaRequest(
  method: string,
  timestamp: number,
  path: string,
  queryString: string,
  body: string,
  secretKey: string,
): string {
  const signatureData = method + String(timestamp) + path + queryString + body;
  return createHmac("sha256", secretKey).update(signatureData).digest("hex");
}
