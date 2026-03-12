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
      description: "Place a USDT-M futures order. [CAUTION] Executes real trades. Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          side: { type: "string", enum: ["BUY_OPEN", "SELL_OPEN", "BUY_CLOSE", "SELL_CLOSE"] },
          orderType: { type: "string", enum: ["LIMIT", "MARKET"], description: "Order type" },
          quantity: { type: "string", description: "Order quantity (contracts)" },
          price: { type: "string", description: "Required for LIMIT" },
          leverage: { type: "string", description: "Leverage, e.g. 10" },
          clientOrderId: { type: "string" },
          priceType: { type: "string", enum: ["INPUT", "OPPONENT", "QUEUE", "OVER", "MARKET"], description: "Price type for trigger orders" },
          triggerPrice: { type: "string", description: "Trigger price for conditional orders" },
          timeInForce: { type: "string", enum: ["GTC", "IOC", "FOK", "LIMIT_MAKER"] },
        },
        required: ["symbol", "side", "orderType", "quantity"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/futures/order",
          compactObject({
            symbol: requireString(args, "symbol"),
            side: requireString(args, "side"),
            orderType: requireString(args, "orderType"),
            quantity: requireString(args, "quantity"),
            price: readString(args, "price"),
            leverage: readString(args, "leverage"),
            clientOrderId: readString(args, "clientOrderId"),
            priceType: readString(args, "priceType"),
            triggerPrice: readString(args, "triggerPrice"),
            timeInForce: readString(args, "timeInForce"),
          }),
          privateRateLimit("futures_place_order", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_batch_orders",
      module: "futures",
      description: "[CAUTION] Batch place futures orders. Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description: "Array of order objects",
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
          "/api/v1/futures/batchOrders",
          orders as Record<string, unknown>[],
          privateRateLimit("futures_batch_orders", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_cancel_order",
      module: "futures",
      description: "Cancel a futures order. Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          clientOrderId: { type: "string" },
          orderType: { type: "string", description: "LIMIT or condition type" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateDelete(
          "/api/v1/futures/order",
          compactObject({
            orderId: readString(args, "orderId"),
            clientOrderId: readString(args, "clientOrderId"),
            orderType: readString(args, "orderType"),
          }),
          privateRateLimit("futures_cancel_order", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_cancel_all_orders",
      module: "futures",
      description: "Cancel all futures open orders for a symbol. [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
        },
        required: ["symbol"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateDelete(
          "/api/v1/futures/batchOrders",
          { symbol: requireString(args, "symbol") },
          privateRateLimit("futures_cancel_all_orders", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_cancel_order_by_ids",
      module: "futures",
      description: "Batch cancel futures orders by IDs. Private endpoint. Rate limit: 20 req/s.",
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
          "/api/v1/futures/cancelOrderByIds",
          { orderIds: requireString(args, "orderIds") },
          privateRateLimit("futures_cancel_order_by_ids", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_amend_order",
      module: "futures",
      description: "Modify a futures order (price/quantity). Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          quantity: { type: "string" },
          price: { type: "string" },
        },
        required: ["orderId"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/futures/order/update",
          compactObject({
            orderId: requireString(args, "orderId"),
            quantity: readString(args, "quantity"),
            price: readString(args, "price"),
          }),
          privateRateLimit("futures_amend_order", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_order",
      module: "futures",
      description: "Get details of a single futures order. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          clientOrderId: { type: "string" },
          orderType: { type: "string" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/futures/order",
          compactObject({
            orderId: readString(args, "orderId"),
            clientOrderId: readString(args, "clientOrderId"),
            orderType: readString(args, "orderType"),
          }),
          privateRateLimit("futures_get_order", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_open_orders",
      module: "futures",
      description: "Get current open futures orders. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          orderId: { type: "string" },
          orderType: { type: "string" },
          limit: { type: "number" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/futures/openOrders",
          compactObject({
            symbol: readString(args, "symbol"),
            orderId: readString(args, "orderId"),
            orderType: readString(args, "orderType"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("futures_get_open_orders", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_history_orders",
      module: "futures",
      description: "Get futures order history. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          orderId: { type: "string" },
          orderType: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          limit: { type: "number" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/futures/historyOrders",
          compactObject({
            symbol: readString(args, "symbol"),
            orderId: readString(args, "orderId"),
            orderType: readString(args, "orderType"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("futures_get_history_orders", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_positions",
      module: "futures",
      description: "Get current futures positions. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Omit for all positions" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/futures/positions",
          compactObject({ symbol: readString(args, "symbol") }),
          privateRateLimit("futures_get_positions", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_history_positions",
      module: "futures",
      description: "Get futures closed position history. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          limit: { type: "number" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/futures/historyPositions",
          compactObject({
            symbol: readString(args, "symbol"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("futures_get_history_positions", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_set_leverage",
      module: "futures",
      description: "Set leverage for a futures symbol. [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          leverage: { type: "number", description: "Leverage value, e.g. 10" },
        },
        required: ["symbol", "leverage"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/futures/leverage",
          compactObject({
            symbol: requireString(args, "symbol"),
            leverage: readNumber(args, "leverage"),
          }),
          privateRateLimit("futures_set_leverage", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_leverage",
      module: "futures",
      description: "Get current leverage and position mode for a futures symbol. Private endpoint. Rate limit: 20 req/s.",
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
        const response = await context.client.privateGet(
          "/api/v1/futures/accountLeverage",
          { symbol: requireString(args, "symbol") },
          privateRateLimit("futures_get_leverage", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_set_margin_type",
      module: "futures",
      description: "Switch between cross and isolated margin mode. [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "e.g. BTCUSDT" },
          marginType: { type: "string", enum: ["1", "2"], description: "1=cross, 2=isolated" },
        },
        required: ["symbol", "marginType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/futures/marginType",
          compactObject({
            symbol: requireString(args, "symbol"),
            marginType: requireString(args, "marginType"),
          }),
          privateRateLimit("futures_set_margin_type", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_set_trading_stop",
      module: "futures",
      description: "Set take-profit/stop-loss for a futures position. [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          side: { type: "string", enum: ["LONG", "SHORT"] },
          stopLossPrice: { type: "string" },
          takeProfitPrice: { type: "string" },
        },
        required: ["symbol", "side"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/futures/position/trading-stop",
          compactObject({
            symbol: requireString(args, "symbol"),
            side: requireString(args, "side"),
            stopLossPrice: readString(args, "stopLossPrice"),
            takeProfitPrice: readString(args, "takeProfitPrice"),
          }),
          privateRateLimit("futures_set_trading_stop", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_flash_close",
      module: "futures",
      description: "Flash close a futures position (market close). [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          side: { type: "string", enum: ["LONG", "SHORT"] },
        },
        required: ["symbol", "side"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/futures/flashClose",
          compactObject({
            symbol: requireString(args, "symbol"),
            side: requireString(args, "side"),
          }),
          privateRateLimit("futures_flash_close", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_reverse_position",
      module: "futures",
      description: "Reverse a futures position (one-click reverse). [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          side: { type: "string", enum: ["LONG", "SHORT"], description: "Current position side to reverse" },
        },
        required: ["symbol", "side"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/futures/reversePosition",
          compactObject({
            symbol: requireString(args, "symbol"),
            side: requireString(args, "side"),
          }),
          privateRateLimit("futures_reverse_position", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_adjust_margin",
      module: "futures",
      description: "Adjust isolated margin for a position. [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          side: { type: "string", enum: ["LONG", "SHORT"] },
          amount: { type: "string", description: "Positive=add, negative=reduce" },
        },
        required: ["symbol", "side", "amount"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/futures/positionMargin",
          compactObject({
            symbol: requireString(args, "symbol"),
            side: requireString(args, "side"),
            amount: requireString(args, "amount"),
          }),
          privateRateLimit("futures_adjust_margin", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_fills",
      module: "futures",
      description: "Get futures trade history (fills). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          fromId: { type: "string" },
          limit: { type: "number" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/futures/userTrades",
          compactObject({
            symbol: readString(args, "symbol"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            fromId: readString(args, "fromId"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("futures_get_fills", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_balance",
      module: "futures",
      description: "Get futures account balance. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: { type: "object", properties: {} },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/api/v1/futures/balance",
          {},
          privateRateLimit("futures_get_balance", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_commission_rate",
      module: "futures",
      description: "Get futures commission rate for a symbol. Private endpoint. Rate limit: 20 req/s.",
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
        const response = await context.client.privateGet(
          "/api/v1/futures/commissionRate",
          { symbol: requireString(args, "symbol") },
          privateRateLimit("futures_get_commission_rate", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_today_pnl",
      module: "futures",
      description: "Get today's realized PnL for futures. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: { type: "object", properties: {} },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/api/v1/futures/todayPnl",
          {},
          privateRateLimit("futures_get_today_pnl", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_get_balance_flow",
      module: "futures",
      description: "Get futures balance flow (ledger). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          limit: { type: "number" },
          fromId: { type: "string" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/futures/balanceFlow",
          compactObject({
            symbol: readString(args, "symbol"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            limit: readNumber(args, "limit"),
            fromId: readString(args, "fromId"),
          }),
          privateRateLimit("futures_get_balance_flow", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "futures_auto_add_margin",
      module: "futures",
      description: "Enable/disable auto add margin for isolated positions. [CAUTION] Private endpoint. Rate limit: 10 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          side: { type: "string", enum: ["LONG", "SHORT"] },
          autoAddMargin: { type: "string", enum: ["true", "false"] },
        },
        required: ["symbol", "side", "autoAddMargin"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/futures/autoAddMargin",
          compactObject({
            symbol: requireString(args, "symbol"),
            side: requireString(args, "side"),
            autoAddMargin: requireString(args, "autoAddMargin"),
          }),
          privateRateLimit("futures_auto_add_margin", 10),
        );
        return normalize(response);
      },
    },
  ];
}
