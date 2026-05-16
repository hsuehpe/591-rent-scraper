import fs from "node:fs";
import configJson from "../../config.json";
import type { Config, History } from "../types";

const config = configJson as Config;
const historyFile = "591_data.json";

export function loadHistory(): History {
  try {
    const raw = JSON.parse(fs.readFileSync(historyFile, "utf8")) as unknown;
    const storedHistory = Array.isArray(raw) ? raw : [];
    const history: History = [];

    config.urls.forEach((_, index) => {
      const items = storedHistory[index];
      history[index] = Array.isArray(items) ? items : [];
    });

    return history;
  } catch {
    const emptyHistory: History = [];

    config.urls.forEach((_, index) => {
      emptyHistory[index] = [];
    });

    return emptyHistory;
  }
}

export function saveHistory(history: History): void {
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), "utf8");
}
