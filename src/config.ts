import configJson from "../config.json";
import type { Config } from "./types";

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`Invalid config.json: ${message}`);
    this.name = "ConfigValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseConfig(value: unknown): Config {
  if (!isRecord(value)) {
    throw new ConfigValidationError("config must be an object");
  }

  const { urls, intervalMinutes, fetchCount } = value;

  if (!Array.isArray(urls) || urls.length === 0) {
    throw new ConfigValidationError("urls must contain at least one URL");
  }

  urls.forEach((url, index) => {
    if (typeof url !== "string" || url.trim().length === 0) {
      throw new ConfigValidationError(
        `urls[${index}] must be a non-empty string`,
      );
    }
  });

  if (
    typeof intervalMinutes !== "number" ||
    !Number.isFinite(intervalMinutes) ||
    intervalMinutes <= 0
  ) {
    throw new ConfigValidationError("intervalMinutes must be a positive number");
  }

  if (
    typeof fetchCount !== "number" ||
    !Number.isInteger(fetchCount) ||
    fetchCount <= 0
  ) {
    throw new ConfigValidationError("fetchCount must be a positive integer");
  }

  return {
    urls,
    intervalMinutes,
    fetchCount,
  };
}

export function loadConfig(): Config {
  return parseConfig(configJson);
}
