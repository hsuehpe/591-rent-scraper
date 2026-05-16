import fs from "node:fs";
import type { HistoryByUrl, HistoryFileV1, Listing } from "../types";

const historyFile = "591_data.json";

function emptyHistory(urls: string[]): HistoryByUrl {
  return Object.fromEntries(urls.map((url) => [url, []]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isListing(value: unknown): value is Listing {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.link === "string"
  );
}

function toListingArray(value: unknown): Listing[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isListing);
}

function parseHistory(raw: unknown, urls: string[]): HistoryByUrl {
  if (Array.isArray(raw)) {
    return Object.fromEntries(
      urls.map((url, index) => [url, toListingArray(raw[index])]),
    );
  }

  if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.searches)) {
    return emptyHistory(urls);
  }

  const searches = raw.searches;

  return Object.fromEntries(
    urls.map((url) => [url, toListingArray(searches[url])]),
  );
}

export function loadHistory(
  urls: string[],
  filePath: string = historyFile,
): HistoryByUrl {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    return parseHistory(raw, urls);
  } catch {
    return emptyHistory(urls);
  }
}

export function saveHistory(
  history: HistoryByUrl,
  filePath: string = historyFile,
): void {
  const historyFileContent: HistoryFileV1 = {
    version: 1,
    searches: history,
  };

  fs.writeFileSync(
    filePath,
    JSON.stringify(historyFileContent, null, 2),
    "utf8",
  );
}
