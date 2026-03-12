import type { RateLimitConfig } from "../utils/rate-limiter.js";

export type QueryValue = string | number | boolean | string[];

export type QueryParams = Record<string, QueryValue | undefined>;

export interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  auth: "public" | "private";
  query?: QueryParams;
  body?: Record<string, unknown> | Record<string, unknown>[];
  rateLimit?: RateLimitConfig;
}

export interface RequestResult<TData = unknown> {
  endpoint: string;
  requestTime: string;
  data: TData;
  raw: unknown;
}
