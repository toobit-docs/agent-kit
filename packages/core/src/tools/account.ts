import type { ToolSpec } from "./types.js";
import { asRecord, compactObject, readNumber, readString, requireString } from "./helpers.js";
import { privateRateLimit } from "./common.js";

function normalize(response: { endpoint: string; requestTime: string; data: unknown }): Record<string, unknown> {
  return { endpoint: response.endpoint, requestTime: response.requestTime, data: response.data };
}

export function registerAccountTools(): ToolSpec[] {
  return [
    {
      name: "account_get_info",
      module: "account",
      description: "Get Delta Exchange account information and profile. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: { type: "object", properties: {} },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/v2/profile",
          {},
          privateRateLimit("account_get_info", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "account_get_wallet_balances",
      module: "account",
      description: "Get wallet balances for all assets. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          asset_id: { type: "number", description: "Filter by asset ID (optional)" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v2/wallet/balances",
          compactObject({ asset_id: readNumber(args, "asset_id") }),
          privateRateLimit("account_get_wallet_balances", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "account_get_transactions",
      module: "account",
      description: "Get wallet transaction history (deposits, withdrawals, PnL, funding, etc.). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          asset_id: { type: "number", description: "Filter by asset ID" },
          transaction_type: { type: "string", description: "Filter by type, e.g. deposit, withdrawal, pnl, fee, funding" },
          start_time: { type: "number", description: "Start time as Unix timestamp (seconds)" },
          end_time: { type: "number", description: "End time as Unix timestamp (seconds)" },
          page_size: { type: "number" },
          after: { type: "string", description: "Cursor for next page" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v2/wallet/transactions",
          compactObject({
            asset_id: readNumber(args, "asset_id"),
            transaction_type: readString(args, "transaction_type"),
            start_time: readNumber(args, "start_time"),
            end_time: readNumber(args, "end_time"),
            page_size: readNumber(args, "page_size"),
            after: readString(args, "after"),
          }),
          privateRateLimit("account_get_transactions", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "account_transfer",
      module: "account",
      description: "Transfer funds between subaccounts. [CAUTION] Private endpoint. Rate limit: 5 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          asset: { type: "string", description: "Asset symbol, e.g. USDT" },
          amount: { type: "string", description: "Transfer amount" },
          transferrer_user_id: { type: "number", description: "From user ID" },
          transferee_user_id: { type: "number", description: "To user ID" },
        },
        required: ["asset", "amount", "transferrer_user_id", "transferee_user_id"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/v2/wallet/transfer",
          compactObject({
            asset: requireString(args, "asset"),
            amount: requireString(args, "amount"),
            transferrer_user_id: readNumber(args, "transferrer_user_id"),
            transferee_user_id: readNumber(args, "transferee_user_id"),
          }),
          privateRateLimit("account_transfer", 5),
        );
        return normalize(response);
      },
    },
    {
      name: "account_get_rate_limit",
      module: "account",
      description: "Get current API rate limit quota usage. Private endpoint. Rate limit: 10 req/s.",
      isWrite: false,
      inputSchema: { type: "object", properties: {} },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/v2/rate-limit-quota",
          {},
          privateRateLimit("account_get_rate_limit", 10),
        );
        return normalize(response);
      },
    },
  ];
}
