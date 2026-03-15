import type { ToolSpec } from "./types.js";
import { asRecord, compactObject, readNumber, readString, requireString } from "./helpers.js";
import { privateRateLimit } from "./common.js";

function normalize(response: { endpoint: string; requestTime: string; data: unknown }): Record<string, unknown> {
  return { endpoint: response.endpoint, requestTime: response.requestTime, data: response.data };
}

export function registerSpotTradeTools(): ToolSpec[] {
  return [
    {
      name: "spot_place_order",
      module: "spot",
      description: "Place a spot order (LIMIT, MARKET, LIMIT_MAKER). [CAUTION] Executes real trades. Private endpoint. Rate limit: 50 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          side: { type: "string", enum: ["BUY", "SELL"] },
          type: { type: "string", enum: ["LIMIT", "MARKET", "LIMIT_MAKER"], description: "Order type" },
          quantity: { type: "string", description: "For LIMIT/LIMIT_MAKER: base asset quantity (e.g. 0.001 BTC). For MARKET SELL: base asset quantity to sell. For MARKET BUY: quote asset amount to spend (e.g. 50 means spend 50 USDT)." },
          price: { type: "string", description: "Order price (required for LIMIT)" },
          newClientOrderId: { type: "string", description: "Client order ID. Only [a-zA-Z0-9_\\-.]  allowed; other characters are stripped." },
          timeInForce: { type: "string", enum: ["GTC", "IOC", "FOK"], description: "Default GTC" },
        },
        required: ["symbol", "side", "type", "quantity"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/spot/order",
          compactObject({
            symbol: requireString(args, "symbol"),
            side: requireString(args, "side"),
            type: requireString(args, "type"),
            quantity: requireString(args, "quantity"),
            price: readString(args, "price"),
            newClientOrderId: readString(args, "newClientOrderId")?.replace(/[^a-zA-Z0-9_\-\.]/g, ""),
            timeInForce: readString(args, "timeInForce"),
          }),
          privateRateLimit("spot_place_order", 50),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_place_order_test",
      module: "spot",
      description: "Test spot order placement without actually submitting. Private endpoint. Rate limit: 50 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          side: { type: "string", enum: ["BUY", "SELL"] },
          type: { type: "string", enum: ["LIMIT", "MARKET", "LIMIT_MAKER"] },
          quantity: { type: "string" },
          price: { type: "string" },
        },
        required: ["symbol", "side", "type", "quantity"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/spot/orderTest",
          compactObject({
            symbol: requireString(args, "symbol"),
            side: requireString(args, "side"),
            type: requireString(args, "type"),
            quantity: requireString(args, "quantity"),
            price: readString(args, "price"),
          }),
          privateRateLimit("spot_place_order_test", 50),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_batch_orders",
      module: "spot",
      description: "[CAUTION] Batch place spot orders. Private endpoint. Rate limit: 50 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description: "Array of orders: [{symbol, side, type, quantity, price?, newClientOrderId?, timeInForce?}]",
            items: { type: "object" },
          },
        },
        required: ["orders"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orders = args.orders;
        if (!Array.isArray(orders) || orders.length === 0) throw new Error("orders must be a non-empty array.");
        const response = await context.client.privatePost(
          "/api/v1/spot/batchOrders",
          orders as Record<string, unknown>[],
          privateRateLimit("spot_batch_orders", 50),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_cancel_order",
      module: "spot",
      description: "Cancel a spot order by orderId or clientOrderId. Private endpoint. Rate limit: 50 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Order ID" },
          clientOrderId: { type: "string", description: "Client order ID" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateDelete(
          "/api/v1/spot/order",
          compactObject({
            orderId: readString(args, "orderId"),
            clientOrderId: readString(args, "clientOrderId"),
          }),
          privateRateLimit("spot_cancel_order", 50),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_cancel_open_orders",
      module: "spot",
      description: "Cancel all open spot orders for a symbol. [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT. Omit for all symbols." },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateDelete(
          "/api/v1/spot/openOrders",
          compactObject({ symbol: readString(args, "symbol") }),
          privateRateLimit("spot_cancel_open_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_cancel_order_by_ids",
      module: "spot",
      description: "Batch cancel spot orders by IDs. [CAUTION] Private endpoint. Rate limit: 50 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orderIds: { type: "string", description: "Comma-separated order IDs" },
        },
        required: ["orderIds"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateDelete(
          "/api/v1/spot/cancelOrderByIds",
          { orderIds: requireString(args, "orderIds") },
          privateRateLimit("spot_cancel_order_by_ids", 50),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_order",
      module: "spot",
      description: "Get details of a single spot order. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          clientOrderId: { type: "string" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/spot/order",
          compactObject({ orderId: readString(args, "orderId"), clientOrderId: readString(args, "clientOrderId") }),
          privateRateLimit("spot_get_order", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_open_orders",
      module: "spot",
      description: "Get current open spot orders. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          orderId: { type: "string", description: "Filter orders >= this ID" },
          limit: { type: "number", description: "Default 500, max 1000" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/spot/openOrders",
          compactObject({ symbol: readString(args, "symbol"), orderId: readString(args, "orderId"), limit: readNumber(args, "limit") }),
          privateRateLimit("spot_get_open_orders", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_trade_orders",
      module: "spot",
      description: "Get all spot orders (history). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          orderId: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          limit: { type: "number", description: "Default 500, max 1000" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/spot/tradeOrders",
          compactObject({
            symbol: readString(args, "symbol"),
            orderId: readString(args, "orderId"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("spot_get_trade_orders", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "spot_get_fills",
      module: "spot",
      description: "Get spot trade history (fills). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          fromId: { type: "string" },
          toId: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          limit: { type: "number", description: "Default 500, max 1000" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/account/trades",
          compactObject({
            symbol: readString(args, "symbol"),
            fromId: readString(args, "fromId"),
            toId: readString(args, "toId"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("spot_get_fills", 20),
        );
        return normalize(response);
      },
    },
  ];
}
