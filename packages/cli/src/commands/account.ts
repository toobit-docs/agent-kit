import type { ToolRunner } from "@delta_agent/agent-deltakit-core";
import type { CliParsed } from "../parser.js";
import { formatJson } from "../formatter.js";

export async function handleAccountCommand(cli: CliParsed, run: ToolRunner): Promise<void> {
  const f = cli.flags;
  let result;

  switch (cli.subcommand) {
    case "info":
    case "":
      result = await run("account_get_info", {});
      break;
    case "balance":
    case "balances":
      result = await run("account_get_wallet_balances", {
        asset_id: f.assetId ? Number(f.assetId) : undefined,
      });
      break;
    case "transactions":
      result = await run("account_get_transactions", {
        asset_id: f.assetId ? Number(f.assetId) : undefined,
        transaction_type: f.transactionType as string | undefined,
        page_size: f.limit ? Number(f.limit) : undefined,
        start_time: f.startTime ? Number(f.startTime) : undefined,
        end_time: f.endTime ? Number(f.endTime) : undefined,
      });
      break;
    case "transfer":
      result = await run("account_transfer", {
        asset_symbol: f.asset as string | undefined,
        amount: f.amount as string | undefined,
        subaccount_user_id: f.subaccountUserId ? Number(f.subaccountUserId) : undefined,
        transfer_type: f.transferType as string | undefined,
      });
      break;
    case "rate-limit":
      result = await run("account_get_rate_limit", {});
      break;
    case "audit":
      result = await run("trade_get_history", { limit: f.limit ? Number(f.limit) : undefined });
      break;
    default:
      process.stdout.write(
        `Unknown account subcommand: ${cli.subcommand}\nAvailable: info, balance, transactions, transfer, rate-limit, audit\n`,
      );
      return;
  }

  process.stdout.write(formatJson(result, cli.json) + "\n");
}
