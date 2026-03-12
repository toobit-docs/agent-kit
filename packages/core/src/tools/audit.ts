import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { ToolSpec } from "./types.js";
import { asRecord, readNumber, readString } from "./helpers.js";

export function registerAuditTools(): ToolSpec[] {
  return [
    {
      name: "trade_get_history",
      module: "account",
      description: "Read local audit log entries from ~/.toobit/logs/. Returns recent tool call records. No API call.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date in YYYY-MM-DD format. Defaults to today." },
          limit: { type: "number", description: "Max entries to return (default 50)" },
        },
      },
      handler: async (rawArgs) => {
        const args = asRecord(rawArgs);
        const dateStr = readString(args, "date") ?? new Date().toISOString().slice(0, 10);
        const limit = readNumber(args, "limit") ?? 50;
        const logPath = path.join(os.homedir(), ".toobit", "logs", `trade-${dateStr}.log`);

        if (!fs.existsSync(logPath)) {
          return { endpoint: "local", requestTime: new Date().toISOString(), data: [] };
        }

        const lines = fs.readFileSync(logPath, "utf-8").trim().split("\n").filter(Boolean);
        const entries = lines.slice(-limit).map((line) => {
          try { return JSON.parse(line); } catch { return { raw: line }; }
        });

        return { endpoint: "local", requestTime: new Date().toISOString(), data: entries };
      },
    },
  ];
}
