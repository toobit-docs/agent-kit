import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import {
  ToobitRestClient,
  buildTools,
  MODULES,
  ToobitApiError,
  toToolErrorPayload,
  toMcpTool,
} from "@toobit_agent/agent-toobitkit-core";
import type { ToobitConfig, ModuleId, ToolSpec } from "@toobit_agent/agent-toobitkit-core";
import type { TradeLogger, ConfigWatcher } from "@toobit_agent/agent-toobitkit-core";
import { SERVER_NAME, SERVER_VERSION } from "./constants.js";

const SYSTEM_CAPABILITIES_TOOL_NAME = "system_get_capabilities";
const SYSTEM_CAPABILITIES_TOOL: Tool = {
  name: SYSTEM_CAPABILITIES_TOOL_NAME,
  description: "Return machine-readable server capabilities and module availability for agent planning.",
  inputSchema: { type: "object", additionalProperties: false },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

type ModuleCapabilityStatus = "enabled" | "disabled" | "requires_auth";

interface CapabilitySnapshot {
  readOnly: boolean;
  hasAuth: boolean;
  moduleAvailability: Record<ModuleId, { status: ModuleCapabilityStatus; reasonCode?: string }>;
}

function buildCapabilitySnapshot(config: ToobitConfig): CapabilitySnapshot {
  const enabledModules = new Set(config.modules);
  const moduleAvailability = {} as CapabilitySnapshot["moduleAvailability"];

  for (const moduleId of MODULES) {
    if (!enabledModules.has(moduleId)) {
      moduleAvailability[moduleId] = { status: "disabled", reasonCode: "MODULE_FILTERED" };
      continue;
    }
    if (moduleId === "market") {
      moduleAvailability[moduleId] = { status: "enabled" };
      continue;
    }
    if (!config.hasAuth) {
      moduleAvailability[moduleId] = { status: "requires_auth", reasonCode: "AUTH_MISSING" };
      continue;
    }
    moduleAvailability[moduleId] = { status: "enabled" };
  }

  return { readOnly: config.readOnly, hasAuth: config.hasAuth, moduleAvailability };
}

function successResult(toolName: string, data: unknown, snap: CapabilitySnapshot): CallToolResult {
  const payload: Record<string, unknown> = {
    tool: toolName,
    ok: true,
    data,
    capabilities: snap,
    timestamp: new Date().toISOString(),
  };
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

function errorResult(toolName: string, error: unknown, snap: CapabilitySnapshot): CallToolResult {
  const payload = toToolErrorPayload(error);
  const structured: Record<string, unknown> = {
    tool: toolName,
    ...payload,
    serverVersion: SERVER_VERSION,
    capabilities: snap,
  };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(structured, null, 2) }],
    structuredContent: structured,
  };
}

function unknownToolResult(toolName: string, snap: CapabilitySnapshot): CallToolResult {
  return errorResult(
    toolName,
    new ToobitApiError(`Tool "${toolName}" is not available in this server session.`, {
      code: "TOOL_NOT_AVAILABLE",
      suggestion: "Call list_tools again and choose from currently available tools.",
    }),
    snap,
  );
}

export function createServer(config: ToobitConfig, logger?: TradeLogger, watcher?: ConfigWatcher): Server {
  let tools = buildTools(config);
  let toolMap = new Map<string, ToolSpec>(tools.map((tool) => [tool.name, tool]));

  if (watcher) {
    watcher.setReloadCallback((newConfig) => {
      tools = buildTools(newConfig);
      toolMap = new Map<string, ToolSpec>(tools.map((tool) => [tool.name, tool]));
    });
  }

  const resolveConfig = (): ToobitConfig => watcher ? watcher.getConfig() : config;
  const resolveClient = (): ToobitRestClient => watcher ? watcher.getClient() : staticClient;
  const staticClient = watcher ? undefined! : new ToobitRestClient(config);

  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    watcher?.refresh();
    return { tools: [...tools.map(toMcpTool), SYSTEM_CAPABILITIES_TOOL] };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const liveConfig = resolveConfig();

    if (toolName === SYSTEM_CAPABILITIES_TOOL_NAME) {
      const snapshot = buildCapabilitySnapshot(liveConfig);
      return successResult(toolName, {
        server: { name: SERVER_NAME, version: SERVER_VERSION },
        capabilities: snapshot,
      }, snapshot);
    }

    const tool = toolMap.get(toolName);
    if (!tool) return unknownToolResult(toolName, buildCapabilitySnapshot(liveConfig));

    const startTime = Date.now();
    try {
      const response = await tool.handler(request.params.arguments ?? {}, { config: liveConfig, client: resolveClient() });
      logger?.log("info", toolName, request.params.arguments ?? {}, response, Date.now() - startTime);
      return successResult(toolName, response, buildCapabilitySnapshot(liveConfig));
    } catch (error) {
      const level = error instanceof ToobitApiError ? "warn" : "error";
      logger?.log(level, toolName, request.params.arguments ?? {}, error, Date.now() - startTime);
      return errorResult(toolName, error, buildCapabilitySnapshot(liveConfig));
    }
  });

  return server;
}
