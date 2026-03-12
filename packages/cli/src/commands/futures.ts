import type { ToolRunner } from "@agent-toobitkit/core";
import type { CliParsed } from "../parser.js";
import { formatJson } from "../formatter.js";

export async function handleFuturesCommand(cli: CliParsed, run: ToolRunner): Promise<void> {
  const f = cli.flags;
  let result;

  switch (cli.subcommand) {
    case "place":
      result = await run("futures_place_order", {
        symbol: f.symbol,
        side: f.side,
        orderType: f.orderType ?? f.type ?? "MARKET",
        quantity: f.quantity,
        price: f.price,
        leverage: f.leverage,
      });
      break;
    case "cancel":
      result = await run("futures_cancel_order", { orderId: f.orderId, clientOrderId: f.clientOrderId });
      break;
    case "cancel-all":
      result = await run("futures_cancel_all_orders", { symbol: f.symbol });
      break;
    case "amend":
      result = await run("futures_amend_order", { orderId: f.orderId, quantity: f.quantity, price: f.price });
      break;
    case "get":
      result = await run("futures_get_order", { orderId: f.orderId, clientOrderId: f.clientOrderId });
      break;
    case "orders":
    case "open-orders":
      result = await run("futures_get_open_orders", { symbol: f.symbol });
      break;
    case "history":
      result = await run("futures_get_history_orders", {
        symbol: f.symbol,
        limit: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "positions":
      result = await run("futures_get_positions", { symbol: f.symbol });
      break;
    case "history-positions":
      result = await run("futures_get_history_positions", { symbol: f.symbol });
      break;
    case "leverage":
      if (f.leverage) {
        result = await run("futures_set_leverage", { symbol: f.symbol, leverage: Number(f.leverage) });
      } else {
        result = await run("futures_get_leverage", { symbol: f.symbol });
      }
      break;
    case "margin-type":
      result = await run("futures_set_margin_type", { symbol: f.symbol, marginType: f.marginType });
      break;
    case "flash-close":
      result = await run("futures_flash_close", { symbol: f.symbol, side: f.side });
      break;
    case "balance":
      result = await run("futures_get_balance", {});
      break;
    case "fills":
      result = await run("futures_get_fills", { symbol: f.symbol, limit: f.limit ? Number(f.limit) : undefined });
      break;
    case "pnl":
      result = await run("futures_get_today_pnl", {});
      break;
    case "commission":
      result = await run("futures_get_commission_rate", { symbol: f.symbol });
      break;
    default:
      process.stdout.write(`Unknown futures subcommand: ${cli.subcommand}\nAvailable: place, cancel, cancel-all, amend, get, orders, history, positions, history-positions, leverage, margin-type, flash-close, balance, fills, pnl, commission\n`);
      return;
  }

  process.stdout.write(formatJson(result, cli.json) + "\n");
}
