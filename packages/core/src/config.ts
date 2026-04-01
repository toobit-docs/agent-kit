import { DEFAULT_MODULES, MODULES, DELTA_API_BASE_URL, DEFAULT_SOURCE_TAG, type ModuleId } from "./constants.js";
import { ConfigError } from "./utils/errors.js";
import { readTomlProfile } from "./config/toml.js";

export interface CliOptions {
  modules?: string;
  readOnly: boolean;
  profile?: string;
  userAgent?: string;
  sourceTag?: string;
}

export interface DeltaConfig {
  apiKey?: string;
  secretKey?: string;
  hasAuth: boolean;
  baseUrl: string;
  timeoutMs: number;
  modules: ModuleId[];
  readOnly: boolean;
  userAgent?: string;
  sourceTag: string;
}

function parseModuleList(rawModules?: string): ModuleId[] {
  if (!rawModules || rawModules.trim().length === 0) {
    return [...DEFAULT_MODULES];
  }

  const trimmed = rawModules.trim().toLowerCase();
  if (trimmed === "all") {
    return [...MODULES] as ModuleId[];
  }

  const requested = trimmed
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (requested.length === 0) {
    return [...DEFAULT_MODULES];
  }

  const deduped = new Set<ModuleId>();
  for (const moduleId of requested) {
    if (!MODULES.includes(moduleId as ModuleId)) {
      throw new ConfigError(
        `Unknown module "${moduleId}".`,
        `Use one of: ${MODULES.join(", ")}, or "all".`,
      );
    }
    deduped.add(moduleId as ModuleId);
  }

  return Array.from(deduped);
}

/**
 * Credential priority:
 *   1. Environment variables (DELTA_API_KEY / DELTA_SECRET_KEY)
 *   2. ~/.delta/config.toml — profile
 */
export function loadConfig(cli: CliOptions): DeltaConfig {
  const toml = readTomlProfile(cli.profile);

  const apiKey = process.env.DELTA_API_KEY?.trim() ?? toml.api_key;
  const secretKey = process.env.DELTA_SECRET_KEY?.trim() ?? toml.secret_key;

  const hasAuth = Boolean(apiKey && secretKey);
  const partialAuth = Boolean(apiKey) || Boolean(secretKey);

  if (partialAuth && !hasAuth) {
    throw new ConfigError(
      "Partial API credentials detected.",
      "Set DELTA_API_KEY and DELTA_SECRET_KEY together (env vars or config.toml profile).",
    );
  }

  const rawBaseUrl =
    process.env.DELTA_API_BASE_URL?.trim() ?? toml.base_url ?? DELTA_API_BASE_URL;
  if (!rawBaseUrl.startsWith("http://") && !rawBaseUrl.startsWith("https://")) {
    throw new ConfigError(
      `Invalid base URL "${rawBaseUrl}".`,
      "DELTA_API_BASE_URL must start with http:// or https://",
    );
  }
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");

  const rawTimeout = process.env.DELTA_TIMEOUT_MS
    ? Number(process.env.DELTA_TIMEOUT_MS)
    : (toml.timeout_ms ?? 15_000);
  if (!Number.isFinite(rawTimeout) || rawTimeout <= 0) {
    throw new ConfigError(
      `Invalid timeout value "${rawTimeout}".`,
      "Set DELTA_TIMEOUT_MS as a positive integer in milliseconds.",
    );
  }

  return {
    apiKey,
    secretKey,
    hasAuth,
    baseUrl,
    timeoutMs: Math.floor(rawTimeout),
    modules: parseModuleList(cli.modules),
    readOnly: cli.readOnly,
    userAgent: cli.userAgent,
    sourceTag: cli.sourceTag ?? DEFAULT_SOURCE_TAG,
  };
}
