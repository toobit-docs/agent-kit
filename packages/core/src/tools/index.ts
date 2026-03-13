import type { ToobitConfig } from "../config.js";
import type { ToobitRestClient } from "../client/rest-client.js";
import { MODULES, type ModuleId } from "../constants.js";
import { registerAccountTools } from "./account.js";
import { registerAuditTools } from "./audit.js";
import { registerFuturesTools } from "./futures-trade.js";
import { registerMarketTools } from "./market.js";
import { registerSpotTradeTools } from "./spot-trade.js";
import type { ToolSpec, ToolArgs } from "./types.js";

function allToolSpecs(): ToolSpec[] {
  return [
    ...registerMarketTools(),
    ...registerSpotTradeTools(),
    ...registerFuturesTools(),
    ...registerAccountTools(),
    ...registerAuditTools(),
  ];
}

export function buildTools(config: ToobitConfig): ToolSpec[] {
  const enabledModules = new Set(config.modules);
  const tools = allToolSpecs().filter((tool) => enabledModules.has(tool.module));
  if (!config.readOnly) return tools;
  return tools.filter((tool) => !tool.isWrite);
}

export interface ToolResult {
  endpoint: string;
  requestTime: string;
  data: unknown;
}

export type ToolRunner = (toolName: string, args: ToolArgs) => Promise<ToolResult>;

export function createToolRunner(client: ToobitRestClient, config: ToobitConfig): ToolRunner {
  const fullConfig: ToobitConfig = { ...config, modules: [...MODULES] as ModuleId[] };
  const tools = allToolSpecs();
  const toolMap = new Map<string, ToolSpec>(tools.map((t) => [t.name, t]));

  return async (toolName: string, args: ToolArgs): Promise<ToolResult> => {
    const tool = toolMap.get(toolName);
    if (!tool) throw new Error(`Unknown tool: ${toolName}`);
    if (config.readOnly && tool.isWrite) {
      throw new Error(`Tool "${toolName}" is a write operation and is blocked in read-only mode.`);
    }
    const result = await tool.handler(args, { config: fullConfig, client });
    return result as ToolResult;
  };
}
