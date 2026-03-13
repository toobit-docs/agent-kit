import { getTimestamp, signToobitPayload } from "../utils/signature.js";
import {
  AuthenticationError,
  ConfigError,
  NetworkError,
  ToobitApiError,
  RateLimitError,
} from "../utils/errors.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import type { ToobitConfig } from "../config.js";
import type {
  QueryParams,
  QueryValue,
  RequestConfig,
  RequestResult,
} from "./types.js";

type CodeBehavior =
  | { retry: true; suggestion: string }
  | { retry: false; suggestion: string };

const TOOBIT_CODE_BEHAVIORS: Record<string, CodeBehavior> = {
  "-1000": { retry: true, suggestion: "Unknown error. Retry after a delay." },
  "-1001": { retry: true, suggestion: "Disconnected / internal error. Retry." },
  "-1003": { retry: true, suggestion: "Too many requests. Back off and retry." },
  "-1006": { retry: true, suggestion: "Unexpected response. Retry later." },
  "-1007": { retry: true, suggestion: "Timeout. Retry after a delay." },
  "-1016": { retry: true, suggestion: "Service shutting down. Retry later." },
  "-1002": { retry: false, suggestion: "Unauthorized. Check API key permissions." },
  "-1015": { retry: false, suggestion: "Too many orders. Reduce order frequency." },
  "-1020": { retry: false, suggestion: "Unsupported operation." },
  "-1021": { retry: false, suggestion: "Invalid timestamp. Check system clock sync." },
  "-1022": { retry: false, suggestion: "Invalid signature. Check API key and secret." },
  "-2010": { retry: false, suggestion: "New order rejected. Check order parameters." },
  "-2011": { retry: false, suggestion: "Cancel rejected. Order may already be filled." },
  "-2013": { retry: false, suggestion: "Order does not exist." },
  "-2014": { retry: false, suggestion: "Bad API key format." },
  "-2015": { retry: false, suggestion: "Invalid API key, IP, or permission." },
  "-2017": { retry: false, suggestion: "API key expired. Generate a new one." },
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

export class ToobitRestClient {
  private readonly config: ToobitConfig;
  private readonly rateLimiter = new RateLimiter();

  public constructor(config: ToobitConfig) {
    this.config = config;
  }

  public async publicGet<TData = unknown>(
    path: string,
    query?: QueryParams,
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({ method: "GET", path, auth: "public", query, rateLimit });
  }

  public async privateGet<TData = unknown>(
    path: string,
    query?: QueryParams,
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({ method: "GET", path, auth: "private", query, rateLimit });
  }

  public async privatePost<TData = unknown>(
    path: string,
    body?: RequestConfig["body"],
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({ method: "POST", path, auth: "private", body, rateLimit });
  }

  public async privateDelete<TData = unknown>(
    path: string,
    query?: QueryParams,
    rateLimit?: RequestConfig["rateLimit"],
  ): Promise<RequestResult<TData>> {
    return this.request<TData>({ method: "DELETE", path, auth: "private", query, rateLimit });
  }

  private async request<TData = unknown>(
    config: RequestConfig,
  ): Promise<RequestResult<TData>> {
    if (config.rateLimit) {
      await this.rateLimiter.consume(config.rateLimit);
    }

    const timestamp = getTimestamp();
    let allParams: QueryParams = { ...(config.query ?? {}) };
    const isBodyMethod = config.method === "POST" || config.method === "PUT";

    if (config.body) {
      Object.assign(allParams, config.body as unknown as QueryParams);
    }

    if (config.auth === "private") {
      if (!this.config.hasAuth) {
        throw new ConfigError(
          "Private endpoint requires API credentials.",
          "Configure TOOBIT_API_KEY and TOOBIT_SECRET_KEY.",
        );
      }

      allParams.timestamp = String(timestamp);
      const signPayload = buildQueryString(allParams);
      const signature = signToobitPayload(signPayload, this.config.secretKey!);
      allParams.signature = signature;
    }

    const paramString = buildQueryString(allParams);
    let url: string;
    let fetchBody: string | undefined;

    if (isBodyMethod && config.auth === "private") {
      url = `${this.config.baseUrl}${config.path}`;
      fetchBody = paramString || undefined;
    } else {
      const requestPath = paramString ? `${config.path}?${paramString}` : config.path;
      url = `${this.config.baseUrl}${requestPath}`;
      fetchBody = undefined;
    }

    const headers = new Headers({
      Accept: "application/json",
    });

    if (isBodyMethod) {
      headers.set("Content-Type", "application/x-www-form-urlencoded");
    }

    if (this.config.userAgent) {
      headers.set("User-Agent", this.config.userAgent);
    }

    if (config.auth === "private" && this.config.apiKey) {
      headers.set("X-BB-APIKEY", this.config.apiKey);
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
        `Failed to call Toobit endpoint ${config.method} ${config.path}.`,
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
        throw new ToobitApiError(
          `HTTP ${response.status} from Toobit: ${preview || "Non-JSON response"}`,
          { code: String(response.status), endpoint: `${config.method} ${config.path}` },
        );
      }
      throw new NetworkError(
        `Toobit returned non-JSON response for ${config.method} ${config.path}.`,
        `${config.method} ${config.path}`,
        error,
      );
    }

    if (response.status === 429) {
      throw new RateLimitError(
        "Rate limited by Toobit. Back off and retry.",
        "Reduce request frequency.",
        `${config.method} ${config.path}`,
      );
    }

    const responseCode = parsed.code as number | undefined;
    const responseMsg = (parsed.msg as string) || undefined;
    const endpoint = `${config.method} ${config.path}`;

    const hasBusinessCode = responseCode !== undefined && responseCode !== 0;

    if (hasBusinessCode) {
      const codeStr = String(responseCode);
      const message = responseMsg || "Toobit API request failed.";
      const behavior = TOOBIT_CODE_BEHAVIORS[codeStr];

      if (codeStr === "-1002" || codeStr === "-1022" || codeStr === "-1107" || codeStr === "-2014" || codeStr === "-2015" || codeStr === "-2017") {
        throw new AuthenticationError(
          message,
          behavior?.suggestion ?? "Check API key, secret key and permissions.",
          endpoint,
        );
      }

      if (codeStr === "-1003") {
        throw new RateLimitError(message, "Too many requests. Back off.", endpoint);
      }

      throw new ToobitApiError(message, {
        code: codeStr,
        endpoint,
        suggestion: behavior?.suggestion,
      });
    }

    if (!response.ok) {
      const rawMsg = responseMsg ?? "Unknown error";
      let suggestion: string | undefined;
      if (/symbol|paramter|parameter/i.test(rawMsg)) {
        const isFuturesPath = /futures|fundingRate|openInterest|markPrice|contract|longShort|insurance|riskLimit/i.test(config.path);
        suggestion = isFuturesPath
          ? "Futures endpoints require contract symbol format, e.g. BTC-SWAP-USDT instead of BTCUSDT."
          : "Spot endpoints require symbol format like BTCUSDT.";
      }
      throw new ToobitApiError(
        `HTTP ${response.status} from Toobit: ${rawMsg}`,
        { code: String(response.status), endpoint, suggestion },
      );
    }

    return {
      endpoint: `${config.method} ${config.path}`,
      requestTime: new Date().toISOString(),
      data: parsed as TData,
      raw: parsed,
    };
  }
}
