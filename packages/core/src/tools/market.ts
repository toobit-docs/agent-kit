import type { ToolSpec } from "./types.js";
import { asRecord, compactObject, readNumber, readString, requireString } from "./helpers.js";
import { publicRateLimit, DELTA_CANDLE_RESOLUTIONS } from "./common.js";
import { ValidationError } from "../utils/errors.js";

function readPositiveInt(args: Record<string, unknown>, key: string): number | undefined {
  const value = readNumber(args, key);
  if (value !== undefined && value < 1) {
    throw new ValidationError(`Parameter "${key}" must be a positive integer.`);
  }
  return value;
}

function normalize(response: { endpoint: string; requestTime: string; data: unknown }): Record<string, unknown> {
  return { endpoint: response.endpoint, requestTime: response.requestTime, data: response.data };
}

export function registerMarketTools(): ToolSpec[] {
  return [
    {
      name: "market_get_products",
      module: "market",
      description: "List all products (contracts) on Delta Exchange. Filter by contract_types (perpetual_futures, futures, call_options, put_options, spot, interest_rate_swaps, move_options, spreads) and/or underlying asset symbols. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          contract_types: { type: "string", description: "Comma-separated contract types, e.g. perpetual_futures,futures" },
          underlying_asset_symbols: { type: "string", description: "Comma-separated underlying asset symbols, e.g. BTC,ETH" },
          state: { type: "string", enum: ["live", "expired", "upcoming", "settled"], description: "Filter by product state" },
          page_size: { type: "number", description: "Results per page" },
          after: { type: "string", description: "Cursor for next page" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v2/products",
          compactObject({
            contract_types: readString(args, "contract_types"),
            underlying_asset_symbols: readString(args, "underlying_asset_symbols"),
            state: readString(args, "state"),
            page_size: readNumber(args, "page_size"),
            after: readString(args, "after"),
          }),
          publicRateLimit("market_get_products", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_assets",
      module: "market",
      description: "List all supported assets (cryptocurrencies and fiat currencies). Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: { type: "object", properties: {} },
      handler: async (_rawArgs, context) => {
        const response = await context.client.publicGet("/v2/assets", {}, publicRateLimit("market_get_assets", 20));
        return normalize(response);
      },
    },
    {
      name: "market_get_tickers",
      module: "market",
      description: "Get live market data (price, mark price, funding rate, OI, volume) for all products or filtered by contract type. Omitting filters returns all tickers. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          contract_types: { type: "string", description: "Comma-separated contract types to filter, e.g. perpetual_futures" },
          underlying_asset_symbols: { type: "string", description: "Comma-separated underlying asset symbols, e.g. BTC,ETH" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v2/tickers",
          compactObject({
            contract_types: readString(args, "contract_types"),
            underlying_asset_symbols: readString(args, "underlying_asset_symbols"),
          }),
          publicRateLimit("market_get_tickers", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_ticker",
      module: "market",
      description: "Get live market data for a single product by symbol. Returns price, mark price, funding rate, open interest, 24h volume, and more. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Product symbol, e.g. BTCUSD for BTC perpetual, BTCUSDT for BTC spot" },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const symbol = requireString(args, "symbol");
        const response = await context.client.publicGet(
          `/v2/tickers/${encodeURIComponent(symbol)}`,
          {},
          publicRateLimit("market_get_ticker", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_orderbook",
      module: "market",
      description: "Get Level 2 order book for a product. Returns bids and asks up to the requested depth. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Product symbol, e.g. BTCUSD" },
          depth: { type: "number", description: "Number of levels per side (default 10, max 200)" },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v2/orderbook",
          compactObject({
            symbol: requireString(args, "symbol"),
            depth: readPositiveInt(args, "depth"),
          }),
          publicRateLimit("market_get_orderbook", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_trades",
      module: "market",
      description: "Get recent public trades for a product. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Product symbol, e.g. BTCUSD" },
          limit: { type: "number", description: "Number of trades to return" },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v2/trades",
          compactObject({
            symbol: requireString(args, "symbol"),
            limit: readPositiveInt(args, "limit"),
          }),
          publicRateLimit("market_get_trades", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_candles",
      module: "market",
      description: "Get OHLCV candlestick data for a product. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Product symbol, e.g. BTCUSD" },
          resolution: { type: "string", enum: [...DELTA_CANDLE_RESOLUTIONS], description: "Candle interval, e.g. 1m, 1h, 1d" },
          start: { type: "number", description: "Start time as Unix timestamp (seconds)" },
          end: { type: "number", description: "End time as Unix timestamp (seconds)" },
        },
        required: ["symbol", "resolution"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v2/candles",
          compactObject({
            symbol: requireString(args, "symbol"),
            resolution: requireString(args, "resolution"),
            start: readNumber(args, "start"),
            end: readNumber(args, "end"),
          }),
          publicRateLimit("market_get_candles", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_indices",
      module: "market",
      description: "Get spot price indices used as underlying references for Delta Exchange products. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          underlying_asset_symbol: { type: "string", description: "Filter by underlying asset symbol, e.g. BTC" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v2/indices",
          compactObject({ underlying_asset_symbol: readString(args, "underlying_asset_symbol") }),
          publicRateLimit("market_get_indices", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "market_get_settlement_prices",
      module: "market",
      description: "Get settlement prices for expired products. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Product symbol to filter" },
          page_size: { type: "number" },
          after: { type: "string", description: "Cursor for next page" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v2/settlement_prices",
          compactObject({
            symbol: readString(args, "symbol"),
            page_size: readNumber(args, "page_size"),
            after: readString(args, "after"),
          }),
          publicRateLimit("market_get_settlement_prices", 20),
        );
        return normalize(response);
      },
    },
  ];
}
