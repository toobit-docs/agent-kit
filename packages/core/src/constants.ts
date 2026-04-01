export const DELTA_API_BASE_URL = "https://api.india.delta.exchange";

export const DEFAULT_SOURCE_TAG = "MCP";

export const MODULES = [
  "market",
  "spot",
  "futures",
  "account",
] as const;

export type ModuleId = (typeof MODULES)[number];

export const DEFAULT_MODULES: ModuleId[] = ["spot", "futures", "account"];

export const DELTA_CANDLE_RESOLUTIONS = [
  "1m", "3m", "5m", "15m", "30m",
  "1h", "2h", "4h", "6h", "12h",
  "1d", "1w", "2w", "30d",
] as const;
