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
      description: "Read local audit log entries from ~/.delta/logs/. Returns recent tool call records. No API call.",
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
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          throw new Error('Invalid date format. Must be YYYY-MM-DD (e.g. "2026-03-15").');
        }
        const limit = readNumber(args, "limit") ?? 50;
        const logDir = path.join(os.homedir(), ".delta", "logs");
        const logPath = path.join(logDir, `trade-${dateStr}.log`);
        if (!logPath.startsWith(logDir)) {
          throw new Error("Invalid date value.");
        }

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
