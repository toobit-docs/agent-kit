import type { ToolRunner } from "@delta_agent/agent-deltakit-core";
import type { CliParsed } from "../parser.js";
import { formatJson } from "../formatter.js";

export async function handleMarketCommand(cli: CliParsed, run: ToolRunner): Promise<void> {
  const f = cli.flags;
  let result;

  switch (cli.subcommand) {
    case "products":
      result = await run("market_get_products", {
        contract_types: f.contractTypes as string | undefined,
        underlying_asset_symbols: f.underlyingAssets as string | undefined,
        state: f.state as string | undefined,
        page_size: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "assets":
      result = await run("market_get_assets", {});
      break;
    case "tickers":
      result = await run("market_get_tickers", {
        contract_types: f.contractTypes as string | undefined,
        underlying_asset_symbols: f.underlyingAssets as string | undefined,
      });
      break;
    case "ticker":
      result = await run("market_get_ticker", { symbol: f.symbol });
      break;
    case "orderbook":
    case "depth":
      result = await run("market_get_orderbook", {
        symbol: f.symbol,
        depth: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "trades":
      result = await run("market_get_trades", {
        symbol: f.symbol,
        limit: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "candles":
    case "klines":
      result = await run("market_get_candles", {
        symbol: f.symbol,
        resolution: (f.resolution ?? f.interval ?? f.bar ?? "1h") as string,
        start: f.startTime ? Number(f.startTime) : undefined,
        end: f.endTime ? Number(f.endTime) : undefined,
      });
      break;
    case "indices":
      result = await run("market_get_indices", {
        underlying_asset_symbols: f.underlyingAssets as string | undefined,
      });
      break;
    case "settlement":
    case "settlement-prices":
      result = await run("market_get_settlement_prices", {
        contract_types: f.contractTypes as string | undefined,
        page_size: f.limit ? Number(f.limit) : undefined,
      });
      break;
    default:
      process.stdout.write(
        `Unknown market subcommand: ${cli.subcommand}\nAvailable: products, assets, tickers, ticker, orderbook, depth, trades, candles, indices, settlement\n`,
      );
      return;
  }

  process.stdout.write(formatJson(result, cli.json) + "\n");
}
