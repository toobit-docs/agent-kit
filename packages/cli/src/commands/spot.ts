import type { ToolRunner } from "@toobit_agent/agent-toobitkit-core";
import type { CliParsed } from "../parser.js";
import { formatJson } from "../formatter.js";

export async function handleSpotCommand(cli: CliParsed, run: ToolRunner): Promise<void> {
  const f = cli.flags;
  let result;

  switch (cli.subcommand) {
    case "place":
      result = await run("spot_place_order", {
        symbol: f.symbol,
        side: f.side,
        type: f.type ?? "MARKET",
        quantity: f.quantity,
        price: f.price,
      });
      break;
    case "cancel":
      result = await run("spot_cancel_order", { orderId: f.orderId, clientOrderId: f.clientOrderId });
      break;
    case "cancel-all":
      result = await run("spot_cancel_open_orders", { symbol: f.symbol });
      break;
    case "get":
      result = await run("spot_get_order", { orderId: f.orderId, clientOrderId: f.clientOrderId });
      break;
    case "open-orders":
    case "orders":
      result = await run("spot_get_open_orders", { symbol: f.symbol, limit: f.limit ? Number(f.limit) : undefined });
      break;
    case "history":
      result = await run("spot_get_trade_orders", {
        symbol: f.symbol,
        limit: f.limit ? Number(f.limit) : undefined,
        startTime: f.startTime ? Number(f.startTime) : undefined,
        endTime: f.endTime ? Number(f.endTime) : undefined,
      });
      break;
    case "fills":
      result = await run("spot_get_fills", {
        symbol: f.symbol,
        limit: f.limit ? Number(f.limit) : undefined,
      });
      break;
    default:
      process.stdout.write(`Unknown spot subcommand: ${cli.subcommand}\nAvailable: place, cancel, cancel-all, get, orders, open-orders, history, fills\n`);
      return;
  }

  process.stdout.write(formatJson(result, cli.json) + "\n");
}
