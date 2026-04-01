import type { ToolSpec } from "./types.js";
import { asRecord, compactObject, readNumber, readString, requireString } from "./helpers.js";
import { privateRateLimit } from "./common.js";

function normalize(response: { endpoint: string; requestTime: string; data: unknown }): Record<string, unknown> {
  return { endpoint: response.endpoint, requestTime: response.requestTime, data: response.data };
}

/**
 * Spot trading tools for Delta Exchange.
 * Delta Exchange supports spot products (contract_type = "spot") such as BTC/USDT, ETH/USDT,
 * SOL/USDT, DETO/USDT, and USDC/USDT. Spot orders use the same /v2/orders endpoint as futures —
 * just reference the spot product_id or product_symbol.
 */
export function registerSpotTradeTools(): ToolSpec[] {
  return [
    {
      name: "spot_place_order",
      module: "spot",
      description: "Place a spot order on Delta Exchange (limit_order or market_order). Use product_id or product_symbol to specify the spot pair (e.g. BTCUSDT_SP). [CAUTION] Executes real trades. Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Spot product ID (use market_get_products with contract_types=spot to look up)" },
          product_symbol: { type: "string", description: "Spot product symbol, e.g. BTCUSDT_SP" },
          side: { type: "string", enum: ["buy", "sell"] },
          order_type: { type: "string", enum: ["limit_order", "market_order"], description: "Order type" },
          size: { type: "number", description: "Order quantity" },
          limit_price: { type: "string", description: "Limit price (required for limit_order)" },
          client_order_id: { type: "string", description: "Optional client order ID" },
          time_in_force: { type: "string", enum: ["gtc", "ioc", "fok"], description: "Time in force (default: gtc)" },
        },
        required: ["side", "order_type", "size"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/v2/orders",
          compactObject({
            product_id: readNumber(args, "product_id"),
            product_symbol: readString(args, "product_symbol"),
            side: requireString(args, "side"),
            order_type: requireString(args, "order_type"),
            size: readNumber(args, "size"),
            limit_price: readString(args, "limit_price"),
            client_order_id: readString(args, "client_order_id"),
            time_in_force: readString(args, "time_in_force"),
          }),
          privateRateLimit("spot_place_order", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_cancel_order",
      module: "spot",
      description: "Cancel an open spot order by order ID. Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "number", description: "Order ID" },
          product_id: { type: "number", description: "Product ID of the spot pair" },
        },
        required: ["id", "product_id"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateDelete(
          "/v2/orders",
          compactObject({
            id: readNumber(args, "id"),
            product_id: readNumber(args, "product_id"),
          }),
          privateRateLimit("spot_cancel_order", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_batch_cancel_orders",
      module: "spot",
      description: "Cancel all open spot orders for a product. [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Spot product ID" },
          cancel_limit_orders: { type: "boolean", description: "Cancel limit orders (default true)" },
          cancel_stop_orders: { type: "boolean", description: "Cancel stop orders (default true)" },
        },
        required: ["product_id"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateDelete(
          "/v2/orders/all",
          compactObject({
            product_id: readNumber(args, "product_id"),
            cancel_limit_orders: args.cancel_limit_orders,
            cancel_stop_orders: args.cancel_stop_orders,
          }),
          privateRateLimit("spot_batch_cancel_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_amend_order",
      module: "spot",
      description: "Amend an open spot order (price or size). Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "number", description: "Order ID" },
          product_id: { type: "number", description: "Spot product ID" },
          limit_price: { type: "string", description: "New limit price" },
          size: { type: "number", description: "New order size" },
        },
        required: ["id", "product_id"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePut(
          "/v2/orders",
          compactObject({
            id: readNumber(args, "id"),
            product_id: readNumber(args, "product_id"),
            limit_price: readString(args, "limit_price"),
            size: readNumber(args, "size"),
          }),
          privateRateLimit("spot_amend_order", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_open_orders",
      module: "spot",
      description: "Get current open spot orders, optionally filtered by product. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Filter by spot product ID" },
          page_size: { type: "number", description: "Results per page" },
          after: { type: "string", description: "Cursor for next page" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v2/orders",
          compactObject({
            product_id: readNumber(args, "product_id"),
            state: "open",
            page_size: readNumber(args, "page_size"),
            after: readString(args, "after"),
          }),
          privateRateLimit("spot_get_open_orders", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_order_history",
      module: "spot",
      description: "Get spot order history (filled, cancelled, closed). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Filter by spot product ID" },
          page_size: { type: "number" },
          after: { type: "string", description: "Cursor for next page" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v2/orders/history",
          compactObject({
            product_id: readNumber(args, "product_id"),
            page_size: readNumber(args, "page_size"),
            after: readString(args, "after"),
          }),
          privateRateLimit("spot_get_order_history", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_fills",
      module: "spot",
      description: "Get spot trade fills (individual executions). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Filter by spot product ID" },
          start_time: { type: "number", description: "Start time as Unix timestamp (seconds)" },
          end_time: { type: "number", description: "End time as Unix timestamp (seconds)" },
          page_size: { type: "number" },
          after: { type: "string", description: "Cursor for next page" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v2/fills",
          compactObject({
            product_id: readNumber(args, "product_id"),
            start_time: readNumber(args, "start_time"),
            end_time: readNumber(args, "end_time"),
            page_size: readNumber(args, "page_size"),
            after: readString(args, "after"),
          }),
          privateRateLimit("spot_get_fills", 20),
        );
        return normalize(response);
      },
    },
  ];
}
