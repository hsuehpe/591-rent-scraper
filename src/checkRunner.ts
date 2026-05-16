import type { Config, HistoryByUrl, Listing } from "./types";

type Crawl = (url: string) => Promise<[string, Listing[]]>;
type Notify = (items: Listing[], city: string) => Promise<void>;
type LoadHistory = (urls: string[]) => HistoryByUrl;
type SaveHistory = (history: HistoryByUrl) => void;

interface Logger {
  log(message: string): void;
  error(message: string): void;
}

export interface CheckForNewListingsDependencies {
  crawl: Crawl;
  notify: Notify;
  loadHistory: LoadHistory;
  saveHistory: SaveHistory;
  logger: Logger;
  now: () => Date;
}

function formatTaipeiTime(date: Date): string {
  return date.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function checkForNewListings(
  config: Config,
  dependencies: CheckForNewListingsDependencies,
): Promise<void> {
  const history = dependencies.loadHistory(config.urls);

  for (const url of config.urls) {
    const now = formatTaipeiTime(dependencies.now());

    try {
      const [city, data] = await dependencies.crawl(url);
      const oldLinks = history[url]?.map((item) => item.link) || [];
      const newItems = data.filter((item) => !oldLinks.includes(item.link));

      if (newItems.length > 0) {
        if (oldLinks.length === 0) {
          history[url] = data;
          continue;
        }

        dependencies.logger.log(
          `[${now}] ${city} 新增 ${newItems.length} 筆新房源`,
        );
        await dependencies.notify(newItems, city);
      } else {
        dependencies.logger.log(`[${now}] ${city} 沒有新資料`);
      }

      history[url] = data;
    } catch (error) {
      dependencies.logger.error(
        `[${now}] ${url} 檢查失敗: ${getErrorMessage(error)}`,
      );
    }
  }

  dependencies.saveHistory(history);
}
