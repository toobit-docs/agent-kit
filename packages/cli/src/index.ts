import {
  loadConfig,
  ToobitRestClient,
  createToolRunner,
  toToolErrorPayload,
  configFilePath,
} from "@toobit_agent/agent-toobitkit-core";
import { parseCli } from "./parser.js";
import { handleMarketCommand } from "./commands/market.js";
import { handleSpotCommand } from "./commands/spot.js";
import { handleFuturesCommand } from "./commands/futures.js";
import { handleAccountCommand } from "./commands/account.js";
import { handleConfigCommand } from "./commands/config.js";

function printHelp(): void {
  const help = `
Toobit Trade CLI — Trade from your terminal

Usage: toobit <command> <subcommand> [options]

Commands:
  market       Market data (ticker, depth, klines, funding-rate, etc.)
  spot         Spot trading (place, cancel, orders, fills)
  futures      USDT-M futures (place, cancel, positions, leverage, etc.)
  account      Account info (balance, deposits, withdrawals, audit)
  config       Configuration management (init, show, list)

Global Options:
  --profile <name>   Profile from ${configFilePath()}
  --json             Output raw JSON
  --read-only        Disable write operations
  --help             Show this help

Examples:
  toobit market ticker --symbol BTCUSDT
  toobit market candles --symbol BTCUSDT --interval 1h --limit 10
  toobit market funding-rate --symbol BTCUSDT
  toobit spot place --symbol BTCUSDT --side BUY --type MARKET --quantity 0.001
  toobit futures positions --symbol BTCUSDT
  toobit account balance
  toobit config init
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
    userAgent: "toobit-trade-cli/1.0.0",
    sourceTag: "CLI",
  });

  const client = new ToobitRestClient(config);
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
