import type { ToolRunner } from "@delta_agent/agent-deltakit-core";
import type { CliParsed } from "../parser.js";
import { formatJson } from "../formatter.js";

export async function handleFuturesCommand(cli: CliParsed, run: ToolRunner): Promise<void> {
  const f = cli.flags;
  let result;

  switch (cli.subcommand) {
    case "place":
      result = await run("futures_place_order", {
        product_id: f.productId ? Number(f.productId) : undefined,
        product_symbol: f.productSymbol ?? f.symbol,
        side: f.side,
        order_type: f.orderType ?? f.type ?? "market_order",
        size: f.size ? Number(f.size) : (f.quantity ? Number(f.quantity) : undefined),
        limit_price: f.limitPrice ?? f.price,
        reduce_only: f.reduceOnly === "true" || f.reduceOnly === true,
        client_order_id: f.clientOrderId,
      });
      break;
    case "cancel":
      result = await run("futures_cancel_order", {
        id: f.id ? Number(f.id) : (f.orderId ? Number(f.orderId) : undefined),
        product_id: f.productId ? Number(f.productId) : undefined,
      });
      break;
    case "cancel-all":
      result = await run("futures_cancel_all_orders", {
        product_id: f.productId ? Number(f.productId) : undefined,
        product_symbol: f.productSymbol ?? f.symbol,
      });
      break;
    case "amend":
      result = await run("futures_amend_order", {
        id: f.id ? Number(f.id) : (f.orderId ? Number(f.orderId) : undefined),
        product_id: f.productId ? Number(f.productId) : undefined,
        size: f.size ? Number(f.size) : (f.quantity ? Number(f.quantity) : undefined),
        limit_price: f.limitPrice ?? f.price,
      });
      break;
    case "orders":
    case "open-orders":
      result = await run("futures_get_open_orders", {
        product_id: f.productId ? Number(f.productId) : undefined,
        product_symbol: f.productSymbol ?? f.symbol,
      });
      break;
    case "history":
      result = await run("futures_get_order_history", {
        product_id: f.productId ? Number(f.productId) : undefined,
        product_symbol: f.productSymbol ?? f.symbol,
        page_size: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "positions":
      result = await run("futures_get_positions", {
        product_id: f.productId ? Number(f.productId) : undefined,
      });
      break;
    case "close":
    case "close-position":
      result = await run("futures_close_position", {
        product_id: f.productId ? Number(f.productId) : undefined,
        size: f.size ? Number(f.size) : undefined,
        order_type: f.orderType ?? "market_order",
      });
      break;
    case "adjust-margin":
      result = await run("futures_adjust_margin", {
        product_id: f.productId ? Number(f.productId) : undefined,
        delta_margin: f.deltaMargin as string | undefined,
      });
      break;
    case "leverage":
      if (f.leverage) {
        result = await run("futures_set_leverage", {
          product_id: f.productId ? Number(f.productId) : undefined,
          leverage: Number(f.leverage),
        });
      } else {
        result = await run("futures_get_leverage", {
          product_id: f.productId ? Number(f.productId) : undefined,
        });
      }
      break;
    case "fills":
      result = await run("futures_get_fills", {
        product_id: f.productId ? Number(f.productId) : undefined,
        product_symbol: f.productSymbol ?? f.symbol,
        page_size: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "balance":
      result = await run("futures_get_balance", {});
      break;
    case "audit":
      result = await run("trade_get_history", { limit: f.limit ? Number(f.limit) : undefined });
      break;
    default:
      process.stdout.write(
        `Unknown futures subcommand: ${cli.subcommand}\nAvailable: place, cancel, cancel-all, amend, orders, history, positions, close, adjust-margin, leverage, fills, balance, audit\n`,
      );
      return;
  }

  process.stdout.write(formatJson(result, cli.json) + "\n");
}
