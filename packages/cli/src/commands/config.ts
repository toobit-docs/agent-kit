import * as readline from "node:readline";
import {
  configFilePath,
  readFullConfig,
  writeFullConfig,
} from "@agent-toobitkit/core";
import type { CliParsed } from "../parser.js";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function handleConfigCommand(cli: CliParsed): Promise<void> {
  switch (cli.subcommand) {
    case "init": {
      process.stdout.write("Toobit API Configuration Wizard\n\n");
      const profileName = (await prompt("Profile name (default: live): ")) || "live";
      const apiKey = await prompt("API Key: ");
      const secretKey = await prompt("Secret Key: ");

      if (!apiKey || !secretKey) {
        process.stdout.write("API Key and Secret Key are required.\n");
        return;
      }

      const config = readFullConfig();
      config.default_profile = config.default_profile ?? profileName;
      if (!config.profiles) config.profiles = {};
      config.profiles[profileName] = { api_key: apiKey, secret_key: secretKey };
      writeFullConfig(config);
      process.stdout.write(`\n✓ Saved to ${configFilePath()}\n  Profile: ${profileName}\n`);
      break;
    }
    case "show": {
      const config = readFullConfig();
      process.stdout.write(`Config file: ${configFilePath()}\n\n`);
      process.stdout.write(`Default profile: ${config.default_profile ?? "(none)"}\n`);
      process.stdout.write(`Profiles: ${Object.keys(config.profiles ?? {}).join(", ") || "(none)"}\n`);
      break;
    }
    case "list-profiles":
    case "list": {
      const config = readFullConfig();
      const profiles = Object.keys(config.profiles ?? {});
      if (profiles.length === 0) {
        process.stdout.write("No profiles configured.\n");
      } else {
        for (const name of profiles) {
          const marker = name === config.default_profile ? " (default)" : "";
          process.stdout.write(`  ${name}${marker}\n`);
        }
      }
      break;
    }
    default:
      process.stdout.write(`Unknown config subcommand: ${cli.subcommand}\nAvailable: init, show, list\n`);
  }
}
