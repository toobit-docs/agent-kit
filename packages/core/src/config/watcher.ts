import { statSync } from "node:fs";
import { configFilePath } from "./toml.js";
import { loadConfig } from "../config.js";
import type { ToobitConfig, CliOptions } from "../config.js";
import { ToobitRestClient } from "../client/rest-client.js";

export class ConfigWatcher {
  private config: ToobitConfig;
  private client: ToobitRestClient;
  private lastMtimeMs: number;
  private readonly cliOptions: CliOptions;
  private onReload?: (config: ToobitConfig) => void;

  constructor(initialConfig: ToobitConfig, cliOptions: CliOptions) {
    this.config = initialConfig;
    this.client = new ToobitRestClient(initialConfig);
    this.cliOptions = cliOptions;
    this.lastMtimeMs = this.fileMtimeMs();
  }

  setReloadCallback(fn: (config: ToobitConfig) => void): void {
    this.onReload = fn;
  }

  private fileMtimeMs(): number {
    try {
      return statSync(configFilePath()).mtimeMs;
    } catch {
      return 0;
    }
  }

  /**
   * Check config.toml mtime; reload if file was modified since last load.
   * Returns true when a reload occurred.
   * Errors during reload are suppressed — the previous valid config stays active.
   */
  refresh(): boolean {
    const currentMs = this.fileMtimeMs();
    if (currentMs === this.lastMtimeMs) return false;

    try {
      const newConfig = loadConfig(this.cliOptions);
      const oldKey = this.config.apiKey;
      this.config = newConfig;
      this.client = new ToobitRestClient(newConfig);
      this.lastMtimeMs = currentMs;

      const keyChanged = oldKey !== newConfig.apiKey;
      this.onReload?.(newConfig);
      if (keyChanged) {
        process.stderr.write(
          `[toobit] Config reloaded — API key changed (${configFilePath()})\n`,
        );
      } else {
        process.stderr.write(
          `[toobit] Config reloaded (${configFilePath()})\n`,
        );
      }
      return true;
    } catch (err) {
      process.stderr.write(
        `[toobit] Config reload failed, keeping previous config: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      this.lastMtimeMs = currentMs;
      return false;
    }
  }

  getConfig(): ToobitConfig {
    this.refresh();
    return this.config;
  }

  getClient(): ToobitRestClient {
    this.refresh();
    return this.client;
  }
}
