import { parseArgs } from "node:util";

export interface CliParsed {
  command: string;
  subcommand: string;
  profile?: string;
  json: boolean;
  readOnly: boolean;
  flags: Record<string, string | boolean | undefined>;
  positionals: string[];
}

export function parseCli(argv = process.argv.slice(2)): CliParsed {
  const STRING_OPTIONS = new Set([
    "profile", "symbol", "interval", "limit", "side", "type",
    "quantity", "price", "orderId", "clientOrderId", "leverage",
    "orderType", "tokenId", "instId", "period", "bar",
    "startTime", "endTime", "marginType",
    // Delta Exchange specific
    "productId", "productSymbol", "size", "limitPrice", "orderType",
    "resolution", "id", "timeInForce", "contractTypes", "underlyingAssets",
    "state", "deltaMargin", "assetId", "transactionType", "amount",
    "subaccountUserId", "transferType", "asset",
  ]);

  let command = "help";
  let subcommand = "";
  const flagArgs: string[] = [];
  let positionalCount = 0;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("-")) {
      flagArgs.push(arg);
      const optName = arg.replace(/^--?/, "");
      if (STRING_OPTIONS.has(optName) && i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
        flagArgs.push(argv[++i]);
      }
    } else {
      if (positionalCount === 0) command = arg;
      else if (positionalCount === 1) subcommand = arg;
      positionalCount++;
    }
  }

  const parsed = parseArgs({
    args: flagArgs,
    options: {
      profile: { type: "string" },
      json: { type: "boolean", default: false },
      "read-only": { type: "boolean", default: false },
      symbol: { type: "string" },
      interval: { type: "string" },
      limit: { type: "string" },
      side: { type: "string" },
      type: { type: "string" },
      quantity: { type: "string" },
      price: { type: "string" },
      orderId: { type: "string" },
      clientOrderId: { type: "string" },
      leverage: { type: "string" },
      orderType: { type: "string" },
      tokenId: { type: "string" },
      instId: { type: "string" },
      period: { type: "string" },
      bar: { type: "string" },
      startTime: { type: "string" },
      endTime: { type: "string" },
      marginType: { type: "string" },
      // Delta Exchange specific
      productId: { type: "string" },
      productSymbol: { type: "string" },
      size: { type: "string" },
      limitPrice: { type: "string" },
      resolution: { type: "string" },
      id: { type: "string" },
      timeInForce: { type: "string" },
      contractTypes: { type: "string" },
      underlyingAssets: { type: "string" },
      state: { type: "string" },
      deltaMargin: { type: "string" },
      assetId: { type: "string" },
      transactionType: { type: "string" },
      amount: { type: "string" },
      subaccountUserId: { type: "string" },
      transferType: { type: "string" },
      asset: { type: "string" },
      reduceOnly: { type: "boolean", default: false },
    },
    strict: false,
    allowPositionals: true,
  });

  return {
    command,
    subcommand,
    profile: parsed.values.profile as string | undefined,
    json: (parsed.values.json as boolean) ?? false,
    readOnly: (parsed.values["read-only"] as boolean) ?? false,
    flags: parsed.values as Record<string, string | boolean | undefined>,
    positionals: parsed.positionals as string[],
  };
}
