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
      description: "Get spot account information (balances for all assets). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: { type: "object", properties: {} },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/api/v1/account",
          {},
          privateRateLimit("account_get_info", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "account_get_balance_flow",
      module: "account",
      description: "Get account balance flow (ledger). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          accountType: { type: "number", description: "1=coin, 2=contract" },
          tokenId: { type: "string" },
          fromFlowId: { type: "string" },
          endFlowId: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          limit: { type: "number" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/account/balanceFlow",
          compactObject({
            accountType: readNumber(args, "accountType"),
            tokenId: readString(args, "tokenId"),
            fromFlowId: readString(args, "fromFlowId"),
            endFlowId: readString(args, "endFlowId"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("account_get_balance_flow", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "account_get_sub_accounts",
      module: "account",
      description: "Get sub-account list. Private endpoint. Rate limit: 10 req/s.",
      isWrite: false,
      inputSchema: { type: "object", properties: {} },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/api/v1/account/subAccount",
          {},
          privateRateLimit("account_get_sub_accounts", 10),
        );
        return normalize(response);
      },
    },
    {
      name: "account_sub_transfer",
      module: "account",
      description: "Transfer funds between main and sub accounts. [CAUTION] Private endpoint. Rate limit: 5 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          fromUid: { type: "number", description: "From user ID" },
          toUid: { type: "number", description: "To user ID" },
          fromAccountType: { type: "string", enum: ["MAIN", "FUTURES", "COPY_TRADING"], description: "MAIN=spot, FUTURES=contract, COPY_TRADING=copy trading" },
          toAccountType: { type: "string", enum: ["MAIN", "FUTURES", "COPY_TRADING"], description: "MAIN=spot, FUTURES=contract, COPY_TRADING=copy trading" },
          asset: { type: "string", description: "Asset name, e.g. USDT" },
          quantity: { type: "string", description: "Transfer quantity" },
        },
        required: ["fromUid", "toUid", "fromAccountType", "toAccountType", "asset", "quantity"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/subAccount/transfer",
          compactObject({
            fromUid: readNumber(args, "fromUid"),
            toUid: readNumber(args, "toUid"),
            fromAccountType: requireString(args, "fromAccountType"),
            toAccountType: requireString(args, "toAccountType"),
            asset: requireString(args, "asset"),
            quantity: requireString(args, "quantity"),
          }),
          privateRateLimit("account_sub_transfer", 5),
        );
        return normalize(response);
      },
    },
    {
      name: "account_check_api_key",
      module: "account",
      description: "Check API key type and permissions. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: { type: "object", properties: {} },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/api/v1/account/checkApiKey",
          {},
          privateRateLimit("account_check_api_key", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "account_withdraw",
      module: "account",
      description: "Submit a withdrawal request. [CAUTION] Moves real funds. Private endpoint. Rate limit: 5 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          tokenId: { type: "string", description: "e.g. USDT" },
          address: { type: "string" },
          addressExt: { type: "string", description: "Memo/tag if required" },
          chainType: { type: "string" },
          withdrawQuantity: { type: "string" },
          clientOrderId: { type: "string" },
        },
        required: ["tokenId", "address", "chainType", "withdrawQuantity"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v1/account/withdraw",
          compactObject({
            tokenId: requireString(args, "tokenId"),
            address: requireString(args, "address"),
            addressExt: readString(args, "addressExt"),
            chainType: requireString(args, "chainType"),
            withdrawQuantity: requireString(args, "withdrawQuantity"),
            clientOrderId: readString(args, "clientOrderId"),
          }),
          privateRateLimit("account_withdraw", 5),
        );
        return normalize(response);
      },
    },
    {
      name: "account_get_withdraw_orders",
      module: "account",
      description: "Get withdrawal records. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          tokenId: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          fromId: { type: "string" },
          limit: { type: "number" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/account/withdrawOrders",
          compactObject({
            tokenId: readString(args, "tokenId"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            fromId: readString(args, "fromId"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("account_get_withdraw_orders", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "account_get_deposit_address",
      module: "account",
      description: "Get deposit address for a token. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          coin: { type: "string", description: "Asset name, e.g. USDT" },
          chainType: { type: "string", description: "Chain type, e.g. ERC20, TRC20, OMNI" },
        },
        required: ["coin", "chainType"],
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/account/deposit/address",
          compactObject({
            coin: requireString(args, "coin"),
            chainType: requireString(args, "chainType"),
          }),
          privateRateLimit("account_get_deposit_address", 20),
        );
        return normalize(response);
      },
    },
    {
      name: "account_get_deposit_orders",
      module: "account",
      description: "Get deposit records. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          tokenId: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          fromId: { type: "string" },
          limit: { type: "number" },
        },
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v1/account/depositOrders",
          compactObject({
            tokenId: readString(args, "tokenId"),
            startTime: readNumber(args, "startTime"),
            endTime: readNumber(args, "endTime"),
            fromId: readString(args, "fromId"),
            limit: readNumber(args, "limit"),
          }),
          privateRateLimit("account_get_deposit_orders", 20),
        );
        return normalize(response);
      },
    },
  ];
}
