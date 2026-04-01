import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { parse, stringify } from "smol-toml";

export { stringify as tomlStringify };

export interface DeltaProfile {
  api_key?: string;
  secret_key?: string;
  base_url?: string;
  timeout_ms?: number;
}

export interface DeltaTomlConfig {
  default_profile?: string;
  profiles: Record<string, DeltaProfile>;
}

export function configFilePath(): string {
  return join(homedir(), ".delta", "config.toml");
}

export function readFullConfig(): DeltaTomlConfig {
  const path = configFilePath();
  if (!existsSync(path)) return { profiles: {} };
  const raw = readFileSync(path, "utf-8");
  return parse(raw) as unknown as DeltaTomlConfig;
}

export function readTomlProfile(profileName?: string): DeltaProfile {
  const config = readFullConfig();
  const name = profileName ?? config.default_profile ?? "default";
  return config.profiles?.[name] ?? {};
}

export function writeFullConfig(config: DeltaTomlConfig): void {
  const path = configFilePath();
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, stringify(config as unknown as Record<string, unknown>), "utf-8");
}
