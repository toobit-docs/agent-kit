import {
  loadConfig,
  DeltaRestClient,
  createToolRunner,
  toToolErrorPayload,
  configFilePath,
} from "@delta_agent/agent-deltakit-core";
import { parseCli } from "./parser.js";
import { handleMarketCommand } from "./commands/market.js";
import { handleSpotCommand } from "./commands/spot.js";
import { handleFuturesCommand } from "./commands/futures.js";
import { handleAccountCommand } from "./commands/account.js";
import { handleConfigCommand } from "./commands/config.js";

function printHelp(): void {
  const help = `
Delta Exchange Trade CLI — Trade from your terminal

Usage: delta <command> <subcommand> [options]

Commands:
  market       Market data (products, tickers, orderbook, candles, etc.)
  spot         Spot trading (place, cancel, amend, orders, fills)
  futures      Futures trading (place, cancel, positions, leverage, etc.)
  account      Account info (balance, transactions, transfer, rate-limit)
  config       Configuration management (init, show, list)

Global Options:
  --profile <name>   Profile from ${configFilePath()}
  --json             Output raw JSON
  --read-only        Disable write operations
  --help             Show this help

Examples:
  delta market ticker --symbol BTCUSDT_PERP
  delta market candles --symbol BTCUSDT_PERP --resolution 1h --limit 10
  delta spot place --product-symbol BTCUSDT_SP --side buy --order-type market_order --size 0.001
  delta futures positions
  delta futures leverage --product-id 84 --leverage 10
  delta account balance
  delta config init
`;
  process.stdout.write(help);
}

async function main(): Promise<void> {
  const cli = parseCli();

  if (cli.command === "help" || cli.flags.help) {
    printHelp();
    return;
  }

  if (cli.command === "config") {
    await handleConfigCommand(cli);
    return;
  }

  const config = loadConfig({
    modules: "all",
    profile: cli.profile,
    readOnly: cli.readOnly,
    userAgent: "delta-trade-cli/1.0.0",
    sourceTag: "CLI",
  });

  const client = new DeltaRestClient(config);
  const run = createToolRunner(client, config);

  switch (cli.command) {
    case "market":
      await handleMarketCommand(cli, run);
      break;
    case "spot":
      await handleSpotCommand(cli, run);
      break;
    case "futures":
      await handleFuturesCommand(cli, run);
      break;
    case "account":
      await handleAccountCommand(cli, run);
      break;
    default:
      process.stdout.write(`Unknown command: ${cli.command}\n`);
      printHelp();
  }
}

main().catch((error: unknown) => {
  const payload = toToolErrorPayload(error);
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = 1;
});
