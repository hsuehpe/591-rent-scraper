import "dotenv/config";
import axios from "axios";
import type { Listing } from "../types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function sendDiscordNotification(
  items: Listing[],
  city: string,
): Promise<void> {
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!discordWebhookUrl) return;

  try {
    await axios.post(discordWebhookUrl, {
      content: `📢 **在 ${city} 發現 ${items.length} 筆新房源**`,
    });

    for (const item of items) {
      await axios.post(discordWebhookUrl, {
        content: item.link,
      });
      await delay(300);
    }

    console.log(`✅ Discord 已通知在 ${city} 的新物件`);
  } catch (error) {
    console.error("❌ 傳送 Discord 通知失敗:", getErrorMessage(error));
  }
}
