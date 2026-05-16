import { checkForNewListings } from "./checkRunner";
import { loadConfig } from "./config";
import { crawlOnePage } from "./crawler/crawlOnePage";
import { loadHistory, saveHistory } from "./utils/history";
import { sendDiscordNotification } from "./utils/notify";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function start(): void {
  try {
    const config = loadConfig();
    const intervalMs = config.intervalMinutes * 60 * 1000;
    const runOnce = async (): Promise<void> => {
      await checkForNewListings(config, {
        crawl: crawlOnePage,
        notify: sendDiscordNotification,
        loadHistory,
        saveHistory,
        logger: console,
        now: () => new Date(),
      });
    };

    setInterval(() => {
      void runOnce();
    }, intervalMs);
    void runOnce();
  } catch (error) {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
  }
}

start();
