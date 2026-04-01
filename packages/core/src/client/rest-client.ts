import { getTimestampSeconds, signDeltaRequest } from "../utils/signature.js";
import {
  AuthenticationError,
  ConfigError,
  NetworkError,
  DeltaApiError,
  RateLimitError,
} from "../utils/errors.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import type { DeltaConfig } from "../config.js";
import type {
  QueryParams,
  QueryValue,
  RequestConfig,
  RequestResult,
} from "./types.js";

/**
 * Delta Exchange error code → suggestion map.
 * Delta uses string error codes in the `error.code` field of error responses.
 */
const DELTA_ERROR_SUGGESTIONS: Record<string, string> = {
  insufficient_margin: "Insufficient margin. Add funds or reduce position size.",
  immediate_liquidation: "Order would cause immediate liquidation. Reduce size or adjust price.",
  order_size_exceed_available: "Order size exceeds available balance.",
  order_overlap: "Duplicate order detected. Check for existing orders.",
  invalid_api_key: "Invalid API key. Check your DELTA_API_KEY.",
  expired_token: "API token expired. Generate a new API key.",
  ip_not_whitelisted: "IP address not whitelisted. Add your IP in the Delta Exchange dashboard.",
  forbidden: "Action not allowed. Check API key permissions.",
  entity_not_found: "Order or resource not found.",
  rate_limit_exceeded: "Rate limit exceeded. Slow down requests.",
  invalid_signature: "Invalid signature. Check DELTA_SECRET_KEY and system clock sync.",
  timestamp_mismatch: "Timestamp mismatch. Ensure system clock is accurate (within 5 seconds).",
  insufficient_open_position: "Insufficient open position to close.",
  product_not_found: "Product not found. Check the product_id or symbol.",
  invalid_leverage: "Invalid leverage value. Check the allowed range for this product.",
};

function isDefined(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function stringifyQueryValue(value: QueryValue): string {
  if (Array.isArray(value)) return value.map(String).join(",");
  return String(value);
}

function buildQueryString(query?: QueryParams): string {
  if (!query) return "";
  const entries = Object.entries(query).filter(([, v]) => isDefined(v));
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${k}=${stringifyQueryValue(v!)}`).join("&");
}

export class DeltaRestClient {
  private readonly config: DeltaConfig;
  private readonly rateLimiter = new RateLimiter();

  public constructor(config: DeltaConfig) {
    this.config = config;
  }

  public async publicGet<TData = unknown>(
    path: string,
    query?: Record<string, unknown>,
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({ method: "GET", path, auth: "public", query: query as QueryParams, rateLimit });
  }

  public async privateGet<TData = unknown>(
    path: string,
    query?: Record<string, unknown>,
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({ method: "GET", path, auth: "private", query: query as QueryParams, rateLimit });
  }

  public async privatePost<TData = unknown>(
    path: string,
    body?: RequestConfig["body"],
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({ method: "POST", path, auth: "private", body, rateLimit });
  }

  public async privatePut<TData = unknown>(
    path: string,
    body?: RequestConfig["body"],
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({ method: "PUT", path, auth: "private", body, rateLimit });
  }

  /** Delta Exchange DELETE requests use a JSON body, not query params. */
  public async privateDelete<TData = unknown>(
    path: string,
    body?: RequestConfig["body"],
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({ method: "DELETE", path, auth: "private", body, rateLimit });
  }

  private async request<TData = unknown>(
    config: RequestConfig,
  ): Promise<RequestResult<TData>> {
    if (config.rateLimit) {
      await this.rateLimiter.consume(config.rateLimit);
    }

    const isBodyMethod = config.method === "POST" || config.method === "PUT" || config.method === "DELETE";

    // For GET: params go in query string; for POST/PUT/DELETE: params go in JSON body
    const queryString = config.method === "GET" ? buildQueryString(config.query) : "";
    const bodyPayload = isBodyMethod && config.body ? config.body : undefined;
    const bodyString = bodyPayload ? JSON.stringify(bodyPayload) : "";

    let url: string;
    let fetchBody: string | undefined;

    if (config.method === "GET") {
      const requestPath = queryString ? `${config.path}?${queryString}` : config.path;
      url = `${this.config.baseUrl}${requestPath}`;
      fetchBody = undefined;
    } else {
      url = `${this.config.baseUrl}${config.path}`;
      fetchBody = bodyString || undefined;
    }

    const headers = new Headers({
      Accept: "application/json",
    });

    if (isBodyMethod) {
      headers.set("Content-Type", "application/json");
    }

    if (this.config.userAgent) {
      headers.set("User-Agent", this.config.userAgent);
    }

    if (config.auth === "private") {
      if (!this.config.hasAuth) {
        throw new ConfigError(
          "Private endpoint requires API credentials.",
          "Configure DELTA_API_KEY and DELTA_SECRET_KEY.",
        );
      }

      const timestamp = getTimestampSeconds();
      const signature = signDeltaRequest(
        config.method,
        timestamp,
        config.path,
        queryString,
        bodyString,
        this.config.secretKey!,
      );

      headers.set("api-key", this.config.apiKey!);
      headers.set("timestamp", String(timestamp));
      headers.set("signature", signature);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: config.method,
        headers,
        body: fetchBody,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      throw new NetworkError(
        `Failed to call Delta Exchange endpoint ${config.method} ${config.path}.`,
        `${config.method} ${config.path}`,
        error,
      );
    }

    const rawText = await response.text();
    let parsed: Record<string, unknown>;
    try {
      parsed = (rawText ? JSON.parse(rawText) : {}) as Record<string, unknown>;
    } catch (error) {
      if (!response.ok) {
        const preview = rawText.slice(0, 160).replace(/\s+/g, " ").trim();
        throw new DeltaApiError(
          `HTTP ${response.status} from Delta Exchange: ${preview || "Non-JSON response"}`,
          { code: String(response.status), endpoint: `${config.method} ${config.path}` },
        );
      }
      throw new NetworkError(
        `Delta Exchange returned non-JSON response for ${config.method} ${config.path}.`,
        `${config.method} ${config.path}`,
        error,
      );
    }

    if (response.status === 429) {
      throw new RateLimitError(
        "Rate limited by Delta Exchange. Back off and retry.",
        "Reduce request frequency. Default quota is 10,000 per 5-minute window.",
        `${config.method} ${config.path}`,
      );
    }

    const endpoint = `${config.method} ${config.path}`;

    // Delta Exchange error format: { "success": false, "error": { "code": "...", "context": {...} } }
    if (parsed.success === false) {
      const err = parsed.error as Record<string, unknown> | undefined;
      const code = (err?.code as string) ?? String(response.status);
      const message = `Delta Exchange API error: ${code}`;
      const suggestion = DELTA_ERROR_SUGGESTIONS[code];

      const authCodes = new Set(["invalid_api_key", "expired_token", "ip_not_whitelisted", "forbidden", "invalid_signature"]);
      if (authCodes.has(code)) {
        throw new AuthenticationError(message, suggestion ?? "Check API key, secret key and permissions.", endpoint);
      }

      if (code === "rate_limit_exceeded") {
        throw new RateLimitError(message, suggestion ?? "Reduce request frequency.", endpoint);
      }

      throw new DeltaApiError(message, { code, endpoint, suggestion });
    }

    if (!response.ok) {
      const err = parsed.error as Record<string, unknown> | undefined;
      const code = (err?.code as string) ?? String(response.status);
      throw new DeltaApiError(
        `HTTP ${response.status} from Delta Exchange: ${code}`,
        { code, endpoint, suggestion: DELTA_ERROR_SUGGESTIONS[code] },
      );
    }

    // Delta wraps successful data in a `result` field; surface that as `data`
    const resultData = (parsed.result !== undefined ? parsed.result : parsed) as TData;

    return {
      endpoint,
      requestTime: new Date().toISOString(),
      data: resultData,
      raw: parsed,
    };
  }
}
