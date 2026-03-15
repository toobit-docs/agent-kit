import { parseArgs } from "node:util";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  loadConfig,
  toToolErrorPayload,
  TradeLogger,
  runSetup,
  printSetupUsage,
  SUPPORTED_CLIENTS,
  configFilePath,
  ConfigWatcher,
} from "@toobit_agent/agent-toobitkit-core";
import type { LogLevel, ClientId } from "@toobit_agent/agent-toobitkit-core";
import { SERVER_NAME, SERVER_VERSION } from "./constants.js";
import { createServer } from "./server.js";

function printHelp(): void {
  const help = `
Usage: toobit-trade-mcp [options]

Options:
  --modules <list>     Comma-separated list of modules to load
                       Available: market, spot, futures, account
                       Special: "all" loads all modules
                       Default: spot,futures,account

  --profile <name>     Profile to load from ${configFilePath()}
                       Falls back to default_profile in config, then "default"
  --read-only          Expose only read/query tools and disable write operations
  --no-log             Disable audit logging (default: logging enabled)
  --log-level <level>  Minimum log level: error, warn, info, debug (default: info)
  --help               Show this help message
  --version            Show version

Credentials (priority: env vars > ${configFilePath()} > none):
  TOOBIT_API_KEY       Toobit API key
  TOOBIT_SECRET_KEY    Toobit secret key

Other Environment Variables:
  TOOBIT_API_BASE_URL  Optional API base URL override
  TOOBIT_TIMEOUT_MS    Optional request timeout in milliseconds (default: 15000)
`;
  process.stdout.write(help);
}

function parseCli(): {
  modules?: string;
  profile?: string;
  readOnly: boolean;
  noLog: boolean;
  logLevel: string;
  help: boolean;
  version: boolean;
} {
  const parsed = parseArgs({
    options: {
      modules: { type: "string" },
      profile: { type: "string" },
      "read-only": { type: "boolean", default: false },
      "no-log": { type: "boolean", default: false },
      "log-level": { type: "string", default: "info" },
      help: { type: "boolean", default: false },
      version: { type: "boolean", default: false },
    },
    allowPositionals: false,
  });

  return {
    modules: parsed.values.modules,
    profile: parsed.values.profile,
    readOnly: parsed.values["read-only"] ?? false,
    noLog: parsed.values["no-log"] ?? false,
    logLevel: parsed.values["log-level"] ?? "info",
    help: parsed.values.help ?? false,
    version: parsed.values.version ?? false,
  };
}

function handleSetup(): void {
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      client: { type: "string" },
      profile: { type: "string" },
      modules: { type: "string" },
    },
    allowPositionals: false,
  });

  if (!values.client) {
    printSetupUsage();
    return;
  }

  if (!SUPPORTED_CLIENTS.includes(values.client as ClientId)) {
    process.stderr.write(`Unknown client: "${values.client}"\nSupported: ${SUPPORTED_CLIENTS.join(", ")}\n`);
    process.exitCode = 1;
    return;
  }

  runSetup({
    client: values.client as ClientId,
    profile: values.profile,
    modules: values.modules,
  });
}

export async function main(): Promise<void> {
  if (process.argv[2] === "setup") {
    handleSetup();
    return;
  }

  const cli = parseCli();

  if (cli.help) {
    printHelp();
    return;
  }

  if (cli.version) {
    process.stdout.write(`${SERVER_VERSION}\n`);
    return;
  }

  const cliOptions = {
    modules: cli.modules,
    profile: cli.profile,
    readOnly: cli.readOnly,
    userAgent: `${SERVER_NAME}/${SERVER_VERSION}`,
    sourceTag: "MCP",
  };

  const config = loadConfig(cliOptions);
  const watcher = new ConfigWatcher(config, cliOptions);

  const logger = cli.noLog ? undefined : new TradeLogger(cli.logLevel as LogLevel);
  const server = createServer(config, logger, watcher);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const payload = toToolErrorPayload(error);
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = 1;
});
