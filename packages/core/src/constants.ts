export const TOOBIT_API_BASE_URL = "https://api.toobit.com";

export const DEFAULT_SOURCE_TAG = "MCP";

export const MODULES = [
  "market",
  "spot",
  "futures",
  "account",
] as const;

export type ModuleId = (typeof MODULES)[number];

export const DEFAULT_MODULES: ModuleId[] = ["spot", "futures", "account"];

export const TOOBIT_CANDLE_BARS = [
  "1m", "3m", "5m", "15m", "30m",
  "1h", "2h", "4h", "6h", "8h", "12h",
  "1d", "3d", "1w", "1M",
] as const;
