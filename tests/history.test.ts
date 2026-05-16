import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadHistory, saveHistory } from "../src/utils/history";
import type { HistoryByUrl, HistoryFileV1, Listing } from "../src/types";

const urlA = "https://rent.591.com.tw/list?region=1";
const urlB = "https://rent.591.com.tw/list?region=3";
const listingA: Listing = {
  id: "a",
  title: "A",
  link: "https://rent.591.com.tw/a",
};
const listingB: Listing = {
  id: "b",
  title: "B",
  link: "https://rent.591.com.tw/b",
};

function tempHistoryFile(): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "591-history-")), "591_data.json");
}

{
  const file = tempHistoryFile();
  assert.deepEqual(loadHistory([urlA, urlB], file), {
    [urlA]: [],
    [urlB]: [],
  });
}

{
  const file = tempHistoryFile();
  fs.writeFileSync(file, JSON.stringify([[listingA], [listingB]]), "utf8");

  assert.deepEqual(loadHistory([urlB, urlA], file), {
    [urlB]: [listingA],
    [urlA]: [listingB],
  });
}

{
  const file = tempHistoryFile();
  const historyFile: HistoryFileV1 = {
    version: 1,
    searches: {
      [urlA]: [listingA],
      [urlB]: [listingB],
    },
  };
  fs.writeFileSync(file, JSON.stringify(historyFile), "utf8");

  assert.deepEqual(loadHistory([urlB, urlA], file), {
    [urlB]: [listingB],
    [urlA]: [listingA],
  });
}

{
  const file = tempHistoryFile();
  fs.writeFileSync(file, JSON.stringify({ bad: true }), "utf8");

  assert.deepEqual(loadHistory([urlA], file), {
    [urlA]: [],
  });
}

{
  const file = tempHistoryFile();
  const history: HistoryByUrl = {
    [urlA]: [listingA],
  };
  saveHistory(history, file);

  assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), {
    version: 1,
    searches: history,
  });
}
