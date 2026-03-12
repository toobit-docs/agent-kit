import type { ToolRunner } from "@toobit_agent/agent-toobitkit-core";
import type { CliParsed } from "../parser.js";
import { formatJson } from "../formatter.js";

export async function handleMarketCommand(cli: CliParsed, run: ToolRunner): Promise<void> {
  const f = cli.flags;
  let result;

  switch (cli.subcommand) {
    case "time":
      result = await run("market_get_server_time", {});
      break;
    case "info":
      result = await run("market_get_exchange_info", {});
      break;
    case "ticker":
      result = await run("market_get_ticker_price", { symbol: f.symbol });
      break;
    case "ticker-24hr":
      result = await run("market_get_ticker_24hr", { symbol: f.symbol });
      break;
    case "depth":
      result = await run("market_get_depth", { symbol: f.symbol, limit: f.limit ? Number(f.limit) : undefined });
      break;
    case "trades":
      result = await run("market_get_trades", { symbol: f.symbol, limit: f.limit ? Number(f.limit) : undefined });
      break;
    case "klines":
    case "candles":
      result = await run("market_get_klines", {
        symbol: f.symbol,
        interval: f.interval ?? f.bar ?? "1h",
        limit: f.limit ? Number(f.limit) : undefined,
        startTime: f.startTime ? Number(f.startTime) : undefined,
        endTime: f.endTime ? Number(f.endTime) : undefined,
      });
      break;
    case "book-ticker":
      result = await run("market_get_book_ticker", { symbol: f.symbol });
      break;
    case "mark-price":
      result = await run("market_get_mark_price", { symbol: f.symbol });
      break;
    case "funding-rate":
      result = await run("market_get_funding_rate", { symbol: f.symbol });
      break;
    case "funding-rate-history":
      result = await run("market_get_funding_rate_history", {
        symbol: f.symbol,
        limit: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "open-interest":
      result = await run("market_get_open_interest", { symbol: f.symbol });
      break;
    case "index":
      result = await run("market_get_index_price", { symbol: f.symbol });
      break;
    case "contract-ticker":
      result = await run("market_get_contract_ticker_24hr", { symbol: f.symbol });
      break;
    case "long-short-ratio":
      result = await run("market_get_long_short_ratio", { symbol: f.symbol, period: f.period ?? "1h" });
      break;
    default:
      process.stdout.write(`Unknown market subcommand: ${cli.subcommand}\nAvailable: time, info, ticker, ticker-24hr, depth, trades, klines, candles, book-ticker, mark-price, funding-rate, funding-rate-history, open-interest, index, contract-ticker, long-short-ratio\n`);
      return;
  }

  process.stdout.write(formatJson(result, cli.json) + "\n");
}
