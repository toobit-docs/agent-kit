import type { ToolRunner } from "@delta_agent/agent-deltakit-core";
import type { CliParsed } from "../parser.js";
import { formatJson } from "../formatter.js";

export async function handleSpotCommand(cli: CliParsed, run: ToolRunner): Promise<void> {
  const f = cli.flags;
  let result;

  switch (cli.subcommand) {
    case "place":
      result = await run("spot_place_order", {
        product_id: f.productId ? Number(f.productId) : undefined,
        product_symbol: f.productSymbol ?? f.symbol,
        side: f.side,
        order_type: f.orderType ?? f.type ?? "market_order",
        size: f.size ? Number(f.size) : (f.quantity ? Number(f.quantity) : undefined),
        limit_price: f.limitPrice ?? f.price,
        client_order_id: f.clientOrderId,
        time_in_force: f.timeInForce as string | undefined,
      });
      break;
    case "cancel":
      result = await run("spot_cancel_order", {
        id: f.id ? Number(f.id) : (f.orderId ? Number(f.orderId) : undefined),
        product_id: f.productId ? Number(f.productId) : undefined,
      });
      break;
    case "cancel-all":
      result = await run("spot_batch_cancel_orders", {
        product_id: f.productId ? Number(f.productId) : undefined,
      });
      break;
    case "amend":
      result = await run("spot_amend_order", {
        id: f.id ? Number(f.id) : (f.orderId ? Number(f.orderId) : undefined),
        product_id: f.productId ? Number(f.productId) : undefined,
        size: f.size ? Number(f.size) : (f.quantity ? Number(f.quantity) : undefined),
        limit_price: f.limitPrice ?? f.price,
      });
      break;
    case "orders":
    case "open-orders":
      result = await run("spot_get_open_orders", {
        product_id: f.productId ? Number(f.productId) : undefined,
        product_symbol: f.productSymbol ?? f.symbol,
        page_size: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "history":
      result = await run("spot_get_order_history", {
        product_id: f.productId ? Number(f.productId) : undefined,
        product_symbol: f.productSymbol ?? f.symbol,
        page_size: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "fills":
      result = await run("spot_get_fills", {
        product_id: f.productId ? Number(f.productId) : undefined,
        product_symbol: f.productSymbol ?? f.symbol,
        page_size: f.limit ? Number(f.limit) : undefined,
      });
      break;
    default:
      process.stdout.write(
        `Unknown spot subcommand: ${cli.subcommand}\nAvailable: place, cancel, cancel-all, amend, orders, open-orders, history, fills\n`,
      );
      return;
  }

  process.stdout.write(formatJson(result, cli.json) + "\n");
}
