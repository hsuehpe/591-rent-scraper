import configJson from "../config.json";
import { crawlOnePage } from "./crawler/crawlOnePage";
import type { Config } from "./types";
import { loadHistory, saveHistory } from "./utils/history";
import { sendDiscordNotification } from "./utils/notify";

const config = configJson as Config;
const intervalMs = config.intervalMinutes * 60 * 1000;

async function checkForNewListings(): Promise<void> {
  const history = loadHistory();

  for (let i = 0; i < history.length; i += 1) {
    const now = new Date().toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });
    const url = config.urls[i];
    if (!url) continue;

    const [city, data] = await crawlOnePage(url);
    const oldLinks = history[i]?.map((item) => item.link) || [];
    const newItems = data.filter((item) => !oldLinks.includes(item.link));

    if (newItems.length > 0) {
      if (oldLinks.length === 0) {
        history[i] = data;
        continue;
      }

      console.log(`[${now}] ${city} 新增 ${newItems.length} 筆新房源`);
      await sendDiscordNotification(newItems, city);
    } else {
      console.log(`[${now}] ${city} 沒有新資料`);
    }

    history[i] = data;
  }

  saveHistory(history);
}

setInterval(checkForNewListings, intervalMs);
void checkForNewListings();
