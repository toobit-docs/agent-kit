import type { ToolSpec } from "./types.js";
import { asRecord, compactObject, readNumber, readString, requireString } from "./helpers.js";
import { publicRateLimit, TOOBIT_CANDLE_BARS } from "./common.js";

function normalize(response: { endpoint: string; requestTime: string; data: unknown }): Record<string, unknown> {
  return { endpoint: response.endpoint, requestTime: response.requestTime, data: response.data };
}

export function registerMarketTools(): ToolSpec[] {
  return [
    {
      name: "market_get_server_time",
      module: "market",
      description: "Get Toobit server time. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: { type: "object", properties: {} },
      handler: async (_rawArgs, context) => {
        const response = await context.client.publicGet("/api/v1/time", {}, publicRateLimit("market_get_server_time", 20));
        return normalize(response);
      },
    },
    {
      name: "market_get_exchange_info",
      module: "market",
      description: "Get exchange info including trading rules, symbol list, rate limits. Public endpoint. Rate limit: 10 req/s.",
      isWrite: false,
      inputSchema: { type: "object", properties: {} },
      handler: async (_rawArgs, context) => {
        const response = await context.client.publicGet("/api/v1/exchangeInfo", {}, publicRateLimit("market_get_exchange_info", 10));
        return normalize(response);
      },
    },
    {
      name: "market_get_depth",
      module: "market",
      description: "Get order book depth for a symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          limit: { type: "number", description: "Depth per side, default 100, max 100" },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/depth",
          compactObject({ symbol: requireString(args, "symbol"), limit: readNumber(args, "limit") }),
          publicRateLimit("market_get_depth", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_merged_depth",
      module: "market",
      description: "Get merged order book depth for a symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          scale: { type: "number", description: "Price merge precision" },
          limit: { type: "number", description: "Default 40, max 100" },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/depth/merged",
          compactObject({ symbol: requireString(args, "symbol"), scale: readNumber(args, "scale"), limit: readNumber(args, "limit") }),
          publicRateLimit("market_get_merged_depth", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_trades",
      module: "market",
      description: "Get recent trades for a symbol. Default 60 records, max 60. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          limit: { type: "number", description: "Default 60, max 60" },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/trades",
          compactObject({ symbol: requireString(args, "symbol"), limit: readNumber(args, "limit") }),
          publicRateLimit("market_get_trades", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_klines",
      module: "market",
      description: "Get candlestick (OHLCV) data for a symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          interval: { type: "string", enum: [...TOOBIT_CANDLE_BARS], description: "K-line interval, e.g. 1m, 1h, 1d" },
          startTime: { type: "number", description: "Start time in ms" },
          endTime: { type: "number", description: "End time in ms" },
          limit: { type: "number", description: "Default 500, max 1000" },
        },
        required: ["symbol", "interval"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/klines",
          compactObject({
            symbol: requireString(args, "symbol"),
            interval: requireString(args, "interval"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          publicRateLimit("market_get_klines", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_ticker_24hr",
      module: "market",
      description: "Get 24h price change statistics for a spot symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT. Omit for all symbols." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/ticker/24hr",
          compactObject({ symbol: readString(args, "symbol") }),
          publicRateLimit("market_get_ticker_24hr", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_ticker_price",
      module: "market",
      description: "Get latest price for a spot symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT. Omit for all symbols." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/ticker/price",
          compactObject({ symbol: readString(args, "symbol") }),
          publicRateLimit("market_get_ticker_price", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_book_ticker",
      module: "market",
      description: "Get best bid/ask price for a spot symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT. Omit for all symbols." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/ticker/bookTicker",
          compactObject({ symbol: readString(args, "symbol") }),
          publicRateLimit("market_get_book_ticker", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_index_klines",
      module: "market",
      description: "Get index K-line data. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          interval: { type: "string", enum: [...TOOBIT_CANDLE_BARS] },
          startTime: { type: "number" },
          endTime: { type: "number" },
          limit: { type: "number", description: "Default 500, max 1000" },
        },
        required: ["symbol", "interval"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/index/klines",
          compactObject({
            symbol: requireString(args, "symbol"),
            interval: requireString(args, "interval"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          publicRateLimit("market_get_index_klines", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_mark_price",
      module: "market",
      description: "Get latest mark price for a futures symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT. Omit for all." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/markPrice",
          compactObject({ symbol: readString(args, "symbol") }),
          publicRateLimit("market_get_mark_price", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_mark_price_klines",
      module: "market",
      description: "Get mark price K-line data. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          interval: { type: "string", enum: [...TOOBIT_CANDLE_BARS] },
          startTime: { type: "number" },
          endTime: { type: "number" },
          limit: { type: "number" },
        },
        required: ["symbol", "interval"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/markPrice/klines",
          compactObject({
            symbol: requireString(args, "symbol"),
            interval: requireString(args, "interval"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          publicRateLimit("market_get_mark_price_klines", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_funding_rate",
      module: "market",
      description: "Get current funding rate for a futures symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT. Omit for all." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v1/futures/fundingRate",
          compactObject({ symbol: readString(args, "symbol") }),
          publicRateLimit("market_get_funding_rate", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_funding_rate_history",
      module: "market",
      description: "Get historical funding rates for a futures symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          limit: { type: "number", description: "Default 100, max 1000" },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v1/futures/historyFundingRate",
          compactObject({
            symbol: requireString(args, "symbol"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          publicRateLimit("market_get_funding_rate_history", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_open_interest",
      module: "market",
      description: "Get total open interest for a futures symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT. Omit for all." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/openInterest",
          compactObject({ symbol: readString(args, "symbol") }),
          publicRateLimit("market_get_open_interest", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_long_short_ratio",
      module: "market",
      description: "Get global long/short account ratio. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          period: { type: "string", description: "e.g. 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          limit: { type: "number" },
        },
        required: ["symbol", "period"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/globalLongShortAccountRatio",
          compactObject({
            symbol: requireString(args, "symbol"),
            period: requireString(args, "period"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          publicRateLimit("market_get_long_short_ratio", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_contract_ticker_24hr",
      module: "market",
      description: "Get 24h price change statistics for a futures contract. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT. Omit for all." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/contract/ticker/24hr",
          compactObject({ symbol: readString(args, "symbol") }),
          publicRateLimit("market_get_contract_ticker_24hr", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_contract_ticker_price",
      module: "market",
      description: "Get latest price for a futures contract. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT. Omit for all." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/contract/ticker/price",
          compactObject({ symbol: readString(args, "symbol") }),
          publicRateLimit("market_get_contract_ticker_price", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_index_price",
      module: "market",
      description: "Get index price for a futures symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT. Omit for all." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/quote/v1/index",
          compactObject({ symbol: readString(args, "symbol") }),
          publicRateLimit("market_get_index_price", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_insurance_fund",
      module: "market",
      description: "Get insurance fund balance for a symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v1/futures/insuranceBySymbol",
          { symbol: requireString(args, "symbol") },
          publicRateLimit("market_get_insurance_fund", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_risk_limits",
      module: "market",
      description: "Get risk limits configuration for a futures symbol. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v1/futures/riskLimits",
          { symbol: requireString(args, "symbol") },
          publicRateLimit("market_get_risk_limits", 20),
        );
        return normalize(response);
      },
    },
  ];
}
