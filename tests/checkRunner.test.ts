import assert from "node:assert/strict";
import { checkForNewListings } from "../src/checkRunner";
import type { Config, HistoryByUrl, Listing } from "../src/types";

const urlA = "https://rent.591.com.tw/list?region=1";
const urlB = "https://rent.591.com.tw/list?region=3";
const oldA: Listing = {
  id: "old-a",
  title: "Old A",
  link: "https://rent.591.com.tw/old-a",
};
const oldB: Listing = {
  id: "old-b",
  title: "Old B",
  link: "https://rent.591.com.tw/old-b",
};
const newB: Listing = {
  id: "new-b",
  title: "New B",
  link: "https://rent.591.com.tw/new-b",
};

const config: Config = {
  urls: [urlA, urlB],
  intervalMinutes: 10,
  fetchCount: 30,
};

export async function runCheckRunnerTests(): Promise<void> {
  {
    const initialHistory: HistoryByUrl = {
      [urlA]: [oldA],
      [urlB]: [oldB],
    };
    let savedHistory: HistoryByUrl | undefined;
    const notified: Array<{ city: string; items: Listing[] }> = [];
    const errors: string[] = [];

    await checkForNewListings(config, {
      loadHistory: () => initialHistory,
      saveHistory: (history) => {
        savedHistory = history;
      },
      crawl: async (url) => {
        if (url === urlA) throw new Error("timeout");
        return ["新北市", [oldB, newB]];
      },
      notify: async (items, city) => {
        notified.push({ city, items });
      },
      logger: {
        log: () => undefined,
        error: (message) => {
          errors.push(message);
        },
      },
      now: () => new Date("2026-05-16T04:00:00.000Z"),
    });

    assert.deepEqual(notified, [{ city: "新北市", items: [newB] }]);
    assert.deepEqual(savedHistory, {
      [urlA]: [oldA],
      [urlB]: [oldB, newB],
    });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /檢查失敗/);
  }

  {
    let savedHistory: HistoryByUrl | undefined;
    let notificationCount = 0;

    await checkForNewListings(
      { ...config, urls: [urlA] },
      {
        loadHistory: () => ({ [urlA]: [] }),
        saveHistory: (history) => {
          savedHistory = history;
        },
        crawl: async () => ["台北市", [oldA]],
        notify: async () => {
          notificationCount += 1;
        },
        logger: {
          log: () => undefined,
          error: () => undefined,
        },
        now: () => new Date("2026-05-16T04:00:00.000Z"),
      },
    );

    assert.equal(notificationCount, 0);
    assert.deepEqual(savedHistory, {
      [urlA]: [oldA],
    });
  }
}
