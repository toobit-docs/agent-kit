import type { ToolSpec } from "./types.js";
import { asRecord, compactObject, readNumber, readString, requireString } from "./helpers.js";
import { privateRateLimit } from "./common.js";

function normalize(response: { endpoint: string; requestTime: string; data: unknown }): Record<string, unknown> {
  return { endpoint: response.endpoint, requestTime: response.requestTime, data: response.data };
}

export function registerFuturesTools(): ToolSpec[] {
  return [
    {
      name: "futures_place_order",
      module: "futures",
      description: "Place a futures order (perpetual or dated) on Delta Exchange. Use product_id or product_symbol to specify the contract (e.g. BTCUSD for BTC perpetual). To open a long: side=buy, reduce_only=false. To close a long: side=sell, reduce_only=true. [CAUTION] Executes real trades. Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Product ID (use market_get_products to look up)" },
          product_symbol: { type: "string", description: "Product symbol, e.g. BTCUSD for BTC perpetual" },
          side: { type: "string", enum: ["buy", "sell"] },
          order_type: { type: "string", enum: ["limit_order", "market_order", "stop_order"], description: "Order type" },
          size: { type: "number", description: "Order quantity (number of contracts)" },
          limit_price: { type: "string", description: "Limit price (required for limit_order)" },
          reduce_only: { type: "boolean", description: "true=close/reduce position, false=open/increase position" },
          stop_price: { type: "string", description: "Trigger price for stop_order" },
          time_in_force: { type: "string", enum: ["gtc", "ioc", "fok"], description: "Time in force (default: gtc)" },
          client_order_id: { type: "string", description: "Optional client order ID" },
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
            reduce_only: args.reduce_only,
            stop_price: readString(args, "stop_price"),
            time_in_force: readString(args, "time_in_force"),
            client_order_id: readString(args, "client_order_id"),
          }),
          privateRateLimit("futures_place_order", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_place_bracket_order",
      module: "futures",
      description: "Place a bracket order (entry + stop-loss + take-profit in one request). [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Product ID" },
          product_symbol: { type: "string", description: "Product symbol, e.g. BTCUSD" },
          side: { type: "string", enum: ["buy", "sell"] },
          size: { type: "number", description: "Order quantity" },
          limit_price: { type: "string", description: "Entry limit price" },
          order_type: { type: "string", enum: ["limit_order", "market_order"] },
          stop_loss_order: {
            type: "object",
            description: "Stop-loss: {order_type, stop_price, limit_price?}",
          },
          take_profit_order: {
            type: "object",
            description: "Take-profit: {order_type, stop_price, limit_price?}",
          },
        },
        required: ["side", "size", "order_type"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/v2/orders/bracket",
          compactObject({
            product_id: readNumber(args, "product_id"),
            product_symbol: readString(args, "product_symbol"),
            side: requireString(args, "side"),
            size: readNumber(args, "size"),
            limit_price: readString(args, "limit_price"),
            order_type: requireString(args, "order_type"),
            stop_loss_order: args.stop_loss_order,
            take_profit_order: args.take_profit_order,
          }),
          privateRateLimit("futures_place_bracket_order", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_batch_orders",
      module: "futures",
      description: "[CAUTION] Batch place up to 50 futures orders in a single request. All orders must be for the same product. Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description: "Array of order objects (max 50). Each: {product_id or product_symbol, side, order_type, size, limit_price?, reduce_only?}",
            items: { type: "object" },
          },
        },
        required: ["orders"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orders = args.orders;
        if (!Array.isArray(orders) || orders.length === 0) throw new Error("orders must be a non-empty array.");
        if (orders.length > 50) throw new Error("Batch orders are limited to 50 per request.");
        const response = await context.client.privatePost(
          "/v2/orders/batch",
          orders as Record<string, unknown>[],
          privateRateLimit("futures_batch_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_cancel_order",
      module: "futures",
      description: "Cancel an open futures order by order ID. Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "number", description: "Order ID" },
          product_id: { type: "number", description: "Product ID of the futures contract" },
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
          privateRateLimit("futures_cancel_order", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_cancel_all_orders",
      module: "futures",
      description: "Cancel all open futures orders for a product. [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Futures product ID" },
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
          privateRateLimit("futures_cancel_all_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_batch_cancel_orders",
      module: "futures",
      description: "Batch cancel up to 50 futures orders by ID. Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description: "Array of cancel objects: [{id, product_id}]",
            items: { type: "object" },
          },
        },
        required: ["orders"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orders = args.orders;
        if (!Array.isArray(orders) || orders.length === 0) throw new Error("orders must be a non-empty array.");
        const response = await context.client.privateDelete(
          "/v2/orders/batch",
          orders as Record<string, unknown>[],
          privateRateLimit("futures_batch_cancel_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_amend_order",
      module: "futures",
      description: "Amend an open futures order (price or size). Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "number", description: "Order ID" },
          product_id: { type: "number", description: "Futures product ID" },
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
          privateRateLimit("futures_amend_order", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_open_orders",
      module: "futures",
      description: "Get current open futures orders, optionally filtered by product. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Filter by futures product ID" },
          page_size: { type: "number" },
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
          privateRateLimit("futures_get_open_orders", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_order_history",
      module: "futures",
      description: "Get futures order history (filled, cancelled, closed). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Filter by futures product ID" },
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
          privateRateLimit("futures_get_order_history", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_positions",
      module: "futures",
      description: "Get all open futures positions (margined). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Filter by product ID" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v2/positions/margined",
          compactObject({ product_id: readNumber(args, "product_id") }),
          privateRateLimit("futures_get_positions", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_close_position",
      module: "futures",
      description: "Close all open positions for a product (market close). [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Futures product ID" },
          size: { type: "number", description: "Quantity to close (omit to close full position)" },
        },
        required: ["product_id"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/v2/positions/close",
          compactObject({
            product_id: readNumber(args, "product_id"),
            size: readNumber(args, "size"),
          }),
          privateRateLimit("futures_close_position", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_adjust_margin",
      module: "futures",
      description: "Add or remove margin from an isolated futures position. [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Futures product ID" },
          delta_margin: { type: "string", description: "Margin to add (positive) or remove (negative), e.g. '100' or '-50'" },
        },
        required: ["product_id", "delta_margin"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/v2/positions/margin",
          compactObject({
            product_id: readNumber(args, "product_id"),
            delta_margin: requireString(args, "delta_margin"),
          }),
          privateRateLimit("futures_adjust_margin", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_set_leverage",
      module: "futures",
      description: "Set leverage for a futures product. [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Futures product ID (use market_get_products to look up)" },
          leverage: { type: "number", description: "Leverage multiplier, e.g. 10" },
        },
        required: ["product_id", "leverage"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productId = readNumber(args, "product_id");
        if (!productId) throw new Error("product_id is required.");
        const response = await context.client.privatePost(
          `/v2/products/${productId}/orders/leverage`,
          { leverage: readNumber(args, "leverage") },
          privateRateLimit("futures_set_leverage", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_leverage",
      module: "futures",
      description: "Get current leverage setting for a futures product. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Futures product ID" },
        },
        required: ["product_id"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const productId = readNumber(args, "product_id");
        if (!productId) throw new Error("product_id is required.");
        const response = await context.client.privateGet(
          `/v2/products/${productId}/orders/leverage`,
          {},
          privateRateLimit("futures_get_leverage", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_fills",
      module: "futures",
      description: "Get futures trade fills (individual executions). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          product_id: { type: "number", description: "Filter by futures product ID" },
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
          privateRateLimit("futures_get_fills", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_balance",
      module: "futures",
      description: "Get wallet balances for all assets. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: { type: "object", properties: {} },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/v2/wallet/balances",
          {},
          privateRateLimit("futures_get_balance", 20),
        );
        return normalize(response);
      },
    },
  ];
}
