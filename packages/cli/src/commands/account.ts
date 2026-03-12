import type { ToolRunner } from "@toobit_agent/agent-toobitkit-core";
import type { CliParsed } from "../parser.js";
import { formatJson } from "../formatter.js";

export async function handleAccountCommand(cli: CliParsed, run: ToolRunner): Promise<void> {
  const f = cli.flags;
  let result;

  switch (cli.subcommand) {
    case "balance":
    case "info":
    case "":
      result = await run("account_get_info", {});
      break;
    case "balance-flow":
      result = await run("account_get_balance_flow", {
        tokenId: f.tokenId,
        limit: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "sub-accounts":
      result = await run("account_get_sub_accounts", {});
      break;
    case "check-api-key":
      result = await run("account_check_api_key", {});
      break;
    case "deposit-address":
      result = await run("account_get_deposit_address", { tokenId: f.tokenId });
      break;
    case "deposits":
      result = await run("account_get_deposit_orders", {
        tokenId: f.tokenId,
        limit: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "withdrawals":
      result = await run("account_get_withdraw_orders", {
        tokenId: f.tokenId,
        limit: f.limit ? Number(f.limit) : undefined,
      });
      break;
    case "audit":
      result = await run("trade_get_history", { limit: f.limit ? Number(f.limit) : undefined });
      break;
    default:
      process.stdout.write(`Unknown account subcommand: ${cli.subcommand}\nAvailable: balance, info, balance-flow, sub-accounts, check-api-key, deposit-address, deposits, withdrawals, audit\n`);
      return;
  }

  process.stdout.write(formatJson(result, cli.json) + "\n");
}
