import { statSync } from "node:fs";
import { configFilePath } from "./toml.js";
import { loadConfig } from "../config.js";
import type { DeltaConfig, CliOptions } from "../config.js";
import { DeltaRestClient } from "../client/rest-client.js";

export class ConfigWatcher {
  private config: DeltaConfig;
  private client: DeltaRestClient;
  private lastMtimeMs: number;
  private readonly cliOptions: CliOptions;
  private onReload?: (config: DeltaConfig) => void;

  constructor(initialConfig: DeltaConfig, cliOptions: CliOptions) {
    this.config = initialConfig;
    this.client = new DeltaRestClient(initialConfig);
    this.cliOptions = cliOptions;
    this.lastMtimeMs = this.fileMtimeMs();
  }

  setReloadCallback(fn: (config: DeltaConfig) => void): void {
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
      this.client = new DeltaRestClient(newConfig);
      this.lastMtimeMs = currentMs;

      const keyChanged = oldKey !== newConfig.apiKey;
      this.onReload?.(newConfig);
      if (keyChanged) {
        process.stderr.write(
          `[delta] Config reloaded — API key changed (${configFilePath()})\n`,
        );
      } else {
        process.stderr.write(
          `[delta] Config reloaded (${configFilePath()})\n`,
        );
      }
      return true;
    } catch (err) {
      process.stderr.write(
        `[delta] Config reload failed, keeping previous config: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      this.lastMtimeMs = currentMs;
      return false;
    }
  }

  getConfig(): DeltaConfig {
    this.refresh();
    return this.config;
  }

  getClient(): DeltaRestClient {
    this.refresh();
    return this.client;
  }
}
